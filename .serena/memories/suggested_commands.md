# Suggested Development Commands

## Essential Development Commands

### Building and Testing
```bash
# Build the project (TypeScript compilation)
npm run build

# Run tests
npm test
npm run test:watch  # Watch mode for development

# Clean build artifacts
npm run clean

# Development mode with hot reload
npm run dev
```

### Running the Application
```bash
# Run built version
npm start

# Development mode
npm run dev

# Run directly with npx (production usage)
npx @hexaust/teamcity-mcp
```

### Project Quality
```bash
# Full build preparation (clean + build)
npm run prepublishOnly

# Check TypeScript compilation
npx tsc --noEmit

# View dependency tree
npm list --depth=0
```

### System Commands (macOS Darwin)
```bash
# File operations
ls -la          # List files with details
find . -name "*.ts"  # Find TypeScript files
du -sh dist/*   # Check build sizes

# Git operations
git status
git log --oneline -10
git branch -v

# Process and network
ps aux | grep node    # Check running Node processes
lsof -i :3000        # Check port usage
```

## Task Completion Workflow
When completing any development task:
1. Always test locally first: `npm test && npm run build`
2. Never commit test scripts to the repository
3. Always update README.md when adding/modifying features
4. Always bump version number in package.json for fixes/features
5. Push to git to trigger automated GitHub Actions publishing
6. Never manually publish to npm - GitHub Actions handles this

## Performance Analysis Commands
```bash
# Bundle size analysis
du -sh dist/* && wc -l dist/index.js

# Memory usage (if running)
ps -o pid,ppid,pmem,pcpu,comm -p $(pgrep node)

# Dependency analysis
npm list --depth=0
npm audit
```