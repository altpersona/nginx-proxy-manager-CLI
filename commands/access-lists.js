const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('../lib/utils');

function accessListsCommands(program) {
  const accessCmd = program
    .command('access-lists')
    .alias('access')
    .description('Access list management commands');

  // List access lists command
  accessCmd
    .command('list')
    .alias('ls')
    .description('List all access lists')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching access lists...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const accessLists = await api.getAccessLists();

        spinner.stop();

        if (accessLists.length === 0) {
          warning('No access lists found');
          return;
        }

        if (options.json) {
          console.log(formatOutput(accessLists, 'json'));
        } else {
          const formattedLists = accessLists.map(list => ({
            id: list.id,
            name: list.name,
            pass_auth: list.pass_auth,
            satisfy_any: list.satisfy_any,
            items: list.access_list ? list.access_list.length : 0
          }));
          console.log(formatOutput(formattedLists));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Get access list details command
  accessCmd
    .command('get <id>')
    .description('Get access list details')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Fetching access list details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const accessList = await api.getAccessList(id);

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(accessList, 'json'));
        } else {
          console.log(formatOutput(accessList));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Create access list command
  accessCmd
    .command('create')
    .description('Create a new access list')
    .option('-n, --name <name>', 'Access list name')
    .option('--pass-auth', 'Pass authentication to upstream')
    .option('--no-pass-auth', 'Do not pass authentication to upstream')
    .option('--satisfy-any', 'Satisfy any authentication method')
    .option('--satisfy-all', 'Satisfy all authentication methods')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let {
          name,
          passAuth,
          satisfyAny
        } = options;

        // Prompt for missing required values
        if (!name) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Access list name:',
              validate: (input) => {
                if (!input.trim()) return 'Access list name is required';
                return true;
              }
            }
          ]);
          name = answers.name;
        }

        if (passAuth === undefined) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'passAuth',
              message: 'Pass authentication to upstream?',
              default: false
            }
          ]);
          passAuth = answers.passAuth;
        }

        if (satisfyAny === undefined) {
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'satisfy',
              message: 'Authentication satisfaction:',
              choices: [
                { name: 'Satisfy any authentication method', value: true },
                { name: 'Satisfy all authentication methods', value: false }
              ],
              default: false
            }
          ]);
          satisfyAny = answers.satisfy;
        }

        // Prepare data
        const accessListData = {
          name: name,
          pass_auth: passAuth,
          satisfy_any: satisfyAny,
          access_list: [],
          client_certificate: null
        };

        const spinner = createSpinner('Creating access list...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.createAccessList(accessListData);

        spinner.stop();

        success('Access list created successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Update access list command
  accessCmd
    .command('update <id>')
    .description('Update an access list')
    .option('-n, --name <name>', 'Access list name')
    .option('--pass-auth', 'Pass authentication to upstream')
    .option('--no-pass-auth', 'Do not pass authentication to upstream')
    .option('--satisfy-any', 'Satisfy any authentication method')
    .option('--satisfy-all', 'Satisfy all authentication methods')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        // Get current access list details
        const spinner = createSpinner('Fetching current access list details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentList = await api.getAccessList(id);

        spinner.stop();

        // Merge updates with current data
        const updateData = {
          name: options.name || currentList.name,
          pass_auth: options.passAuth !== undefined ? options.passAuth : currentList.pass_auth,
          satisfy_any: options.satisfyAny !== undefined ? options.satisfyAny : currentList.satisfy_any,
          access_list: currentList.access_list,
          client_certificate: currentList.client_certificate
        };

        const updateSpinner = createSpinner('Updating access list...');
        updateSpinner.start();

        const result = await api.updateAccessList(id, updateData);

        updateSpinner.stop();

        success('Access list updated successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Delete access list command
  accessCmd
    .command('delete <id>')
    .description('Delete an access list')
    .option('-f, --force', 'Force deletion without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete access list ${id}?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Deletion cancelled');
            return;
          }
        }

        const spinner = createSpinner('Deleting access list...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.deleteAccessList(id);

        spinner.stop();

        success(`Access list ${id} deleted successfully!`);

        if (options.json) {
          console.log(formatOutput({ message: 'Access list deleted successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Add access rule command
  accessCmd
    .command('add-rule <id>')
    .description('Add an access rule to an access list')
    .option('--ip <ip>', 'IP address or CIDR')
    .option('--username <username>', 'Username for basic auth')
    .option('--password <password>', 'Password for basic auth')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        let { ip, username, password } = options;

        // Get current access list
        const spinner = createSpinner('Fetching access list...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const accessList = await api.getAccessList(id);

        spinner.stop();

        // Prompt for missing values
        if (!ip && !username) {
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'ruleType',
              message: 'Rule type:',
              choices: [
                { name: 'IP Address', value: 'ip' },
                { name: 'Basic Auth', value: 'auth' }
              ]
            }
          ]);

          if (answers.ruleType === 'ip') {
            const ipAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'ip',
                message: 'IP address or CIDR (e.g., 192.168.1.1 or 192.168.1.0/24):',
                validate: (input) => {
                  if (!input.trim()) return 'IP address is required';
                  return true;
                }
              }
            ]);
            ip = ipAnswers.ip;
          } else {
            const authAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'username',
                message: 'Username:',
                validate: (input) => {
                  if (!input.trim()) return 'Username is required';
                  return true;
                }
              },
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
            username = authAnswers.username;
            password = authAnswers.password;
          }
        }

        // Create new rule
        let newRule;
        if (ip) {
          newRule = {
            direct: {
              address: ip,
              action: 'allow'
            }
          };
        } else if (username && password) {
          newRule = {
            auth: {
              username: username,
              password: password
            }
          };
        }

        // Add rule to access list
        const updatedAccessList = {
          ...accessList,
          access_list: [...accessList.access_list, newRule]
        };

        const updateSpinner = createSpinner('Adding access rule...');
        updateSpinner.start();

        const result = await api.updateAccessList(id, updatedAccessList);

        updateSpinner.stop();

        success('Access rule added successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Remove access rule command
  accessCmd
    .command('remove-rule <id>')
    .description('Remove an access rule from an access list')
    .option('--rule-index <index>', 'Index of the rule to remove')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        // Get current access list
        const spinner = createSpinner('Fetching access list...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const accessList = await api.getAccessList(id);

        spinner.stop();

        if (!accessList.access_list || accessList.access_list.length === 0) {
          warning('No access rules found in this access list');
          return;
        }

        let ruleIndex = options.ruleIndex ? parseInt(options.ruleIndex) : -1;

        if (ruleIndex === -1) {
          // Show current rules and let user select
          console.log('Current access rules:');
          accessList.access_list.forEach((rule, index) => {
            if (rule.direct) {
              console.log(`  [${index}] IP: ${rule.direct.address} (${rule.direct.action})`);
            } else if (rule.auth) {
              console.log(`  [${index}] Auth: ${rule.auth.username}`);
            }
          });

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'ruleIndex',
              message: 'Enter the index of the rule to remove:',
              validate: (input) => {
                const index = parseInt(input);
                if (isNaN(index) || index < 0 || index >= accessList.access_list.length) {
                  return 'Please enter a valid rule index';
                }
                return true;
              }
            }
          ]);
          ruleIndex = parseInt(answers.ruleIndex);
        }

        // Remove rule
        const updatedAccessList = {
          ...accessList,
          access_list: accessList.access_list.filter((_, index) => index !== ruleIndex)
        };

        const updateSpinner = createSpinner('Removing access rule...');
        updateSpinner.start();

        const result = await api.updateAccessList(id, updatedAccessList);

        updateSpinner.stop();

        success('Access rule removed successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return accessCmd;
}

module.exports = accessListsCommands;