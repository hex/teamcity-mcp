# AGENTS.md - TeamCity MCP Development Guide

## Build/Test Commands
- **Build**: `npm run build` - Compiles TypeScript to ./dist/
- **Test**: `npm test` (vitest run) or `npm run test:watch` (vitest watch)
- **Single Test**: `npx vitest run test/integration.test.ts` or `npx vitest <pattern>`
- **Development**: `npm run dev` - Runs src/index.ts with tsx
- **Clean**: `npm run clean` - Removes dist/ folder

## Code Style & Conventions

### TypeScript Configuration
- **Target**: ES2022, ESNext modules, Node.js environment
- **Strict mode**: All strict options enabled + security-focused checks
- **No unused locals/parameters**, **no implicit returns**, **strict null checks**
- **Module**: ESNext with .js extensions for imports (e.g., `from './file.js'`)

### Imports & File Structure
- Always use .js extensions in imports for compiled output
- Organize imports: external libraries first, then local modules
- Use named exports, avoid default exports when possible
- Security-first: sanitize all inputs, validate with Zod schemas

### Naming Conventions
- **Files**: kebab-case (team-city-client.ts, tool-handler.ts)
- **Classes**: PascalCase (TeamCityClient, ErrorCodes)
- **Functions/variables**: camelCase (createSecureHandler, buildSafeLocator)
- **Constants**: UPPER_SNAKE_CASE (SECURITY_LIMITS, MAX_COUNT)
- **Types/Interfaces**: PascalCase with descriptive names

### Error Handling & Security
- Never log sensitive data (tokens, passwords, URLs with auth)
- Use createSafeError() and sanitizeErrorMessage() for all errors
- Validate all inputs with Zod schemas (see validation/schemas.ts)
- Apply resource limits: string lengths, array sizes, pagination counts
- Rate limiting and secure parameter sanitization in tool handlers