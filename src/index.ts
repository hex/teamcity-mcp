#!/usr/bin/env node

/**
 * TeamCity MCP Server - Ultra Simple Natural Language Version
 * Single tool, leverages Claude's built-in NLP
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TeamCityClient } from './client/teamcity-client.js';
import { createSafeError } from './utils/security.js';

// Global client instance
let teamCityClient: TeamCityClient;
/**
 * Creates MCP-compliant errors with proper error codes
 */
function createMcpError(message: string, code: ErrorCode = ErrorCode.InternalError, data?: any): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).data = data;
  return error;
}

/**
 * Main application entry point - Ultra-simple single-tool architecture
 */
async function main(): Promise<void> {
  try {
    // Create TeamCity client
    teamCityClient = new TeamCityClient();
    if (!teamCityClient.isReady()) {
      throw createMcpError('TeamCity client configuration is incomplete', ErrorCode.InternalError, {
        operation: 'client_initialization',
        required: ['TEAMCITY_SERVER_URL', 'TEAMCITY_BEARER_TOKEN']
      });
    }

    // Create MCP server
    const server = new McpServer({
      name: 'teamcity-mcp-simple',
      version: '4.2.4'
    });

    // Register SINGLE tool that leverages Claude's NLP directly
    server.registerTool(
      'teamcity',
      {
        title: '🏗️ TeamCity',
        description: 'Natural language TeamCity operations. Examples: "show failed builds", "trigger MyApp build on staging", "get build #123 log", "list agents", "cancel queued builds"',
        inputSchema: {
          action: z.string().describe('What you want to do with TeamCity in natural language'),
          params: z.record(z.any()).optional().describe('Optional parameters extracted from the natural language request')
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
              // Extract branch if mentioned
              if (lowerAction.includes('dev')) params.branch = 'dev';
              if (lowerAction.includes('master') || lowerAction.includes('main')) params.branch = 'master';
              if (lowerAction.includes('staging')) params.branch = params.branch || 'dev';

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
            // Handle specific build state requests first
            if (lowerAction.includes('running') || lowerAction.includes('active') || lowerAction.includes('current')) {
              params.state = 'running';
              params.count = params.count || 10;
            } else if (lowerAction.includes('queue') && !lowerAction.includes('log')) {
              // Use dedicated queue function for pure queue requests
              if (lowerAction.includes('queue') && !lowerAction.includes('running') && !lowerAction.includes('build')) {
                return await listQueuedBuilds(params);
              }
              params.state = 'queued';
              params.count = params.count || 10;
            } else if (lowerAction.includes('fail')) {
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

          // Artifacts
          if (lowerAction.includes('artifact')) {
            params.action = action; // Pass original action for build ID extraction
            return await listBuildArtifacts(params);
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
                  'show artifacts for build #8507',
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
          // Check if it's already an MCP error and preserve the error code
          if (error && typeof error === 'object' && 'code' in error) {
            throw error; // Re-throw MCP errors as-is
          }
          
          const safeError = createSafeError(error, { operation: 'teamcity', userInput: input });
          throw createMcpError(safeError.message, ErrorCode.InternalError, {
            operation: 'teamcity_tool',
            userAction: (input as any)?.action
          });
        }
      }
    );

    // Add MCP resources for live status dashboards
    server.registerResource('TeamCity Status Overview', 'teamcity://status/overview', {
      name: 'TeamCity Status Overview',
      description: 'Live overview of TeamCity server status, builds, and agents',
      mimeType: 'application/json'
    }, async () => {
      try {
        const [serverInfo, runningBuilds, queuedBuilds, agents] = await Promise.all([
          teamCityClient.get('/server').catch(() => ({ error: 'Failed to fetch server info' })),
          teamCityClient.get('/builds', { 
            locator: 'state:running,count:5',
            fields: 'build(id,number,status,state,buildTypeId,startDate)'
          }).catch(() => ({ build: [] })),
          teamCityClient.get('/buildQueue', {
            fields: 'build(id,buildTypeId,state)'
          }).catch(() => ({ build: [] })),
          teamCityClient.get('/agents', {
            locator: 'count:10',
            fields: 'agent(id,name,connected,enabled,authorized)'
          }).catch(() => ({ agent: [] }))
        ]);

        const overview = {
          timestamp: new Date().toISOString(),
          server: serverInfo,
          summary: {
            runningBuilds: (runningBuilds as any).build?.length || 0,
            queuedBuilds: (queuedBuilds as any).build?.length || 0,
            connectedAgents: (agents as any).agent?.filter((a: any) => a.connected).length || 0,
            totalAgents: (agents as any).agent?.length || 0
          },
          runningBuilds: (runningBuilds as any).build || [],
          queuedBuilds: (queuedBuilds as any).build || [],
          agents: (agents as any).agent || []
        };

        return {
          contents: [{
            uri: 'teamcity://status/overview',
            text: JSON.stringify(overview, null, 2),
            mimeType: 'application/json'
          }]
        };
      } catch (error) {
        const safeError = createSafeError(error, { operation: 'status_overview' });
        return {
          contents: [{
            uri: 'teamcity://status/overview',
            text: JSON.stringify({ error: safeError.message, timestamp: new Date().toISOString() }),
            mimeType: 'application/json'
          }]
        };
      }
    });

    server.registerResource('Recent Builds', 'teamcity://builds/recent', {
      name: 'Recent Builds',
      description: 'Recent builds with their status and details',
      mimeType: 'application/json'
    }, async () => {
      try {
        const result = await teamCityClient.get('/builds', {
          locator: 'count:20',
          fields: 'build(id,number,status,state,buildTypeId,startDate,finishDate)'
        });
        
        return {
          contents: [{
            uri: 'teamcity://builds/recent',
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              builds: (result as any).build || []
            }, null, 2),
            mimeType: 'application/json'
          }]
        };
      } catch (error) {
        const safeError = createSafeError(error, { operation: 'recent_builds' });
        return {
          contents: [{
            uri: 'teamcity://builds/recent',
            text: JSON.stringify({ error: safeError.message, timestamp: new Date().toISOString() }),
            mimeType: 'application/json'
          }]
        };
      }
    });

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
        throw createMcpError('Build trigger requires specific build type ID', ErrorCode.InvalidParams, {
          message: 'Please specify a build type ID or project name',
          examples: [
            'trigger MyProject_Build on dev branch',
            'start build for MyProject on staging',
            'trigger MyProject_Android_Build',
            'start MyProject_iOS_Build on main branch'
          ],
          hint: 'Use "list projects" to see available build configurations'
        });
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

    async function listBuildArtifacts(params: any) {
      if (!params.buildId) {
        // Try to extract build ID from the action text
        const buildIdMatch = params.action?.match(/#?(\d+)/);
        if (buildIdMatch) {
          params.buildId = buildIdMatch[1];
        } else {
          throw createMcpError('Build ID required', ErrorCode.InvalidParams, {
            message: 'Please specify a build ID to list artifacts',
            examples: [
              'show artifacts for build #8507',
              'list artifacts for build 183537'
            ]
          });
        }
      }

      let actualBuildId = params.buildId;

      // If the build ID looks like a build number (e.g., 8507), try to find the actual build ID
      if (params.buildId && /^\d+$/.test(params.buildId)) {
        try {
          const builds = await teamCityClient.get('/builds', {
            locator: `number:${params.buildId},count:1`
          });

          if (builds && (builds as any).build && (builds as any).build.length > 0) {
            actualBuildId = (builds as any).build[0].id;
          }
        } catch (error) {
          // If we can't find by number, try the original ID
        }
      }

      try {
        const result = await teamCityClient.get(`/builds/id:${actualBuildId}/artifacts/children`);

        // Parse and format the response (JSON from client)
        if (result && typeof result === 'object' && (result as any).file) {
          const files = ((result as any).file || []).map((file: any) => ({
            name: file.name,
            size: file.size,
            sizeFormatted: formatBytes(file.size),
            modificationTime: file.modificationTime
          }));

          const totalSize = files.reduce((sum: number, file: any) => sum + file.size, 0);

          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                buildId: actualBuildId,
                buildNumber: params.buildId,
                artifactCount: files.length,
                totalSize: formatBytes(totalSize),
                artifacts: files
              })
            }]
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result)
          }]
        };
      } catch (error: any) {
        if (error.message?.includes('404')) {
          throw createMcpError('Build not found', ErrorCode.InvalidParams, {
            buildId: actualBuildId,
            buildNumber: params.buildId,
            message: 'The specified build ID was not found or has no artifacts'
          });
        }
        throw error;
      }
    }

    function formatBytes(bytes: number): string {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

    console.error('TeamCity MCP Simple Server started!');

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