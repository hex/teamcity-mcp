# TeamCity MCP Server - Security Audit Context

## Project Overview
- **Name**: TeamCity MCP Server
- **Version**: 4.1.1  
- **Purpose**: Model Context Protocol server for TeamCity integration with Claude Desktop and Claude Code
- **Architecture**: Ultra-simple single-tool natural language implementation (94% token reduction from v3.x)

## Tech Stack
- **Language**: TypeScript with strict type safety
- **Runtime**: Node.js >=18.0.0
- **Key Dependencies**:
  - @modelcontextprotocol/sdk: ^1.0.0 (MCP protocol)
  - axios: ^1.7.2 (HTTP client)
  - zod: ^3.23.8 (validation schemas)
  - p-retry: ^7.0.0 (retry logic)
- **Dev Dependencies**: TypeScript, tsx, vitest, @types/node

## Architecture & Security Features
- Single MCP tool with natural language processing
- Comprehensive input validation and sanitization
- Secure error handling with sensitive data redaction
- Environment-based credential management
- Rate limiting and size constraints
- HTTPS/TLS enforcement

## Key Commands
- `npm run build` - Compile TypeScript
- `npm test` - Run security and integration tests  
- `npm run dev` - Development mode
- `npm start` - Production mode

## File Structure
- `src/index.ts` - Main MCP server entry point
- `src/client/teamcity-client.ts` - Secure TeamCity API client
- `src/utils/security.ts` - Security utilities and error handling
- `test/` - Test suite including security tests