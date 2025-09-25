# Task Completion Workflow

## Pre-Push Checklist
1. **Build**: `npm run build` - Must pass without errors
2. **Test**: `npm test` - All tests must pass
3. **Version Bump**: Update version in package.json for fixes/features
4. **Documentation**: Update README.md if features/tools are modified

## Testing Requirements
- **Local Testing**: Always test locally before pushing any change
- **No Test Commits**: Never commit test scripts to repository
- **Integration Tests**: Verify MCP protocol compliance
- **Security Tests**: Validate error sanitization and input validation

## Version Management
- **Semantic Versioning**: Follow semver (major.minor.patch)
- **Automatic Publishing**: GitHub Actions publishes to npm on push
- **No Manual Publishing**: Never run `npm publish` manually
- **No Manual Tags**: GitHub Actions creates git tags automatically

## Documentation Updates
- **README.md**: Must be updated when code changes work and are functional
- **Feature Documentation**: Update when adding/modifying features or tools
- **API Changes**: Document any changes to MCP tool interfaces
- **Breaking Changes**: Clearly document in CHANGELOG

## Git Workflow
1. Make changes locally
2. Run full test suite: `npm run build && npm test`
3. Update documentation if needed
4. Bump version in package.json
5. Commit with descriptive message
6. Push to trigger automated pipeline

## Security Considerations
- **Environment Variables**: Never commit secrets or tokens
- **Error Messages**: Ensure no sensitive data in error outputs
- **Input Validation**: Test Zod schemas with invalid inputs
- **Rate Limiting**: Verify security limits are enforced