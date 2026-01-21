# Nginx Proxy Manager CLI

A comprehensive command-line interface for managing Nginx Proxy Manager instances. This CLI tool provides full access to all Nginx Proxy Manager features including proxy hosts, SSL certificates, access lists, streams, redirections, and system settings.

## 🎉 Version 0.2.1 Released!

**✅ Critical bug fixes for SSL flag handling and disable/enable commands!**

### 🔧 Fixed in 0.2.1:
- **SSL Boolean Flags** - `--ssl-forced false` and `--no-ssl-forced` now work correctly
- **Disable/Enable Commands** - No more "additional properties" errors
- **Boolean Logic** - Consistent handling across all command types

[📖 View Release Notes](RELEASE_NOTES.md)

## Features

- 🔐 **Authentication Management** - Login, logout, and token management
- 🌐 **Proxy Hosts** - Create, update, delete, and manage proxy hosts
- 🔒 **SSL Certificates** - Manage Let's Encrypt and custom SSL certificates
- 🛡️ **Access Lists** - Configure IP and authentication-based access controls
- 🔄 **Streams** - Manage TCP/UDP stream forwarding
- ↗️ **Redirections** - Set up HTTP/HTTPS redirections
- ⚙️ **Settings** - Configure system-wide settings and preferences
- 📊 **Output Formats** - Table and JSON output formats
- 🎯 **Interactive Mode** - Guided prompts for complex operations
- 🚀 **Batch Operations** - Perform bulk operations efficiently

## Installation

```bash
npm install -g nginx-proxy-manager-cli
```

Or clone and install locally:

```bash
git clone <repository-url>
cd nginx-proxy-manager-cli
npm install
npm link
```

## Quick Start

1. **Login to your Nginx Proxy Manager instance:**
   ```bash
   npm-cli auth login
   ```

2. **List your proxy hosts:**
   ```bash
   npm-cli hosts list
   ```

3. **Create a new proxy host:**
   ```bash
   npm-cli hosts create -d example.com -h 192.168.1.100 -p 8080
   ```

## Authentication

### Login
```bash
npm-cli auth login [options]
```

Options:
- `-e, --email <email>` - Email address
- `-p, --password <password>` - Password
- `-u, --url <url>` - Nginx Proxy Manager URL (default: http://localhost:81)

### Check Authentication Status
```bash
npm-cli auth status
```

### Logout
```bash
npm-cli auth logout
```

### View Current User
```bash
npm-cli auth whoami
```

### View Configuration
```bash
npm-cli auth config
```

## Proxy Hosts Management

### List Proxy Hosts
```bash
npm-cli hosts list [options]
```

Options:
- `--enabled` - Show only enabled hosts
- `--disabled` - Show only disabled hosts
- `--json` - Output in JSON format

### Get Host Details
```bash
npm-cli hosts get <id> [options]
```

### Create Proxy Host
```bash
npm-cli hosts create [options]
```

Options:
- `-d, --domains <domains>` - Comma-separated list of domains
- `-h, --forward-host <host>` - Forward host
- `-p, --forward-port <port>` - Forward port
- `-s, --forward-scheme <scheme>` - Forward scheme (http/https, default: http)
- `-c, --certificate-id <id>` - Certificate ID
- `--ssl-forced` - Force SSL
- `--http2` - Enable HTTP2
- `--enabled` - Enable the host (default: true)
- `--advanced <config>` - Advanced configuration
- `--access-list-id <id>` - Access list ID

### Update Proxy Host
```bash
npm-cli hosts update <id> [options]
```

Options are the same as create, but all are optional.

### Delete Proxy Host
```bash
npm-cli hosts delete <id> [options]
```

Options:
- `-f, --force` - Force deletion without confirmation

### Enable/Disable Host
```bash
npm-cli hosts enable <id>
npm-cli hosts disable <id>
```

## SSL Certificate Management

### List Certificates
```bash
npm-cli certificates list [options]
```

Options:
- `--expired` - Show only expired certificates
- `--valid` - Show only valid certificates
- `--json` - Output in JSON format

### Get Certificate Details
```bash
npm-cli certificates get <id> [options]
```

### Create Certificate
```bash
npm-cli certificates create [options]
```

Options:
- `-n, --name <name>` - Certificate name
- `-d, --domains <domains>` - Comma-separated list of domains
- `-p, --provider <provider>` - Certificate provider (letsencrypt/custom, default: letsencrypt)
- `--letsencrypt-email <email>` - Let's Encrypt email address
- `--dns-provider <provider>` - DNS provider for DNS challenge
- `--dns-credentials <credentials>` - DNS provider credentials (JSON format)
- `--agree-tos` - Agree to Let's Encrypt Terms of Service

### Delete Certificate
```bash
npm-cli certificates delete <id> [options]
```

Options:
- `-f, --force` - Force deletion without confirmation

### Renew Certificate
```bash
npm-cli certificates renew <id> [options]
```

### Test Certificate
```bash
npm-cli certificates test <id> [options]
```

### Auto-renew Expiring Certificates
```bash
npm-cli certificates auto-renew [options]
```

Options:
- `--days <days>` - Renew certificates expiring in less than N days (default: 30)

## Access Lists Management

### List Access Lists
```bash
npm-cli access-lists list [options]
```

Options:
- `--json` - Output in JSON format

### Get Access List Details
```bash
npm-cli access-lists get <id> [options]
```

### Create Access List
```bash
npm-cli access-lists create [options]
```

Options:
- `-n, --name <name>` - Access list name
- `--pass-auth` - Pass authentication to upstream
- `--no-pass-auth` - Do not pass authentication to upstream
- `--satisfy-any` - Satisfy any authentication method
- `--satisfy-all` - Satisfy all authentication methods

### Update Access List
```bash
npm-cli access-lists update <id> [options]
```

Options are the same as create, but all are optional.

### Delete Access List
```bash
npm-cli access-lists delete <id> [options]
```

Options:
- `-f, --force` - Force deletion without confirmation

### Add Access Rule
```bash
npm-cli access-lists add-rule <id> [options]
```

Options:
- `--ip <ip>` - IP address or CIDR
- `--username <username>` - Username for basic auth
- `--password <password>` - Password for basic auth

### Remove Access Rule
```bash
npm-cli access-lists remove-rule <id> [options]
```

Options:
- `--rule-index <index>` - Index of the rule to remove

## Stream Management

### List Streams
```bash
npm-cli streams list [options]
```

Options:
- `--tcp` - Show only TCP streams
- `--udp` - Show only UDP streams
- `--enabled` - Show only enabled streams
- `--disabled` - Show only disabled streams
- `--json` - Output in JSON format

### Get Stream Details
```bash
npm-cli streams get <id> [options]
```

### Create Stream
```bash
npm-cli streams create [options]
```

Options:
- `-i, --incoming-address <address>` - Incoming address (0.0.0.0 for all)
- `-p, --incoming-port <port>` - Incoming port
- `-h, --forward-host <host>` - Forward host
- `-f, --forward-port <port>` - Forward port
- `--tcp` - Enable TCP forwarding
- `--udp` - Enable UDP forwarding
- `--enabled` - Enable the stream (default: true)
- `--advanced <config>` - Advanced configuration

### Update Stream
```bash
npm-cli streams update <id> [options]
```

Options are the same as create, but all are optional.

### Delete Stream
```bash
npm-cli streams delete <id> [options]
```

Options:
- `-f, --force` - Force deletion without confirmation

### Enable/Disable Stream
```bash
npm-cli streams enable <id>
npm-cli streams disable <id>
```

### Test Stream
```bash
npm-cli streams test <id> [options]
```

## Redirection Management

### List Redirection Hosts
```bash
npm-cli redirection list [options]
```

Options:
- `--enabled` - Show only enabled redirections
- `--disabled` - Show only disabled redirections
- `--json` - Output in JSON format

### Get Redirection Details
```bash
npm-cli redirection get <id> [options]
```

### Create Redirection
```bash
npm-cli redirection create [options]
```

Options:
- `-d, --domains <domains>` - Comma-separated list of domains
- `--destination <destination>` - Destination URL
- `-t, --type <type>` - Redirection type (permanent/temporary/proxy, default: permanent)
- `-c, --code <code>` - HTTP redirect code (301, 302, 307, 308, default: 301)
- `--enabled` - Enable the redirection (default: true)
- `--advanced <config>` - Advanced configuration

### Update Redirection
```bash
npm-cli redirection update <id> [options]
```

Options are the same as create, but all are optional.

### Delete Redirection
```bash
npm-cli redirection delete <id> [options]
```

Options:
- `-f, --force` - Force deletion without confirmation

### Enable/Disable Redirection
```bash
npm-cli redirection enable <id>
npm-cli redirection disable <id>
```

### Test Redirection
```bash
npm-cli redirection test <id> [options]
```

## System Settings

### Get Settings
```bash
npm-cli settings get [options]
```

### Update Settings
```bash
npm-cli settings update [options]
```

Options:
- `--default-site <id>` - Default site ID
- `--ssl-policy <policy>` - SSL policy (Modern, Intermediate, Old)
- `--hsts-enabled` - Enable HSTS
- `--no-hsts-enabled` - Disable HSTS
- `--hsts-max-age <seconds>` - HSTS max age in seconds
- `--hsts-include-subdomains` - Include subdomains in HSTS
- `--no-hsts-include-subdomains` - Exclude subdomains from HSTS
- `--hsts-preload` - Enable HSTS preload
- `--no-hsts-preload` - Disable HSTS preload
- `--log-access <path>` - Access log path
- `--log-error <path>` - Error log path
- `--log-level <level>` - Log level
- `--ipv6-enabled` - Enable IPv6
- `--no-ipv6-enabled` - Disable IPv6

### Reset Settings
```bash
npm-cli settings reset [options]
```

Options:
- `-f, --force` - Force reset without confirmation

### System Status
```bash
npm-cli settings status [options]
```

### Backup Settings
```bash
npm-cli settings backup [options]
```

Options:
- `-o, --output <file>` - Output file path

### Restore Settings
```bash
npm-cli settings restore [options]
```

Options:
- `-f, --file <file>` - Backup file path (required)

## Global Options

All commands support these global options:

- `-u, --url <url>` - Nginx Proxy Manager URL (overrides config)
- `-t, --token <token>` - Authentication token (overrides config)
- `-c, --config <path>` - Path to config file
- `--json` - Output in JSON format
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-V, --version` - Show version

## Configuration

The CLI stores configuration in `~/.npm-cli/config.yaml`. You can manually edit this file or use the commands to update it.

### Environment Variables

- `NPM_URL` - Nginx Proxy Manager URL
- `NPM_TOKEN` - Authentication token

### Configuration File Format

```yaml
url: http://localhost:81
token: your-auth-token
outputFormat: table
timeout: 30000
verifySsl: true
```

## Examples

### Create a simple proxy host
```bash
npm-cli hosts create -d myapp.example.com -h 192.168.1.100 -p 3000
```

### Create a proxy host with SSL
```bash
npm-cli hosts create -d secure.example.com -h 192.168.1.100 -p 443 -s https --ssl-forced
```

### Create a Let's Encrypt certificate
```bash
npm-cli certificates create -n "My Certificate" -d example.com,www.example.com --letsencrypt-email admin@example.com --agree-tos
```

### Create an access list with IP restrictions
```bash
npm-cli access-lists create -n "Internal Access" --pass-auth
npm-cli access-lists add-rule 1 --ip 192.168.1.0/24
npm-cli access-lists add-rule 1 --ip 10.0.0.0/8
```

### Create a TCP stream
```bash
npm-cli streams create -i 0.0.0.0 -p 3306 -h 192.168.1.50 -f 3306 --tcp
```

### Create a permanent redirect
```bash
npm-cli redirection create -d old.example.com --destination https://new.example.com --type permanent
```

## Gitea Fix Commands

Having issues with Gitea showing 500 errors? Use these quick fix commands:

```bash
# Fix Gitea proxy host (Host ID 2)
npm-cli hosts update 2 \
  --forward-scheme http \
  --forward-host localhost \
  --forward-port 3000 \
  --ssl-forced false \
  --advanced "proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme;"
```

Then restart:
```bash
npm-cli hosts disable 2 && npm-cli hosts enable 2
```

The SSL forcing flag issue has been fixed in version 0.2.1, so these commands should work properly now!

## Error Handling

The CLI provides detailed error messages for common issues:

- **Authentication failures** - Check your credentials and URL
- **Connection errors** - Verify the Nginx Proxy Manager is running and accessible
- **Validation errors** - Check input parameters and formats
- **Permission errors** - Ensure your user has appropriate permissions

Use `--verbose` flag for detailed error information.

## Development

### Setup Development Environment

```bash
git clone <repository-url>
cd nginx-proxy-manager-cli
npm install
```

### Run Tests

```bash
npm test
```

### Build Package

```bash
npm pack
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests and ensure they pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Changelog

### v1.0.0
- Initial release
- Full proxy host management
- SSL certificate management
- Access list management
- Stream management
- Redirection management
- System settings management
- Interactive prompts
- JSON output format
- Configuration management
- Backup and restore functionality