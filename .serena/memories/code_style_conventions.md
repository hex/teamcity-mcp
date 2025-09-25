# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: All strict TypeScript flags enabled for maximum type safety
- **Target**: ES2022 with ESNext modules
- **Security-focused**: Enhanced compiler flags including `noUncheckedIndexedAccess`, `noImplicitReturns`
- **Code Quality**: Unused locals/parameters detection, no unreachable code
- **Module System**: ES modules with verbatim module syntax

## Naming Conventions
- **Classes**: PascalCase (e.g., `TeamCityClient`)
- **Methods/Functions**: camelCase (e.g., `buildLocator`, `triggerBuild`)
- **Constants**: SCREAMING_SNAKE_CASE for error codes (e.g., `ErrorCodes`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ErrorContext`)
- **Files**: kebab-case for modules (e.g., `teamcity-client.ts`, `security.ts`)

## Code Organization Patterns
- **Single Responsibility**: Each class/module has one clear purpose
- **Defensive Programming**: Extensive input validation and sanitization
- **Error Handling**: Comprehensive error sanitization to prevent information leakage
- **Security First**: All user inputs validated with Zod schemas
- **Immutable Operations**: Prefer readonly and const where possible

## Documentation Style
- **JSDoc**: Minimal but focused comments for public APIs
- **Inline Comments**: Security-focused explanations for validation logic
- **README**: Comprehensive user-facing documentation with examples