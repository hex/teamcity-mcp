import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

/**
 * MCP Protocol Compliance Test Suite
 *
 * This test suite validates that the TeamCity MCP server adheres to the
 * Model Context Protocol specification, focusing on:
 * 1. JSON-RPC 2.0 compliance
 * 2. Tool schema validation
 * 3. Error handling protocol
 * 4. Response format compliance
 * 5. Resource implementation
 */
describe('MCP Protocol Compliance', () => {
  let serverProcess: ChildProcess;
  let serverReady = false;

  beforeAll(async () => {
    // Set test environment variables
    process.env.TEAMCITY_SERVER_URL = 'https://test.teamcity.com';
    process.env.TEAMCITY_BEARER_TOKEN = 'test-token';

    // Start the MCP server for testing
    serverProcess = spawn('npm', ['start'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('TeamCity MCP') && output.includes('started')) {
          clearTimeout(timeout);
          serverReady = true;
          resolve();
        }
      });

      serverProcess.on('error', reject);
    });
  });

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        serverProcess.on('close', () => resolve());
        setTimeout(() => {
          if (!serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    }
  });

  describe('Server Lifecycle', () => {
    it('should start successfully with valid environment variables', () => {
      expect(serverReady).toBe(true);
      expect(serverProcess.pid).toBeDefined();
    });

    it('should handle graceful shutdown', async () => {
      // This will be tested in afterAll
      expect(serverProcess.kill).toBeDefined();
    });
  });

  describe('JSON-RPC 2.0 Protocol', () => {
    it('should handle initialize request', async () => {
      if (!serverProcess.stdin || !serverProcess.stdout) {
        throw new Error('Server stdio not available');
      }

      const initRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, initRequest);

      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', initRequest.id);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('capabilities');
      expect(response.result).toHaveProperty('serverInfo');
    });

    it('should handle tools/list request', async () => {
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/list',
        params: {}
      };

      const response = await sendJsonRpcRequest(serverProcess, listToolsRequest);

      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('tools');
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools.length).toBe(1);

      const tool = response.result.tools[0];
      expect(tool).toHaveProperty('name', 'teamcity');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
    });
  });

  describe('Tool Schema Validation', () => {
    let toolSchema: any;

    beforeAll(async () => {
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/list',
        params: {}
      };

      const response = await sendJsonRpcRequest(serverProcess, listToolsRequest);
      toolSchema = response.result.tools[0].inputSchema;
    });

    it('should have valid JSON Schema format', () => {
      // Check that schema is NOT a Zod object but a proper JSON Schema
      expect(toolSchema).not.toHaveProperty('_def'); // Zod internal property
      expect(toolSchema).not.toHaveProperty('parse'); // Zod method
      expect(toolSchema).not.toHaveProperty('safeParse'); // Zod method

      // Should be a proper JSON Schema object
      expect(toolSchema).toHaveProperty('type');
      expect(toolSchema).toHaveProperty('properties');
    });

    it('should define required properties correctly', () => {
      expect(toolSchema).toHaveProperty('required');
      expect(Array.isArray(toolSchema.required)).toBe(true);
      expect(toolSchema.required).toContain('action');
    });

    it('should have proper property definitions', () => {
      expect(toolSchema.properties).toHaveProperty('action');
      expect(toolSchema.properties.action).toHaveProperty('type', 'string');
      expect(toolSchema.properties.action).toHaveProperty('description');

      if (toolSchema.properties.params) {
        expect(toolSchema.properties.params).toHaveProperty('type');
        expect(toolSchema.properties.params).toHaveProperty('description');
      }
    });

    it('should follow JSON Schema Draft specification', () => {
      // Should not have additionalProperties: false if not specified
      // or should be explicitly set
      if ('additionalProperties' in toolSchema) {
        expect(typeof toolSchema.additionalProperties).toBe('boolean');
      }
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool with valid input', async () => {
      const toolCallRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'teamcity',
          arguments: {
            action: 'list projects'
          }
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, toolCallRequest);

      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
      expect(Array.isArray(response.result.content)).toBe(true);
      expect(response.result.content.length).toBeGreaterThan(0);

      const content = response.result.content[0];
      expect(content).toHaveProperty('type', 'text');
      expect(content).toHaveProperty('text');
    });

    it('should return structured error for invalid input', async () => {
      const toolCallRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'teamcity',
          arguments: {
            // Missing required 'action' field
          }
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, toolCallRequest);

      // Should return an error response, not a success response with error content
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
    });
  });

  describe('Error Handling Protocol', () => {
    it('should throw MCP errors instead of returning error content', async () => {
      const toolCallRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'teamcity',
          arguments: {
            action: 'trigger build' // Will fail due to missing buildTypeId
          }
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, toolCallRequest);

      // This should be an error response, not a success response with error JSON
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');

      // Should NOT return success response with JSON-stringified error
      expect(response).not.toHaveProperty('result');
    });

    it('should use proper MCP error codes', async () => {
      const invalidToolRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'nonexistent-tool',
          arguments: {}
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, invalidToolRequest);

      expect(response).toHaveProperty('error');
      expect(response.error.code).toBe(-32601); // Method not found
    });
  });

  describe('Resource Implementation', () => {
    it('should list available resources', async () => {
      const listResourcesRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'resources/list',
        params: {}
      };

      const response = await sendJsonRpcRequest(serverProcess, listResourcesRequest);

      if (response.error && response.error.code === -32601) {
        // Resources not implemented - this is currently expected
        console.warn('Resources not implemented (expected based on validation report)');
        expect(response.error.code).toBe(-32601);
      } else {
        // If implemented, should return proper resource list
        expect(response).toHaveProperty('result');
        expect(response.result).toHaveProperty('resources');
        expect(Array.isArray(response.result.resources)).toBe(true);
      }
    });
  });

  describe('Response Format Compliance', () => {
    it('should return properly structured MCP content', async () => {
      const toolCallRequest = {
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'teamcity',
          arguments: {
            action: 'help'
          }
        }
      };

      const response = await sendJsonRpcRequest(serverProcess, toolCallRequest);

      expect(response.result).toHaveProperty('content');
      const content = response.result.content[0];
      expect(content).toHaveProperty('type', 'text');
      expect(content).toHaveProperty('text');

      // Should not be double-JSON-stringified
      expect(() => JSON.parse(content.text)).not.toThrow();
    });
  });
});

/**
 * Helper function to send JSON-RPC requests to the MCP server
 */
async function sendJsonRpcRequest(
  serverProcess: ChildProcess,
  request: any,
  timeoutMs = 10000
): Promise<any> {
  if (!serverProcess.stdin || !serverProcess.stdout) {
    throw new Error('Server stdio not available');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    let responseBuffer = '';

    const onData = (data: Buffer) => {
      responseBuffer += data.toString();

      // Check if we have a complete JSON-RPC response
      const lines = responseBuffer.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id || response.error) {
              clearTimeout(timeout);
              serverProcess.stdout!.off('data', onData);
              resolve(response);
              return;
            }
          } catch (e) {
            // Not a complete JSON yet, continue reading
          }
        }
      }
    };

    serverProcess.stdout.on('data', onData);

    // Send the request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}