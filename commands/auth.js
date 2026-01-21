const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { updateConfig, getConfig } = require('../lib/config');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('../lib/utils');

function authCommands(program) {
  const authCmd = program
    .command('auth')
    .description('Authentication management commands');

  // Login command
  authCmd
    .command('login')
    .description('Login to Nginx Proxy Manager')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --password <password>', 'Password')
    .option('-u, --url <url>', 'Nginx Proxy Manager URL')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let { email, password, url } = options;

        // Prompt for missing values
        if (!email) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'email',
              message: 'Email address:',
              validate: (input) => {
                if (!input.trim()) return 'Email is required';
                return true;
              }
            }
          ]);
          email = answers.email;
        }

        if (!password) {
          const answers = await inquirer.prompt([
            {
              type: 'password',
              name: 'password',
              message: 'Password:',
              validate: (input) => {
                if (!input.trim()) return 'Password is required';
                return true;
              }
            }
          ]);
          password = answers.password;
        }

        if (!url) {
          const currentConfig = getConfig();
          url = currentConfig.url;
        }

        const spinner = createSpinner('Authenticating...');
        spinner.start();

        const api = new NginxProxyManagerAPI(url);
        const result = await api.login(email, password);

        spinner.stop();

        // Save the token to config
        updateConfig({
          url: url,
          token: result.token
        });

        success('Login successful!');
        info(`Token saved to config`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput({
            email: email,
            url: url,
            token: result.token.substring(0, 20) + '...'
          }));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Logout command
  authCmd
    .command('logout')
    .description('Logout and remove stored token')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const config = getConfig();
        
        if (!config.token) {
          warning('No active session found');
          return;
        }

        // Remove token from config
        updateConfig({ token: null });

        success('Logged out successfully');
        
        if (options.json) {
          console.log(formatOutput({ message: 'Logged out successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Status command
  authCmd
    .command('status')
    .description('Check authentication status')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      let spinner;
      try {
        const config = getConfig();
        
        if (!config.token) {
          warning('Not authenticated');
          if (options.json) {
            console.log(formatOutput({ authenticated: false }, 'json'));
          }
          return;
        }

        spinner = createSpinner('Verifying token...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.verifyToken();

        spinner.stop();

        success('Token is valid');
        
        if (options.json) {
          console.log(formatOutput({
            authenticated: true,
            url: config.url,
            token: config.token.substring(0, 20) + '...'
          }, 'json'));
        } else {
          console.log(formatOutput({
            status: 'Authenticated',
            url: config.url,
            token: config.token.substring(0, 20) + '...'
          }));
        }
      } catch (error) {
        if (spinner) {
          spinner.stop();
        }
        warning('Token is invalid or expired');
        if (options.json) {
          console.log(formatOutput({ authenticated: false, error: error.message }, 'json'));
        }
      }
    });

  // Whoami command
  authCmd
    .command('whoami')
    .description('Show current user information')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const config = getConfig();
        
        if (!config.token) {
          warning('Not authenticated');
          return;
        }

        const spinner = createSpinner('Getting user information...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.verifyToken();

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Config command
  authCmd
    .command('config')
    .description('Show current configuration')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const config = getConfig();
        const safeConfig = {
          ...config,
          token: config.token ? config.token.substring(0, 20) + '...' : null
        };

        if (options.json) {
          console.log(formatOutput(safeConfig, 'json'));
        } else {
          console.log(formatOutput(safeConfig));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return authCmd;
}

module.exports = authCommands;
