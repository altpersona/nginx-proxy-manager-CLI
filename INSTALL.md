# Nginx Proxy Manager CLI - Beta 0.1.0 Installation Guide

## 📦 Release Package
**Package:** `nginx-proxy-manager-cli-0.1.0-beta.tgz`
**Size:** 25.6 kB (packed) / 143.2 kB (unpacked)
**Version:** 0.1.0-beta
**License:** Nefarious Use License (NUL)

## 🚀 Quick Installation

### Option 1: Direct Usage (Recommended)
```bash
# Extract the package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz

# Navigate to extracted directory
cd package

# Use directly with Node.js
node bin/npm-cli.js --help
```

### Option 2: Global Installation
```bash
# Extract the package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz
cd package

# Install globally (requires npm)
npm install -g .

# Use from anywhere
npm-cli --help
```

### Option 3: Local Installation
```bash
# Extract the package
tar -xzf nginx-proxy-manager-cli-0.1.0-beta.tgz
cd package

# Install locally
npm install .

# Use via npx
npx npm-cli --help
```

## 📋 Package Contents

```
nginx-proxy-manager-cli-0.1.0-beta/
├── LICENSE                     # Nefarious Use License
├── README.md                   # Comprehensive documentation
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

### 1. Test the CLI
```bash
node bin/npm-cli.js --help
```

### 2. Connect to Your NPM Instance
```bash
# If NPM is on localhost:81 (default)
node bin/npm-cli.js auth login

# If NPM is on different host/port
node bin/npm-cli.js auth login --url http://your-npm-host:81
```

### 3. List Your Resources
```bash
node bin/npm-cli.js hosts list
node bin/npm-cli.js certificates list
node bin/npm-cli.js settings get
```

## 📖 Usage Examples

### Basic Operations
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

### Advanced Configuration
```bash
# Create with SSL and security headers
node bin/npm-cli.js hosts create -d secure.example.com -h 192.168.1.100 -p 443 -s https --ssl-forced

# List with JSON output
node bin/npm-cli.js hosts list --json

# View current configuration
node bin/npm-cli.js auth config
```

## 🔧 Configuration Options

- **URL:** `--url http://localhost:81` (NPM instance URL)
- **Token:** `--token your-auth-token` (Authentication token)
- **Config:** `--config path/to/config.yaml` (Custom config file)
- **JSON:** `--json` (JSON output format)
- **Verbose:** `--verbose` (Detailed output)

## 🐛 Troubleshooting

### Connection Issues
- Ensure your Nginx Proxy Manager is running and accessible
- Check the URL and port configuration
- Verify authentication credentials

### Permission Issues
- Check file permissions after extraction
- Ensure Node.js has proper execution permissions

### Dependency Issues
- Run `npm install` in the package directory if dependencies are missing
- Check Node.js version compatibility

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

Enjoy managing your Nginx Proxy Manager from the command line! 🚀