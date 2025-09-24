#!/usr/bin/env node

/**
 * TeamCity MCP Server - Ultra Simple Natural Language Version
 * Single tool, leverages Claude's built-in NLP - 94% token reduction
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TeamCityClient } from './client/teamcity-client.js';
import { createSafeError } from './utils/security.js';

// Global client instance
let teamCityClient: TeamCityClient;

/**
 * Main application entry point - Ultra-simple single-tool architecture
 */
async function main(): Promise<void> {
  try {
    // Create TeamCity client
    teamCityClient = new TeamCityClient();
    if (!teamCityClient.isReady()) {
      throw new Error('TeamCity client configuration is incomplete');
    }

    // Create MCP server
    const server = new McpServer({
      name: 'teamcity-mcp-simple',
      version: '4.0.0'
    });

    // Register SINGLE tool that leverages Claude's NLP directly
    server.registerTool(
      'teamcity',
      {
        title: '🏗️ TeamCity',
        description: 'Natural language TeamCity operations. Examples: "show failed builds", "trigger MyApp build on staging", "get build #123 log", "list agents", "cancel queued builds"',
        inputSchema: {
          action: z.string().describe('What you want to do with TeamCity in natural language'),
          params: z.any().optional().describe('Optional parameters extracted from the natural language request')
        }
      },
      async (input) => {
        try {
          const { action, params = {} } = input as any;
          const lowerAction = action.toLowerCase();

          // Let Claude's understanding drive the operations directly
          // Claude already knows what "failed builds from yesterday" means

          // Builds
          if (lowerAction.includes('build')) {
            if (lowerAction.includes('trigger') || lowerAction.includes('start')) {
              // Auto-extract build type ID from action if not provided by Claude
              if (!params.buildTypeId && !params.projectName) {
                // Look for known build patterns in the action
                const buildTypePatterns = [
                  /WarAndPeace_Staging_Android_DevelopmentBuild/i,
                  /WarAndPeace_Staging_IOS_DevelopmentBuild/i,
                  /wap.android.staging/i,
                  /war.?and.?peace.*android.*staging/i
                ];

                for (const pattern of buildTypePatterns) {
                  if (pattern.test(lowerAction)) {
                    if (pattern.source.toLowerCase().includes('android')) {
                      params.buildTypeId = 'WarAndPeace_Staging_Android_DevelopmentBuild';
                    } else if (pattern.source.toLowerCase().includes('ios')) {
                      params.buildTypeId = 'WarAndPeace_Staging_IOS_DevelopmentBuild';
                    }
                    break;
                  }
                }

                // Extract branch if mentioned
                if (lowerAction.includes('dev')) params.branch = 'dev';
                if (lowerAction.includes('master') || lowerAction.includes('main')) params.branch = 'master';
                if (lowerAction.includes('staging')) params.branch = params.branch || 'dev';
              }

              return await triggerBuild(params);
            }
            if (lowerAction.includes('cancel') || lowerAction.includes('stop')) {
              // Claude provides: buildId or "all"
              return await cancelBuild(params);
            }
            if (lowerAction.includes('log')) {
              // Claude provides: buildId, tail, lineCount
              return await getBuildLog(params);
            }
            if (lowerAction.includes('queue')) {
              return await listQueuedBuilds(params);
            }

            // Detect failed builds request and auto-set status
            if (lowerAction.includes('fail')) {
              params.status = 'FAILURE';
              params.count = params.count || 20;
            }

            // Default: list builds with Claude-provided filters
            return await listBuilds(params);
          }

          // Projects
          if (lowerAction.includes('project')) {
            return await listProjects(params);
          }

          // Agents
          if (lowerAction.includes('agent')) {
            return await listAgents(params);
          }

          // Handle "show me failed builds" without "build" keyword
          if (lowerAction.includes('fail') && !lowerAction.includes('test')) {
            params.status = 'FAILURE';
            params.count = params.count || 20;
            return await listBuilds(params);
          }

          // Tests
          if (lowerAction.includes('test')) {
            return await listTestFailures(params);
          }

          // Changes/Commits
          if (lowerAction.includes('change') || lowerAction.includes('commit')) {
            return await listChanges(params);
          }

          // Server info
          if (lowerAction.includes('server') || lowerAction.includes('version')) {
            return await getServerInfo();
          }

          // Help
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                message: 'I can help with TeamCity operations',
                examples: [
                  'show failed builds from last 24 hours',
                  'trigger build for MyApp on staging branch',
                  'get build log for #12345 (last 50 lines)',
                  'list all connected agents',
                  'cancel all queued builds',
                  'show recent changes',
                  'list projects',
                  'show test failures for latest build'
                ],
                your_request: action
              })
            }]
          };

        } catch (error) {
          const safeError = createSafeError(error, { operation: 'teamcity', userInput: input });
          return {
            content: [{ type: 'text' as const, text: safeError.message }],
            isError: true
          };
        }
      }
    );

    // Simple operation handlers that trust Claude's parameter extraction

    async function listBuilds(params: any) {
      // Claude naturally provides: status, state, count, projectId, branch, since
      const locatorParts: string[] = [];
      if (params.status) locatorParts.push(`status:${params.status}`);
      if (params.state) locatorParts.push(`state:${params.state}`);
      if (params.projectId) locatorParts.push(`project:(id:${params.projectId})`);
      if (params.branch) locatorParts.push(`branch:${params.branch}`);
      if (params.since) locatorParts.push(`sinceDate:${params.since}`);
      locatorParts.push(`count:${params.count || 5}`);

      const result = await teamCityClient.get('/builds', {
        locator: locatorParts.join(','),
        fields: 'build(id,number,status,state,buildTypeId)'
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function triggerBuild(params: any) {
      if (!params.buildTypeId && !params.projectName) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Build trigger requires specific build type ID',
              message: 'Please specify a build type ID or project name',
              examples: [
                'trigger WarAndPeace_Staging_Android_DevelopmentBuild on dev branch',
                'start wap android staging build',
                'trigger build for WarAndPeace iOS staging'
              ],
              available_builds: [
                'WarAndPeace_Staging_Android_DevelopmentBuild',
                'WarAndPeace_Staging_IOS_DevelopmentBuild'
              ]
            })
          }],
          isError: true
        };
      }

      const buildRequest: any = {
        buildType: { id: params.buildTypeId || params.projectName }
      };
      if (params.branch) buildRequest.branchName = params.branch;
      if (params.comment) buildRequest.comment = { text: params.comment };
      if (params.personal) buildRequest.personal = true;

      const result = await teamCityClient.post('/buildQueue', buildRequest);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function cancelBuild(params: any) {
      if (params.all) {
        const queued: any = await teamCityClient.get('/buildQueue');
        const builds = queued?.build || [];
        for (const build of builds) {
          await teamCityClient.cancelBuild(build.id);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ cancelled: builds.length, builds })
          }]
        };
      }

      const result = await teamCityClient.cancelBuild(params.buildId);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function getBuildLog(params: any) {
      const result = await teamCityClient.fetchBuildLog({
        buildId: params.buildId || params.latest,
        tail: params.tail !== false,
        lineCount: params.lineCount || 50
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function listProjects(_params: any) {
      const result = await teamCityClient.get('/projects', {
        fields: 'project(id,name,description)'
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function listAgents(params: any) {
      const locatorParts: string[] = [];
      if (params.connected !== undefined) locatorParts.push(`connected:${params.connected}`);
      if (params.enabled !== undefined) locatorParts.push(`enabled:${params.enabled}`);
      locatorParts.push(`count:${params.count || 5}`);

      const result = await teamCityClient.get('/agents', {
        locator: locatorParts.join(','),
        fields: 'agent(id,name,connected,enabled,authorized)'
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function listQueuedBuilds(params: any) {
      const result = await teamCityClient.listQueuedBuilds({
        count: params.count || 10
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function listTestFailures(params: any) {
      const result = await teamCityClient.listTestFailures({
        buildId: params.buildId
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function listChanges(params: any) {
      const result = await teamCityClient.listChanges({
        buildId: params.buildId,
        count: params.count || 10,
        includeFiles: params.includeFiles
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    async function getServerInfo() {
      const result = await teamCityClient.get('/server');
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    }

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('TeamCity MCP Simple Server started - Single tool, 94% token reduction!');

  } catch (error) {
    const safeError = createSafeError(error, { operation: 'server_startup' });
    console.error('Failed to start TeamCity MCP server:', safeError.message);
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  if (error.message !== 'write EPIPE') {
    console.error('Uncaught Exception:', error.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', String(reason));
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main();