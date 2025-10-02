#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const { getConfig, initConfig } = require('../lib/config-manager');
const auth = require('../commands/auth');
const hosts = require('../commands/hosts');
const certificates = require('../commands/certificates');
const accessLists = require('../commands/access-lists');
const streams = require('../commands/streams');
const redirection = require('../commands/redirection');
const settings = require('../commands/settings');
const { handleError, showBanner } = require('../lib/utils');

const program = new Command();

// Configure the main program
program
  .name('npm-cli')
  .description('Nginx Proxy Manager CLI - Manage your reverse proxy configuration from the command line')
  .version(pkg.version, '-v, --version', 'output the current version')
  .option('-u, --url <url>', 'Nginx Proxy Manager API URL', getConfig().getApiUrl())
  .option('-t, --token <token>', 'Authentication token (or use NPM_TOKEN env var)')
  .option('--config <path>', 'Path to configuration file')
  .option('--json', 'Output results as JSON')
  .option('--verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    
    // Initialize configuration
    getConfig().init(options);
    
    // Show banner
    if (!options.json) {
      showBanner();
    }
  });

// Authentication commands
program
  .command('login')
  .description('Authenticate with Nginx Proxy Manager')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .option('--save', 'Save credentials to config file')
  .action(async (options) => {
    try {
      await auth.login(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('logout')
  .description('Logout and remove stored credentials')
  .action(async () => {
    try {
      await auth.logout();
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('status')
  .description('Check authentication status and API connectivity')
  .action(async () => {
    try {
      await auth.status();
    } catch (error) {
      handleError(error);
    }
  });

// Proxy hosts commands
program
  .command('hosts')
  .description('Manage proxy hosts')
  .addCommand(hosts.listCommand())
  .addCommand(hosts.createCommand())
  .addCommand(hosts.updateCommand())
  .addCommand(hosts.deleteCommand())
  .addCommand(hosts.enableCommand())
  .addCommand(hosts.disableCommand())
  .addCommand(hosts.showCommand());

// Certificate commands
program
  .command('certs')
  .alias('certificates')
  .description('Manage SSL certificates')
  .addCommand(certificates.listCommand())
  .addCommand(certificates.createCommand())
  .addCommand(certificates.deleteCommand())
  .addCommand(certificates.renewCommand())
  .addCommand(certificates.showCommand());

// Access lists commands
program
  .command('access-lists')
  .alias('acl')
  .description('Manage access lists')
  .addCommand(accessLists.listCommand())
  .addCommand(accessLists.createCommand())
  .addCommand(accessLists.updateCommand())
  .addCommand(accessLists.deleteCommand())
  .addCommand(accessLists.showCommand());

// Stream commands
program
  .command('streams')
  .description('Manage stream hosts')
  .addCommand(streams.listCommand())
  .addCommand(streams.createCommand())
  .addCommand(streams.updateCommand())
  .addCommand(streams.deleteCommand())
  .addCommand(streams.enableCommand())
  .addCommand(streams.disableCommand())
  .addCommand(streams.showCommand());

// Redirection hosts commands
program
  .command('redirections')
  .alias('redirects')
  .description('Manage redirection hosts')
  .addCommand(redirection.listCommand())
  .addCommand(redirection.createCommand())
  .addCommand(redirection.updateCommand())
  .addCommand(redirection.deleteCommand())
  .addCommand(redirection.enableCommand())
  .addCommand(redirection.disableCommand())
  .addCommand(redirection.showCommand());

// Settings commands
program
  .command('settings')
  .description('Manage system settings')
  .addCommand(settings.listCommand())
  .addCommand(settings.updateCommand())
  .addCommand(settings.showCommand());

// Utility commands
program
  .command('config')
  .description('Manage CLI configuration')
  .option('--show', 'Show current configuration')
  .option('--set <key=value>', 'Set configuration value')
  .option('--get <key>', 'Get configuration value')
  .option('--reset', 'Reset configuration to defaults')
  .action(async (options) => {
    try {
      await getConfig().manage(options);
    } catch (error) {
      handleError(error);
    }
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}