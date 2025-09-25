# TeamCity MCP v4.2.3 - Claude Desktop Setup Guide

## 🎯 Quick Setup

### 1. Update Claude Desktop Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### 2. Restart Claude Desktop
After updating the configuration, fully quit and restart Claude Desktop for changes to take effect.

### 3. Verify Connection
Start a new conversation and ask:
```
Can you list my TeamCity projects?
```

---

## 🚀 Natural Language TeamCity Operations

The v4.2.3 server uses a **single intelligent tool** that understands natural language requests. No need to remember specific commands - just ask naturally!

### 📋 Project & Build Management

**List Projects:**
```
Show me all TeamCity projects
```

**View Recent Builds:**
```
Show me recent builds
Show failed builds from yesterday
List running builds
```

**Get Build Details:**
```
Show me build #12345
What's the status of the latest build?
Get details for the last failed build
```

**View Build Logs:**
```
Show me the log for build #12345
Get the last 50 lines of the build log
Show me logs for the latest failed build
```

### 🏗️ Build Operations

**Trigger Builds:**
```
Trigger a build for MyProject on dev branch
Start a build for MyProject_Android
Trigger MyProject on staging branch
```

**Cancel Builds:**
```
Cancel build #12345
Stop all queued builds
Cancel the running build
```

### 👥 Agent Management

**View Agents:**
```
Show me all build agents
List connected agents
What agents are available?
```

### 📊 Queue Management

**View Build Queue:**
```
Show me the build queue
List queued builds
What builds are waiting?
```

### 🧪 Test Results

**View Test Failures:**
```
Show test failures for build #12345
What tests failed in the latest build?
```

### 📦 Artifacts

**View Build Artifacts:**
```
Show artifacts for build #8507
List artifacts for build #12345
```

### 📝 Changes & Commits

**View Recent Changes:**
```
Show recent changes
List commits for build #12345
What changed in the latest build?
```

### ℹ️ Server Information

**Get Server Details:**
```
Show TeamCity server information
What version is the server running?
```

---

## 📊 Live Status Resources

The server provides live dashboard resources that you can access:

### TeamCity Status Overview
```
Show me the TeamCity status dashboard
```
Provides:
- Server status
- Running builds count
- Queued builds count
- Agent availability
- Live build information

### Recent Builds Dashboard
```
Show me the recent builds dashboard
```
Displays the latest 20 builds with status and timestamps.

---

## 💡 Natural Language Examples

The server understands context and natural variations:

**Build Status Queries:**
- "What's happening with our builds?"
- "Show me failed builds from last 24 hours"
- "Are there any builds running right now?"
- "What's in the build queue?"

**Specific Project Queries:**
- "Show builds for MyProject"
- "Trigger MyProject_Android on main branch"
- "What's the status of the iOS build?"

**Time-based Queries:**
- "Show me builds from yesterday"
- "List failed builds from this morning"
- "What builds ran overnight?"

**Investigation Queries:**
- "Why did build #12345 fail?"
- "Show me the error logs for the latest build"
- "What tests are failing?"

---

## 🔧 Troubleshooting

### If Commands Don't Work
1. **Check your configuration** - Ensure `TEAMCITY_SERVER_URL` and `TEAMCITY_BEARER_TOKEN` are correct
2. **Restart Claude Desktop** - Configuration changes require a restart
3. **Verify network access** - Ensure Claude Desktop can reach your TeamCity server
4. **Check permissions** - Your bearer token needs appropriate TeamCity permissions

### Common Issues

**"TeamCity client configuration is incomplete"**
- Missing or incorrect environment variables
- Check your `claude_desktop_config.json` file

**Connection timeouts**
- Network connectivity issues
- TeamCity server may be down
- Firewall blocking access

**Permission errors**
- Bearer token lacks required permissions
- Try with a token that has project admin rights

---

## 🎯 Quick Test Checklist

Verify everything works by trying these commands:

1. [ ] "List my TeamCity projects"
2. [ ] "Show me recent builds"
3. [ ] "What agents are connected?"
4. [ ] "Show me the build queue"
5. [ ] "Get server information"
6. [ ] "Show me the status dashboard"
7. [ ] "Show failed builds from yesterday"
8. [ ] "List artifacts for build #[recent_build_id]"

---

## 📚 Architecture Overview

**Single Tool Design:**
- One intelligent `teamcity` tool handles all operations
- Natural language processing leverages Claude's understanding
- 94% token reduction compared to 30 individual tools
- Simplified integration and maintenance

**What's Different from v1.x:**
- No complex wizards or multi-step workflows
- No context persistence between conversations
- Direct natural language → action mapping
- Streamlined responses focused on data

**Benefits:**
- ✅ Easier to use - just ask naturally
- ✅ More reliable - fewer moving parts
- ✅ Better performance - single tool execution
- ✅ Simpler debugging - one integration point

---

## 🎉 Get Started

Ready to use your TeamCity MCP server? Just start a conversation in Claude Desktop and ask:

```
"What's happening with my TeamCity builds today?"
```

The server will handle the rest naturally! 🚀