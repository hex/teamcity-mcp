# TeamCity MCP Server - Project Overview

## Purpose
A TypeScript implementation of a TeamCity Model Context Protocol (MCP) server that provides seamless integration with Claude Desktop and Claude Code through natural language commands. The project enables users to manage TeamCity CI/CD operations using simple, conversational commands.

## Current Status
- Version: 4.1.1
- Architecture: Ultra-simplified single-tool implementation (down from 30+ tools in v3.x)
- 94% token reduction achieved through natural language processing approach
- Production-ready with comprehensive security and error handling

## Key Features
- **Natural Language Interface**: Users can interact with TeamCity using plain English
- **Zero-install usage**: Available via npx without setup required
- **Production-ready security**: Comprehensive error sanitization and rate limiting
- **TypeScript implementation**: Strict type safety and modern ES2022 target
- **MCP protocol compliant**: Works with Claude Desktop and Claude Code
- **Complete TeamCity control**: Builds, projects, artifacts, agents, and more

## Tech Stack
- **Language**: TypeScript with ES2022 target and ESNext modules
- **Runtime**: Node.js 18+
- **Protocol**: Model Context Protocol (MCP) via @modelcontextprotocol/sdk
- **HTTP Client**: Axios with custom security interceptors
- **Validation**: Zod schemas for security and input validation
- **Testing**: Vitest for unit and integration tests
- **Bundling**: TypeScript compiler for ES modules

## Architecture
- Single-tool architecture leveraging Claude's NLP capabilities
- Secure TeamCity REST API client with comprehensive error handling
- Centralized security utilities for sanitization and error handling
- Request/response interceptors for logging and security
- Rate limiting and content size restrictions for safety