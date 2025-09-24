# TeamCity MCP v1.1.0 - Claude Desktop Testing Guide

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
Start a new conversation and say:
```
Can you check if TeamCity is connected?
```

---

## 🆕 Testing v1.1.0 Features

### 1. 🗣️ Natural Language Queries
Instead of using tool syntax, just ask naturally:

```
Show me builds from yesterday
```

```
Why did the iOS build fail?
```

```
Find builds in the last 2 hours
```

```
What's the status of build #12345?
```

```
Deploy to staging environment
```

### 2. 🧙 Interactive Wizards

#### Setup Wizard (First-time setup)
```
Start the TeamCity setup wizard
```
This will:
- Test your connection
- Show you available projects
- Let you explore builds, queue, and agents
- Guide you through initial exploration

#### Investigation Wizard (Debug failures)
```
Help me investigate why my build failed
```
Or if you know the build:
```
Investigate build #12345
```
This will:
- Analyze the build failure
- Show test failures and logs
- Provide suggestions for fixes
- Offer to compare with previous builds

#### Deployment Wizard
```
Guide me through deploying to production
```
This will:
- List available environments
- Find deployment configurations
- Trigger the deployment
- Monitor progress

### 3. 🔄 Workflow Automation

#### Analyze Failed Build
```
Analyze the latest failed build comprehensively
```
This combines:
- Build details
- Test failures
- Last 100 lines of logs
- Recent changes
- Build problems

#### Monitor Build in Real-time
```
Monitor build #12345 until it completes
```
This will:
- Check status every 30 seconds
- Show progress updates
- Alert when complete
- Display final results

#### Compare Builds
```
Compare build #12345 with build #12344
```
Shows side-by-side:
- Status differences
- Test results comparison
- Duration changes
- Problem differences

#### Find Breaking Change
```
What commit broke the MainProject build?
```
This will:
- Find last successful build
- List commits between success and failure
- Identify likely culprit

### 4. 📊 Live Status Resources

#### Current Build Status Dashboard
```
Show me the current build status dashboard
```

#### Project Hierarchy
```
Display the project structure
```

#### Agent Pool Status
```
What's the status of our build agents?
```

#### Current Problems
```
Show me all current build problems
```

### 5. 🎯 Context-Aware Commands

The server now remembers your context:

```
Show builds for ProjectX
[Server remembers ProjectX]

Trigger a build
[Uses ProjectX automatically]

Show me the log
[Uses last build automatically]
```

---

## 📝 Example Conversation Flow

Here's a natural conversation you can have:

**You:** "What's happening with our builds today?"

**Claude:** [Shows recent builds with status indicators]

**You:** "Why did the iOS build fail?"

**Claude:** [Analyzes the failure, shows test results and logs]

**You:** "Can you find what commit broke it?"

**Claude:** [Runs breaking change finder, identifies the commit]

**You:** "Trigger a rebuild with that commit reverted"

**Claude:** [Triggers build with appropriate parameters]

**You:** "Monitor it and let me know when it's done"

**Claude:** [Monitors build progress, updates you]

---

## 🧪 Testing Each Feature Category

### Test Retry & Caching (Automatic)
The retry mechanism works automatically for transient failures:
- Try disconnecting network briefly during a request
- The server will retry with exponential backoff
- Successful responses are cached for 5 minutes

### Test Natural Language Understanding
Try variations of the same request:
```
"Show me the builds"
"List all builds"
"What builds do we have?"
"Get me the build list"
```
All should work similarly!

### Test Fuzzy Matching
Intentionally misspell project names:
```
"Show builds for MianProjcet"  (instead of MainProject)
```
The fuzzy search will find the closest match!

### Test Time Parsing
Use natural time expressions:
```
"Show builds from last Monday"
"Get failures from this morning"
"List builds between 2pm and 4pm"
"What failed yesterday afternoon?"
```

---

## 🎨 Response Formatting

Responses now include:
- ✅ ❌ ⚠️ Status emojis
- 📊 Progress bars for builds
- 🔍 Highlighted important information
- 📝 Structured sections
- 🚀 Action indicators

---

## 💡 Pro Tips

1. **Start with the setup wizard** if it's your first time
2. **Use natural language** - no need to remember tool names
3. **The context persists** - it remembers your last project/build
4. **Combine features** - "Why did yesterday's staging deployment fail?"
5. **Ask for suggestions** - "What should I do next?"

---

## 🐛 Troubleshooting

### If Natural Language Doesn't Work
- Try being more specific: "Show TeamCity builds" instead of just "builds"
- The confidence threshold is 0.7, so very vague queries might not match

### If Wizards Get Stuck
- You can always restart: "Start over with the setup wizard"
- Or jump to a specific step: "Go to step 2 of the investigation"

### If Context Is Wrong
- Clear it explicitly: "Switch to project ABC"
- Or ask what context is active: "What project am I working with?"

---

## 📚 Full Feature List to Try

- ✅ Natural language queries
- ✅ Setup wizard
- ✅ Investigation wizard
- ✅ Deployment wizard
- ✅ Analyze failed builds
- ✅ Monitor builds
- ✅ Compare builds
- ✅ Find breaking changes
- ✅ Status dashboard
- ✅ Project hierarchy view
- ✅ Agent status
- ✅ Current problems list
- ✅ Fuzzy project/build search
- ✅ Time-based filtering
- ✅ Context persistence
- ✅ Automatic retries
- ✅ Response caching

---

## 🎯 Quick Test Checklist

Run through these to verify everything works:

1. [ ] "Check TeamCity connection"
2. [ ] "Start the setup wizard"
3. [ ] "Show me recent builds"
4. [ ] "Why did the last build fail?"
5. [ ] "Monitor the current build"
6. [ ] "Find what broke the build"
7. [ ] "Show the build status dashboard"
8. [ ] "What agents are available?"
9. [ ] "Trigger a build for main branch"
10. [ ] "Compare the last two builds"

Enjoy the new intelligent TeamCity assistant! 🎉