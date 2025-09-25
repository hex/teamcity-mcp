# Tech Stack and Conventions

## Code Style and Conventions
- **TypeScript**: Strict type checking with comprehensive compiler flags
- **ES Modules**: Using import/export syntax with .js extensions for compiled output
- **Naming Conventions**: 
  - camelCase for variables and functions
  - PascalCase for classes and types
  - UPPER_SNAKE_CASE for constants
- **Error Handling**: Centralized secure error handling with sanitization
- **Security First**: All inputs validated and sanitized, sensitive data redacted
- **Logging**: Minimal logging to prevent EPIPE errors in MCP mode

## Dependencies
### Runtime Dependencies
- `@modelcontextprotocol/sdk@^1.0.0`: MCP protocol implementation
- `axios@^1.7.2`: HTTP client with interceptors and security features
- `p-retry@^7.0.0`: Retry logic for resilient API calls
- `zod@^3.23.8`: Schema validation and type safety

### Development Dependencies
- `typescript@^5.5.0`: TypeScript compiler
- `tsx@^4.15.0`: TypeScript execution for development
- `vitest@^2.0.0`: Testing framework
- `@types/node@^20.14.0`: Node.js type definitions

## Architecture Patterns
- **Single Tool Architecture**: One natural language tool instead of 30+ specific tools
- **Secure by Default**: All inputs sanitized, all outputs safe
- **Error Boundary Pattern**: Centralized error handling with context
- **Interceptor Pattern**: Request/response interceptors for cross-cutting concerns
- **Validation Pattern**: Zod schemas for runtime type checking
- **Resource Limiting**: Size limits for responses, timeouts for requests

## File Organization
- `src/index.ts`: Main application entry point with tool registration
- `src/client/teamcity-client.ts`: Secure TeamCity REST API client
- `src/utils/security.ts`: Security utilities and error handling
- `test/`: Unit and integration tests
- `dist/`: Compiled JavaScript output