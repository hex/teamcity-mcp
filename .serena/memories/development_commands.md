# Development Commands

## Essential Commands

### Build & Development
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Run in development mode with tsx
npm run start          # Run compiled version from dist/
npm run clean          # Remove dist/ directory
```

### Testing
```bash
npm test               # Run all tests with vitest
npm run test:watch     # Run tests in watch mode
```

### Development Workflow
```bash
# Standard development cycle
npm run build && npm test   # Build and test
npm run dev                 # Development server
```

### Package Management
```bash
npm install            # Install dependencies
npm run prepublishOnly # Prepare for publishing (clean + build)
```

## Environment Setup
```bash
export TEAMCITY_SERVER_URL="https://your-teamcity-server.com"
export TEAMCITY_BEARER_TOKEN="your_bearer_token_here"
```

## Direct Usage (No Installation)
```bash
npx @hexaust/teamcity-mcp  # Run directly from npm
```

## Important Notes
- **Never** manually publish to npm - GitHub Actions handles this
- Always test locally before pushing
- Version bumps trigger automatic publishing
- No need to create git tags manually