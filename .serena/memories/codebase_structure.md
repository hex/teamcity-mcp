# Codebase Structure Analysis

## Directory Organization
```
teamcity-mcp/
├── src/                           # Source code
│   ├── index.ts                   # Main MCP server entry point
│   ├── client/
│   │   └── teamcity-client.ts     # TeamCity REST API client
│   └── utils/
│       └── security.ts            # Security utilities and error handling
├── test/                          # Test files
│   ├── simple.test.ts            # Basic unit tests
│   └── integration.test.ts       # Integration tests
├── dist/                         # Compiled JavaScript output
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
└── README.md                     # Documentation
```

## Core Modules
1. **Main Server (`src/index.ts`)**
   - MCP server setup and registration
   - Single natural language tool implementation
   - Business logic routing based on natural language parsing

2. **TeamCity Client (`src/client/teamcity-client.ts`)**
   - REST API abstraction layer
   - HTTP client with retry logic
   - Input validation and sanitization
   - Response processing and formatting

3. **Security Utils (`src/utils/security.ts`)**
   - Error sanitization and safe error creation
   - HTTP error handling
   - Security-focused utility functions

## Module Boundaries
- **Clear separation** between MCP protocol handling and TeamCity API logic
- **Security layer** isolated in dedicated utils module
- **Client abstraction** provides clean interface to TeamCity REST API
- **Minimal dependencies** between modules for maintainability