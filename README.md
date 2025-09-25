# TeamCity MCP Server

A TypeScript implementation of the TeamCity MCP (Model Context Protocol) server, providing seamless integration with Claude Desktop and Claude Code through natural language. Manage your TeamCity CI/CD operations using simple, conversational commands.

**🎯 MCP Protocol Compliant** | **🚀 Single Tool Architecture**

## Quick Start

```bash
# Run directly with npx - no installation needed!
npx @hexaust/teamcity-mcp

# Or install globally
npm install -g @hexaust/teamcity-mcp
teamcity-mcp
```

## Features

### 🎯 Natural Language Interface

Interact with TeamCity using plain English commands - no need to learn complex APIs or remember tool names:

```
"show me failed builds from yesterday"
"trigger MyApp build on main branch"
"get build 12345 log"
"list all projects"
"cancel running builds"
"download test artifacts from latest build"
"find what broke the build"
```

### 🔧 Core Capabilities

- **Zero-install usage** via npx - no setup required
- **Production-ready security** with comprehensive error sanitization and rate limiting
- **TypeScript implementation** with strict type safety
- **Input validation** using Zod schemas with security limits
- **MCP protocol compliant** - proper JSON Schema validation, resources, and error handling
- **Complete TeamCity control** - builds, projects, artifacts, agents, and more

### 📊 TeamCity Operations

- **Build Management**: List, trigger, cancel, and monitor builds with real-time status
- **Project Control**: Navigate project hierarchies and manage build configurations
- **Test Analysis**: Analyze test failures with detailed error information
- **Artifact Access**: Download and inspect build artifacts safely
- **Change Tracking**: Monitor VCS changes with commit details and file impacts
- **Agent Monitoring**: Check build agent status and availability
- **Queue Management**: View and manage build queues
- **Problem Detection**: Identify and analyze build failures
- **Live Resources**: Access real-time status dashboards and build information through MCP resources

## Prerequisites

- Node.js 18 or later
- TeamCity server with REST API access
- Bearer token for TeamCity authentication

## Configuration

### Environment Variables

Set these before running the server:

```bash
export TEAMCITY_SERVER_URL="https://your-teamcity-server.com"
export TEAMCITY_BEARER_TOKEN="your_bearer_token_here"
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "teamcity": {
      "command": "npx",
      "args": ["@hexaust/teamcity-mcp"],
      "env": {
        "TEAMCITY_SERVER_URL": "https://your-teamcity-server.com",
        "TEAMCITY_BEARER_TOKEN": "your_bearer_token_here"
      }
    }
  }
}
```

### Claude Code Usage

#### Installation & Setup

Use Claude Code's built-in MCP management commands:

```bash
# Add TeamCity MCP server with environment variables
claude mcp add teamcity \
  --env TEAMCITY_SERVER_URL=https://your-teamcity-server.com \
  --env TEAMCITY_BEARER_TOKEN=your_bearer_token_here \
  -- npx @hexaust/teamcity-mcp
```

**Additional MCP commands:**
```bash
# List all MCP servers
claude mcp list

# Get server details
claude mcp get teamcity

# Remove server
claude mcp remove teamcity
```

**Alternative: Global environment variables**
```bash
# Set globally (then add without --env flags)
export TEAMCITY_SERVER_URL="https://your-teamcity-server.com"
export TEAMCITY_BEARER_TOKEN="your_bearer_token_here"
claude mcp add teamcity -- npx @hexaust/teamcity-mcp
```

## How It Works

The TeamCity MCP server provides a single natural language tool that understands your requests and executes the appropriate TeamCity operations. Simply describe what you want to do in plain English, and the server will:

1. **Parse your intent** - Understanding what TeamCity operation you need
2. **Execute the operation** - Making the appropriate REST API calls to TeamCity
3. **Format the response** - Presenting results in a clear, useful format

### Natural Language Examples

**Build Operations:**
- "show failed builds from yesterday"
- "trigger MyApp build on staging branch"
- "get build 12345 status and logs"
- "cancel all running builds"

**Project Management:**
- "list all projects with their configurations"
- "show build configurations for MyProject"
- "get VCS roots and their details"

**Monitoring & Analysis:**
- "what's currently running?"
- "compare last two builds"
- "find what broke the main branch"
- "analyze test failures in recent builds"

**Artifact Management:**
- "show artifacts for build #8507"
- "list artifacts for build 12345"
- "get artifact metadata from latest build"

## Authentication

The server uses Bearer token authentication with the TeamCity REST API. To obtain a bearer token:

1. Go to your TeamCity server
2. Navigate to your profile settings
3. Go to "Access Tokens" tab
4. Create a new token with appropriate permissions
5. Use this token as the `TEAMCITY_BEARER_TOKEN` environment variable

**Security Note**: The server automatically sanitizes bearer tokens from logs and error messages to prevent accidental exposure.

## Security & Production Readiness

This implementation includes comprehensive security measures for production deployment:

### Input Validation & Sanitization
- **Zod schema validation** for all user inputs with strict type checking
- **Resource limits** preventing DoS attacks (max 1000 items for pagination)
- **Input sanitization** removing dangerous characters and patterns
- **Parameter length limits** preventing oversized requests

### Error Handling & Information Security
- **Error sanitization** prevents exposure of sensitive server details
- **Stack trace removal** from user-facing error messages
- **URL sanitization** removes internal paths and sensitive parameters
- **Request ID tracking** for secure audit logging

### Rate Limiting & Resource Protection
- **Built-in rate limiting** (30-60 requests per minute per tool)
- **Pagination limits** with secure defaults (max 1000 items, 100 per page)
- **Content size limits** for responses (10MB text, 50MB binary)
- **Connection timeouts** and retry limits

## Troubleshooting

### Environment Variables Not Found

**Problem**: Environment variables are not being picked up.

**Solution**: Make sure to restart your terminal or reload your shell profile after setting environment variables:
```bash
# After adding to .bashrc/.zshrc
source ~/.bashrc  # or ~/.zshrc
```

### Connection Issues

**Problem**: Server can't connect to TeamCity.

**Solution**:
1. Verify your TeamCity server URL is accessible
2. Check that your bearer token has the required permissions
3. Ensure TeamCity REST API is enabled

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/hex/teamcity-mcp.git
cd teamcity-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```text
teamcity-mcp/
├── src/
│   ├── index.ts                    # Main server with natural language tool
│   ├── client/
│   │   └── teamcity-client.ts      # TeamCity REST API client
├── package.json
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Documentation
```

### Testing

```bash
# Run tests
npm test

# Build and test
npm run build && npm test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please visit: https://github.com/hex/teamcity-mcp/issues

---

**TeamCity MCP Server** - Natural language interface for complete TeamCity integration with Claude Desktop and Claude Code.