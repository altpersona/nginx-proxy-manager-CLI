# Nginx Proxy Manager CLI Release Notes

## Version 0.2.1 - Bug Fixes and Improvements

### 🐛 Bug Fixes

#### SSL Boolean Flag Handling
- **Fixed**: `--ssl-forced false` and `--no-ssl-forced` flags now properly update the SSL forced setting
- **Issue**: Boolean flags were not being correctly processed due to commander.js library behavior
- **Solution**: Updated boolean flag logic to properly handle both positive and negative flag states

#### "Additional Properties" Error
- **Fixed**: Disable/enable commands no longer throw "data must NOT have additional properties" errors
- **Issue**: Commands were using spread operator (`...currentHost`) which included extra fields the API rejected
- **Solution**: Replaced spread operator with explicit field mapping for minimal update objects

#### Boolean Logic in Update Commands
- **Fixed**: Proper handling of `--enabled`, `--disabled`, `--http2`, `--no-http2` flags across all commands
- **Issue**: Boolean flag logic was inconsistent between different command types
- **Solution**: Standardized boolean flag handling across hosts, streams, and redirection commands

### 📁 Files Modified

- `commands/hosts.js` - Fixed SSL flag handling and disable/enable command data structures
- `commands/streams.js` - Fixed disable/enable commands to use minimal update objects
- `commands/redirection.js` - Fixed disable/enable commands to use minimal update objects
- `package.json` - Updated version to 0.2.1

### 🧪 Testing

All commands have been tested for:
- SSL forcing flag updates (`--ssl-forced`, `--no-ssl-forced`)
- Disable/enable operations without "additional properties" errors
- Boolean flag consistency across different command types
- Proper error handling and user feedback

### 🎯 Impact

This release resolves the critical issues that prevented users from:
1. Updating SSL settings via CLI
2. Using disable/enable commands due to API validation errors
3. Maintaining consistent boolean flag behavior across commands

### 🔄 Breaking Changes

None - this is a bug fix release that maintains backward compatibility.

### 📋 Known Issues

None at this time. All reported issues have been resolved.

### 🚀 Next Steps

Users should update to this version to get the fixed SSL flag handling and resolved disable/enable command issues.

---

**Release Date**: October 3, 2025
**Release Type**: Bug Fix Release
**Compatibility**: Fully backward compatible with 0.2.0