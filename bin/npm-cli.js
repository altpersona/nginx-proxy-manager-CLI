#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const packageJson = require('../package.json');

// Import command modules
const authCommands = require('../commands/auth');
const hostsCommands = require('../commands/hosts');
const certificatesCommands = require('../commands/certificates');
const accessListsCommands = require('../commands/access-lists');
const streamsCommands = require('../commands/streams');
const redirectionCommands = require('../commands/redirection');
const settingsCommands = require('../commands/settings');

// Display banner
console.log(
  boxen(
    chalk.blue.bold('Nginx Proxy Manager CLI') + '\n' +
    chalk.gray('Version: ' + packageJson.version) + '\n' +
    chalk.gray('Manage your Nginx Proxy Manager from the command line'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  )
);

// Configure the main program
program
  .name('npm-cli')
  .description('CLI for managing Nginx Proxy Manager')
  .version(packageJson.version)
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name()
  });

// Add global options
program
  .option('-u, --url <url>', 'Nginx Proxy Manager URL')
  .option('-t, --token <token>', 'Authentication token')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output in JSON format')
  .option('--verbose', 'Verbose output');

// Register command modules
authCommands(program);
hostsCommands(program);
certificatesCommands(program);
accessListsCommands(program);
streamsCommands(program);
redirectionCommands(program);
settingsCommands(program);

// Add a global error handler
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  if (err.code === 'commander.helpDisplayed') {
    // Help was displayed, this is not an error
    process.exit(0);
  } else if (err.code === 'commander.version') {
    // Version was displayed, this is not an error
    process.exit(0);
  } else {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}

// If no command was provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}