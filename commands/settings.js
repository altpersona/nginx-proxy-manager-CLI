const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('../lib/utils');

function settingsCommands(program) {
  const settingsCmd = program
    .command('settings')
    .alias('config')
    .description('System settings management commands');

  // Get settings command
  settingsCmd
    .command('get')
    .description('Get system settings')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching system settings...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const settings = await api.getSettings();

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(settings, 'json'));
        } else {
          console.log(formatOutput(settings));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Update settings command
  settingsCmd
    .command('update')
    .description('Update system settings')
    .option('--default-site <id>', 'Default site ID')
    .option('--ssl-policy <policy>', 'SSL policy (Modern, Intermediate, Old)')
    .option('--hsts-enabled', 'Enable HSTS')
    .option('--no-hsts-enabled', 'Disable HSTS')
    .option('--hsts-max-age <seconds>', 'HSTS max age in seconds')
    .option('--hsts-include-subdomains', 'Include subdomains in HSTS')
    .option('--no-hsts-include-subdomains', 'Exclude subdomains from HSTS')
    .option('--hsts-preload', 'Enable HSTS preload')
    .option('--no-hsts-preload', 'Disable HSTS preload')
    .option('--log-access <path>', 'Access log path')
    .option('--log-error <path>', 'Error log path')
    .option('--log-level <level>', 'Log level (debug, info, notice, warn, error, crit, alert, emerg)')
    .option('--ipv6-enabled', 'Enable IPv6')
    .option('--no-ipv6-enabled', 'Disable IPv6')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching current settings...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentSettings = await api.getSettings();

        spinner.stop();

        // Prepare update data
        const updateData = {
          ...currentSettings
        };

        // Apply updates based on provided options
        if (options.defaultSite !== undefined) {
          updateData.default_site = parseInt(options.defaultSite);
        }

        if (options.sslPolicy !== undefined) {
          const validPolicies = ['Modern', 'Intermediate', 'Old'];
          if (!validPolicies.includes(options.sslPolicy)) {
            throw new Error(`Invalid SSL policy. Must be one of: ${validPolicies.join(', ')}`);
          }
          updateData.ssl_policy = options.sslPolicy;
        }

        if (options.hstsEnabled !== undefined) {
          updateData.hsts_enabled = options.hstsEnabled;
        }

        if (options.hstsMaxAge !== undefined) {
          updateData.hsts_max_age = parseInt(options.hstsMaxAge);
        }

        if (options.hstsIncludeSubdomains !== undefined) {
          updateData.hsts_include_subdomains = options.hstsIncludeSubdomains;
        }

        if (options.hstsPreload !== undefined) {
          updateData.hsts_preload = options.hstsPreload;
        }

        if (options.logAccess !== undefined) {
          updateData.log_access = options.logAccess;
        }

        if (options.logError !== undefined) {
          updateData.log_error = options.logError;
        }

        if (options.logLevel !== undefined) {
          const validLevels = ['debug', 'info', 'notice', 'warn', 'error', 'crit', 'alert', 'emerg'];
          if (!validLevels.includes(options.logLevel)) {
            throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
          }
          updateData.log_level = options.logLevel;
        }

        if (options.ipv6Enabled !== undefined) {
          updateData.ipv6_enabled = options.ipv6Enabled;
        }

        // If no options provided, show interactive prompt
        if (Object.keys(options).filter(key => key !== 'json').length === 0) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'defaultSite',
              message: 'Default site ID:',
              default: currentSettings.default_site?.toString() || '0',
              when: () => currentSettings.default_site !== undefined
            },
            {
              type: 'list',
              name: 'sslPolicy',
              message: 'SSL policy:',
              choices: ['Modern', 'Intermediate', 'Old'],
              default: currentSettings.ssl_policy || 'Intermediate'
            },
            {
              type: 'confirm',
              name: 'hstsEnabled',
              message: 'Enable HSTS:',
              default: currentSettings.hsts_enabled || false
            },
            {
              type: 'input',
              name: 'hstsMaxAge',
              message: 'HSTS max age (seconds):',
              default: currentSettings.hsts_max_age?.toString() || '31536000',
              when: (answers) => answers.hstsEnabled || currentSettings.hsts_enabled
            },
            {
              type: 'confirm',
              name: 'hstsIncludeSubdomains',
              message: 'Include subdomains in HSTS:',
              default: currentSettings.hsts_include_subdomains || false,
              when: (answers) => answers.hstsEnabled || currentSettings.hsts_enabled
            },
            {
              type: 'confirm',
              name: 'hstsPreload',
              message: 'Enable HSTS preload:',
              default: currentSettings.hsts_preload || false,
              when: (answers) => answers.hstsEnabled || currentSettings.hsts_enabled
            },
            {
              type: 'input',
              name: 'logAccess',
              message: 'Access log path:',
              default: currentSettings.log_access || '/data/logs/access.log'
            },
            {
              type: 'input',
              name: 'logError',
              message: 'Error log path:',
              default: currentSettings.log_error || '/data/logs/error.log'
            },
            {
              type: 'list',
              name: 'logLevel',
              message: 'Log level:',
              choices: ['debug', 'info', 'notice', 'warn', 'error', 'crit', 'alert', 'emerg'],
              default: currentSettings.log_level || 'warn'
            },
            {
              type: 'confirm',
              name: 'ipv6Enabled',
              message: 'Enable IPv6:',
              default: currentSettings.ipv6_enabled || false
            }
          ]);

          // Apply answers to update data
          if (answers.defaultSite !== undefined) {
            updateData.default_site = parseInt(answers.defaultSite);
          }
          updateData.ssl_policy = answers.sslPolicy;
          updateData.hsts_enabled = answers.hstsEnabled;
          if (answers.hstsMaxAge !== undefined) {
            updateData.hsts_max_age = parseInt(answers.hstsMaxAge);
          }
          if (answers.hstsIncludeSubdomains !== undefined) {
            updateData.hsts_include_subdomains = answers.hstsIncludeSubdomains;
          }
          if (answers.hstsPreload !== undefined) {
            updateData.hsts_preload = answers.hstsPreload;
          }
          updateData.log_access = answers.logAccess;
          updateData.log_error = answers.logError;
          updateData.log_level = answers.logLevel;
          updateData.ipv6_enabled = answers.ipv6Enabled;
        }

        const updateSpinner = createSpinner('Updating settings...');
        updateSpinner.start();

        const result = await api.updateSettings(updateData);

        updateSpinner.stop();

        success('Settings updated successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Reset settings command
  settingsCmd
    .command('reset')
    .description('Reset settings to defaults')
    .option('-f, --force', 'Force reset without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to reset all settings to defaults?',
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Reset cancelled');
            return;
          }
        }

        const spinner = createSpinner('Resetting settings...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        
        // Get default settings (this would typically be defined somewhere)
        const defaultSettings = {
          default_site: 0,
          ssl_policy: 'Intermediate',
          hsts_enabled: false,
          hsts_max_age: 31536000,
          hsts_include_subdomains: false,
          hsts_preload: false,
          log_access: '/data/logs/access.log',
          log_error: '/data/logs/error.log',
          log_level: 'warn',
          ipv6_enabled: false
        };

        const result = await api.updateSettings(defaultSettings);

        spinner.stop();

        success('Settings reset to defaults successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // System status command
  settingsCmd
    .command('status')
    .description('Get system status and version information')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching system status...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const status = await api.getSystemStatus();
        const version = await api.getSystemVersion();

        spinner.stop();

        const combinedInfo = {
          status: status,
          version: version
        };

        if (options.json) {
          console.log(formatOutput(combinedInfo, 'json'));
        } else {
          console.log(formatOutput(combinedInfo));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Backup settings command
  settingsCmd
    .command('backup')
    .description('Backup current settings to file')
    .option('-o, --output <file>', 'Output file path')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Backing up settings...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const settings = await api.getSettings();

        spinner.stop();

        const fs = require('fs-extra');
        const path = require('path');

        const outputFile = options.output || `npm-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
        const backupData = {
          timestamp: new Date().toISOString(),
          settings: settings
        };

        await fs.writeJson(outputFile, backupData, { spaces: 2 });

        success(`Settings backed up to ${outputFile}`);

        if (options.json) {
          console.log(formatOutput({ backupFile: outputFile, timestamp: backupData.timestamp }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Restore settings command
  settingsCmd
    .command('restore')
    .description('Restore settings from backup file')
    .option('-f, --file <file>', 'Backup file path')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        if (!options.file) {
          throw new Error('Backup file path is required');
        }

        const fs = require('fs-extra');

        if (!await fs.pathExists(options.file)) {
          throw new Error(`Backup file not found: ${options.file}`);
        }

        const spinner = createSpinner('Reading backup file...');
        spinner.start();

        const backupData = await fs.readJson(options.file);
        
        if (!backupData.settings) {
          throw new Error('Invalid backup file format');
        }

        spinner.text = 'Restoring settings...';

        const api = new NginxProxyManagerAPI();
        const result = await api.updateSettings(backupData.settings);

        spinner.stop();

        success('Settings restored successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return settingsCmd;
}

module.exports = settingsCommands;