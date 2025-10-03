# Nginx Proxy Manager CLI - Beta 0.1.0 Installation Guide

## 📦 Release Package
**Package:** `nginx-proxy-manager-cli-0.1.0-beta.tgz`
**Size:** 25.6 kB (packed) / 143.2 kB (unpacked)
**Version:** 0.1.0-beta
**License:** Nefarious Use License (NUL)

## 🚀 Quick Installation (No Root Required)

### Option 1: Direct Usage (Recommended - No Installation Needed)
```bash
# Extract the package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz

# Navigate to extracted directory
cd package

# Use directly with Node.js (no installation required)
node bin/npm-cli.js --help
```

### Option 2: Local Installation (User Directory)
```bash
# Extract the package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz
cd package

# Install locally in current directory
npm install .

# Use via npx (no global installation needed)
npx npm-cli --help
```

### Option 3: User Global Installation (No Root)
```bash
# Configure npm to use user directory (one-time setup)
npm config set prefix ~/.npm-global

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Extract and install
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz
cd package
npm install -g .

# Now use globally without root
npm-cli --help
```

### Option 4: Direct Binary Usage
```bash
# Extract and create alias
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz
cd package

# Create alias for easy access
alias npm-cli="node $(pwd)/bin/npm-cli.js"

# Use immediately
npm-cli --help
```

## 📋 Package Contents

```
nginx-proxy-manager-cli-0.1.0-beta/
├── LICENSE                     # Nefarious Use License
├── README.md                   # Comprehensive documentation
├── INSTALL.md                  # This installation guide
├── IMPLEMENTATION_SUMMARY.md   # Technical implementation details
├── package.json                # Package configuration
├── bin/
│   └── npm-cli.js             # Main CLI executable
├── lib/
│   ├── api.js                 # API client library
│   ├── config.js              # Configuration management
│   └── utils.js               # Utility functions
├── commands/
│   ├── auth.js                # Authentication commands
│   ├── hosts.js               # Proxy hosts management
│   ├── certificates.js        # SSL certificate management
│   ├── access-lists.js        # Access list management
│   ├── streams.js             # Stream management
│   ├── redirection.js         # Redirection management
│   └── settings.js            # System settings management
├── test-cli.js                # Comprehensive test suite
├── simple-test.js             # Basic functionality test
└── node_modules/              # Dependencies (not included in release)
```

## 🔧 System Requirements

- **Node.js:** 14.0.0 or higher
- **NPM:** 6.0.0 or higher (for installation options)
- **Operating System:** Windows, macOS, Linux
- **Network:** Access to Nginx Proxy Manager instance

## 🎯 First Steps After Installation

### 1. Test the CLI (No NPM needed)
```bash
# From extracted package directory
node bin/npm-cli.js --help
```

### 2. Test with NPM (if using npm install)
```bash
# From extracted package directory
npx npm-cli --help
```

### 3. Connect to Your NPM Instance
```bash
# If NPM is on localhost:81 (default)
node bin/npm-cli.js auth login

# If NPM is on different host/port
node bin/npm-cli.js auth login --url http://your-npm-host:81
```

## 📖 Usage Examples

### Basic Operations (No Installation)
```bash
# Login and authenticate
node bin/npm-cli.js auth login -e admin@example.com -p yourpassword

# List all proxy hosts
node bin/npm-cli.js hosts list

# Create a new proxy host
node bin/npm-cli.js hosts create -d example.com -h 192.168.1.100 -p 8080

# Get system status
node bin/npm-cli.js settings status
```

### With NPM Installation
```bash
# After npm install
npm-cli auth login -e admin@example.com -p yourpassword
npm-cli hosts list
npm-cli settings status
```

## 🔧 Configuration Options

- **URL:** `--url http://localhost:81` (NPM instance URL)
- **Token:** `--token your-auth-token` (Authentication token)
- **Config:** `--config path/to/config.yaml` (Custom config file)
- **JSON:** `--json` (JSON output format)
- **Verbose:** `--verbose` (Detailed output)

## 🐛 Troubleshooting

### Permission Issues (Linux/macOS)
- **Problem:** `EACCES: permission denied` when using `npm install -g`
- **Solution:** Use Options 1, 2, or 4 (no global installation required)

### Connection Issues
- Ensure your Nginx Proxy Manager is running and accessible
- Check the URL and port configuration
- Verify authentication credentials

### Node.js Issues
- Check Node.js version: `node --version` (requires 14.0.0+)
- Check NPM version: `npm --version` (requires 6.0.0+)

### Path Issues
- Use full paths if commands aren't found
- Add Node.js to PATH if needed

## 📞 Support

- Check the comprehensive README.md for detailed documentation
- Run tests with `node test-cli.js` to verify functionality
- Use `--help` flag on any command for detailed usage information

## 📝 Release Notes

**Version 0.1.0-beta:**
- Complete Nginx Proxy Manager API integration
- Full CRUD operations for all resource types
- Interactive prompts and validation
- JSON and table output formats
- Comprehensive error handling
- Nefarious Use License (NUL)
- Beta release for testing and feedback

## 🚀 Quick Start (No Installation Required)

```bash
# 1. Extract package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz

# 2. Navigate to package
cd package

# 3. Test CLI (no installation needed)
node bin/npm-cli.js --help

# 4. Start using immediately
node bin/npm-cli.js auth login --url http://localhost:81
```

Enjoy managing your Nginx Proxy Manager from the command line! 🚀

**Note:** This package requires no root/admin privileges for installation or usage.