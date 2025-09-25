# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2022 with ESNext modules
- **Strict Mode**: All strict checks enabled for security
- **Module Resolution**: Node.js style with .js extension imports
- **Security Focus**: Enhanced type checking, no implicit returns, strict null checks

## Naming Conventions
- **Files**: kebab-case (e.g., teamcity-client.ts, security.ts)
- **Classes**: PascalCase (e.g., TeamCityClient)
- **Functions**: camelCase (e.g., createSafeError, handleHttpError)
- **Constants**: UPPER_SNAKE_CASE (e.g., ErrorCodes.VALIDATION_ERROR)
- **Interfaces**: PascalCase with descriptive names (e.g., ErrorContext)

## Code Organization
- **Single Responsibility**: Each file has a clear, focused purpose
- **Security First**: Error sanitization and input validation throughout
- **Type Safety**: Comprehensive TypeScript types and Zod schemas
- **Functional Style**: Prefer pure functions and immutable patterns

## Error Handling
- **Safe Errors**: Never expose sensitive information in error messages
- **Structured Errors**: Use ErrorCode enum and standardized error objects
- **Context Tracking**: Include operation context and request IDs
- **HTTP Error Mapping**: Map axios errors to appropriate MCP error codes

## Import/Export Patterns
- **ES Modules**: Use import/export with .js extensions for compiled output
- **Type Imports**: Use `type` keyword for type-only imports
- **No Default Exports**: Prefer named exports for clarity
- **Path Mapping**: Use relative paths, avoid complex path mapping

## Documentation Style
- **JSDoc**: Comprehensive documentation for public APIs
- **Inline Comments**: Explain complex logic and security considerations
- **README**: Keep updated with feature changes
- **Type Annotations**: Explicit types even when TypeScript can infer