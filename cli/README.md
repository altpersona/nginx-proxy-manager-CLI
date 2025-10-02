# Nginx Proxy Manager CLI

A powerful command-line interface for managing Nginx Proxy Manager instances. This CLI provides comprehensive management capabilities for proxy hosts, SSL certificates, access lists, streams, and redirection hosts.

## Features

- 🔐 **Authentication Management** - Secure login with token-based authentication
- 🌐 **Proxy Host Management** - Create, update, delete, and manage proxy hosts
- 🔒 **SSL Certificate Management** - Handle Let's Encrypt and custom certificates
- 🛡️ **Access List Management** - Control access with IP whitelisting and basic auth
- 🔄 **Stream Management** - Manage TCP/UDP stream forwarding
- ↗️ **Redirection Management** - Handle URL redirections with various HTTP codes
- ⚙️ **System Settings** - Configure global settings
- 📊 **Multiple Output Formats** - Table, JSON, and YAML output formats
- 🎯 **Interactive Mode** - Guided setup for complex configurations
- 🔍 **Advanced Search** - Query and filter resources
- 📋 **Batch Operations** - Efficient bulk operations

## Installation

### Global Installation (Recommended)
```bash
npm install -g nginx-proxy-manager-cli
```

### Local Installation
```bash
npm install nginx-proxy-manager-cli
```

### Development Installation
```bash
cd nginx-proxy-manager/cli
npm install
npm link  # Creates global symlink for development
```

## Quick Start

### 1. Configure API Connection
```bash
# Set the API URL (default: http://localhost:3000)
npm-cli config --set apiUrl=http://your-npm-instance:3000

# Or use environment variable
export NPM_API_URL=http://your-npm-instance:3000
```

### 2. Authenticate
```bash
# Interactive login
npm-cli login

# With credentials
npm-cli login --email admin@example.com --password changeme --save

# Or use environment variable
export NPM_TOKEN=your-api-token
```

### 3. Check Status
```bash
npm-cli status
```

### 4. List Resources
```bash
# List all proxy hosts
npm-cli hosts list

# List enabled hosts only
npm-cli hosts list --enabled-only

# Search for specific hosts
npm-cli hosts list --query "example.com"
```

## Usage Examples

### Proxy Host Management

#### Create a Simple Proxy Host
```bash
npm-cli hosts create \
  --domain-names "app.example.com" \
  --forward-host "192.168.1.100" \
  --forward-port 8080
```

#### Create with SSL
```bash
npm-cli hosts create \
  --domain-names "secure.example.com" \
  --forward-host "192.168.1.100" \
  --forward-port 8443 \
  --ssl-forced \
  --certificate-id 1
```

#### Interactive Creation
```bash
npm-cli hosts create
```

#### Update a Host
```bash
npm-cli hosts update 1 \
  --forward-port 9000 \
  --ssl-forced
```

#### Enable/Disable Hosts
```bash
npm-cli hosts enable 1
npm-cli hosts disable 1
```

### SSL Certificate Management

#### Create Let's Encrypt Certificate
```bash
npm-cli certs create \
  --name "Example Cert" \
  --domain-names "example.com,www.example.com" \
  --type letsencrypt \
  --letsencrypt-email admin@example.com
```

#### Create Custom Certificate
```bash
npm-cli certs create \
  --name "Custom Cert" \
  --domain-names "example.com" \
  --type custom \
  --cert-file /path/to/cert.pem \
  --key-file /path/to/key.pem
```

#### Renew Certificate
```bash
npm-cli certs renew 1
```

### Access List Management

#### Create IP Whitelist
```bash
npm-cli access-lists create \
  --name "Office IPs" \
  --clients "192.168.1.0/24,10.0.0.0/8"
```

#### Create with Basic Auth
```bash
npm-cli access-lists create \
  --name "Protected Area" \
  --auth "admin:secretpass,user:password"
```

#### Interactive Creation
```bash
npm-cli access-lists create
```

### Stream Management

#### Create TCP Stream
```bash
npm-cli streams create \
  --name "Database Stream" \
  --incoming-port 5432 \
  --forward-host "db.internal.com" \
  --forward-port 5432 \
  --tcp
```

#### Create UDP Stream
```bash
npm-cli streams create \
  --name "DNS Stream" \
  --incoming-port 53 \
  --forward-host "8.8.8.8" \
  --forward-port 53 \
  --udp
```

### Redirection Management

#### Create 301 Redirect
```bash
npm-cli redirections create \
  --domain-names "old.example.com" \
  --redirect-to "https://new.example.com" \
  --code 301
```

#### Create Temporary Redirect
```bash
npm-cli redirections create \
  --domain-names "maintenance.example.com" \
  --redirect-to "https://status.example.com" \
  --code 302
```

## Configuration

### Environment Variables
- `NPM_API_URL` - API endpoint URL
- `NPM_TOKEN` - Authentication token
- `NPM_CLI_DEBUG` - Enable debug mode

### Configuration File
The CLI stores configuration in `~/.npm-cli/config.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "timeout": 30000,
  "retries": 3,
  "outputFormat": "table",
  "verifySsl": true,
  "debug": false
}
```

### Configuration Commands
```bash
# Show current configuration
npm-cli config --show

# Set configuration values
npm-cli config --set apiUrl=http://localhost:3000
npm-cli config --set timeout=60000
npm-cli config --set outputFormat=json

# Get specific value
npm-cli config --get apiUrl

# Reset to defaults
npm-cli config --reset
```

## Output Formats

### Table Format (Default)
```bash
npm-cli hosts list
```

### JSON Format
```bash
npm-cli hosts list --json
# or
npm-cli config --set outputFormat=json
```

### YAML Format
```bash
npm-cli hosts list --yaml
```

## Advanced Features

### Batch Operations
```bash
# Export all hosts to JSON
npm-cli hosts list --json > hosts-backup.json

# Process multiple operations
for host in $(npm-cli hosts list --json | jq -r '.[].id'); do
  npm-cli hosts disable $host
done
```

### Search and Filtering
```bash
# Search by domain name
npm-cli hosts list --query "example.com"

# Filter by status
npm-cli hosts list --enabled-only
npm-cli certs list --expired-only

# Expand related data
npm-cli hosts show 1 --expand "certificate,access_list"
```

### Scripting and Automation
```bash
#!/bin/bash
# Automated backup script

# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Export all configurations
npm-cli hosts list --json > backups/$(date +%Y%m%d)/hosts.json
npm-cli certs list --json > backups/$(date +%Y%m%d)/certificates.json
npm-cli access-lists list --json > backups/$(date +%Y%m%d)/access-lists.json
npm-cli streams list --json > backups/$(date +%Y%m%d)/streams.json
npm-cli redirections list --json > backups/$(date +%Y%m%d)/redirections.json

echo "Backup completed: backups/$(date +%Y%m%d)/"
```

## Error Handling

The CLI provides detailed error messages and suggestions:

```bash
# Authentication error
$ npm-cli hosts list
Error: Authentication failed. Please login again.
Run: npm-cli login

# Validation error
$ npm-cli hosts create --domain-names "invalid-domain"
Error: Validation Error: Invalid domain name format

# Network error
$ npm-cli hosts list
Error: Network Error: Connection refused
Check your API URL configuration
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```bash
   # Check token status
   npm-cli status
   
   # Re-authenticate
   npm-cli login
   ```

2. **Connection Refused**
   ```bash
   # Check API URL
   npm-cli config --get apiUrl
   
   # Test connectivity
   npm-cli status
   ```

3. **Permission Denied**
   ```bash
   # Check user permissions
   npm-cli status
   
   # Contact administrator for appropriate role assignment
   ```

4. **Certificate Issues**
   ```bash
   # Check certificate status
   npm-cli certs list --expired-only
   
   # Renew expired certificates
   npm-cli certs renew <id>
   ```

### Debug Mode
```bash
# Enable debug output
npm-cli --verbose hosts list

# Or set environment variable
export NPM_CLI_DEBUG=true
```

## Development

### Project Structure
```
nginx-proxy-manager/cli/
├── bin/
│   └── npm-cli.js          # Main CLI entry point
├── lib/
│   ├── api.js              # API client
│   ├── config.js           # Configuration management
│   └── utils.js            # Utility functions
├── commands/
│   ├── auth.js             # Authentication commands
│   ├── hosts.js            # Proxy host commands
│   ├── certificates.js     # Certificate commands
│   ├── access-lists.js     # Access list commands
│   ├── streams.js          # Stream commands
│   ├── redirection.js      # Redirection commands
│   └── settings.js         # Settings commands
├── package.json
└── README.md
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Development Mode
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- 📖 **Documentation**: [https://nginxproxymanager.com](https://nginxproxymanager.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/NginxProxyManager/nginx-proxy-manager/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/NginxProxyManager/nginx-proxy-manager/discussions)
- 📝 **Wiki**: [Project Wiki](https://github.com/NginxProxyManager/nginx-proxy-manager/wiki)

## Changelog

### v1.0.0
- Initial release
- Full CRUD operations for all resource types
- Interactive and batch modes
- Multiple output formats
- Comprehensive authentication
- Advanced search and filtering
- Configuration management
- Error handling and validation