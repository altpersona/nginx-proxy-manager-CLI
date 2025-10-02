const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all access lists')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const accessLists = await api.getAccessLists(params);
        
        if (accessLists.length === 0) {
          utils.info('No access lists found');
          return;
        }
        
        utils.formatOutput(accessLists);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function createCommand() {
  const cmd = new Command('create');
  cmd.alias('add')
    .description('Create a new access list')
    .option('-n, --name <name>', 'Access list name')
    .option('-d, --description <description>', 'Access list description')
    .option('--satisfy-any', 'Satisfy any rule (default: all)')
    .option('--pass-auth <header>', 'Pass auth header')
    .option('--clients <clients>', 'Allowed clients (comma-separated IPs)')
    .option('--clients-removed <clients>', 'Denied clients (comma-separated IPs)')
    .option('--auth <users>', 'Basic auth users (format: user:pass,...)')
    .action(async (options) => {
      try {
        let data = {};
        
        // Interactive mode if not all required options provided
        if (!options.name) {
          data = await collectAccessListData(options);
        } else {
          data = {
            name: options.name,
            satisfy_any: options.satisfyAny || false,
            pass_auth: options.passAuth || false,
            meta: {}
          };
          
          if (options.description) {
            data.meta.description = options.description;
          }
          
          // Process clients
          if (options.clients) {
            data.clients = options.clients.split(',').map(c => c.trim());
          }
          
          if (options.clientsRemoved) {
            data.clients_removed = options.clientsRemoved.split(',').map(c => c.trim());
          }
          
          // Process auth users
          if (options.auth) {
            data.auth = options.auth.split(',').map(user => {
              const [username, password] = user.split(':');
              return { username, password };
            });
          }
        }
        
        const spinner = utils.showSpinner('Creating access list...');
        
        try {
          const accessList = await api.createAccessList(data);
          spinner.succeed('Access list created successfully!');
          
          utils.success(`Access List ID: ${accessList.id}`);
          utils.info(`Name: ${accessList.name}`);
          utils.info(`Satisfy: ${accessList.satisfy_any ? 'Any' : 'All'}`);
          
          if (accessList.clients && accessList.clients.length > 0) {
            utils.info(`Allowed Clients: ${accessList.clients.length}`);
          }
          
          if (accessList.auth && accessList.auth.length > 0) {
            utils.info(`Auth Users: ${accessList.auth.length}`);
          }
          
        } catch (error) {
          spinner.fail('Failed to create access list');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function updateCommand() {
  const cmd = new Command('update');
  cmd.alias('edit')
    .description('Update an existing access list')
    .argument('<id>', 'Access list ID', parseInt)
    .option('-n, --name <name>', 'Access list name')
    .option('-d, --description <description>', 'Access list description')
    .option('--satisfy-any', 'Satisfy any rule')
    .option('--pass-auth <header>', 'Pass auth header')
    .option('--clients <clients>', 'Allowed clients (comma-separated IPs)')
    .option('--clients-removed <clients>', 'Denied clients (comma-separated IPs)')
    .option('--auth <users>', 'Basic auth users (format: user:pass,...)')
    .action(async (id, options) => {
      try {
        // Get current access list data
        const currentAccessList = await api.getAccessList(id);
        
        // Merge with options
        const data = {
          ...currentAccessList,
          ...(options.name && { name: options.name }),
          ...(options.satisfyAny !== undefined && { satisfy_any: options.satisfyAny }),
          ...(options.passAuth !== undefined && { pass_auth: options.passAuth }),
          meta: { ...currentAccessList.meta }
        };
        
        if (options.description) {
          data.meta.description = options.description;
        }
        
        // Process clients
        if (options.clients) {
          data.clients = options.clients.split(',').map(c => c.trim());
        }
        
        if (options.clientsRemoved) {
          data.clients_removed = options.clientsRemoved.split(',').map(c => c.trim());
        }
        
        // Process auth users
        if (options.auth) {
          data.auth = options.auth.split(',').map(user => {
            const [username, password] = user.split(':');
            return { username, password };
          });
        }
        
        const spinner = utils.showSpinner('Updating access list...');
        
        try {
          const accessList = await api.updateAccessList(id, data);
          spinner.succeed('Access list updated successfully!');
          
          utils.success(`Access List ID: ${accessList.id}`);
          utils.info(`Name: ${accessList.name}`);
          utils.info(`Satisfy: ${accessList.satisfy_any ? 'Any' : 'All'}`);
          
        } catch (error) {
          spinner.fail('Failed to update access list');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function deleteCommand() {
  const cmd = new Command('delete');
  cmd.alias('rm')
    .description('Delete an access list')
    .argument('<id>', 'Access list ID', parseInt)
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (id, options) => {
      try {
        // Get access list info first
        const accessList = await api.getAccessList(id);
        
        if (!options.force) {
          const confirmed = await utils.confirmAction(
            `Are you sure you want to delete access list "${accessList.name}"?`
          );
          
          if (!confirmed) {
            utils.info('Deletion cancelled');
            return;
          }
        }
        
        const spinner = utils.showSpinner('Deleting access list...');
        
        try {
          await api.deleteAccessList(id);
          spinner.succeed('Access list deleted successfully!');
          
        } catch (error) {
          spinner.fail('Failed to delete access list');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function showCommand() {
  const cmd = new Command('show');
  cmd.description('Show detailed information about an access list')
    .argument('<id>', 'Access list ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const accessList = await api.getAccessList(id, params);
        
        utils.formatOutput(accessList);
        
        // Show additional details
        console.log(chalk.blue.bold('\nAccess Rules:'));
        
        if (accessList.clients && accessList.clients.length > 0) {
          console.log(chalk.green(`Allowed IPs (${accessList.clients.length}):`));
          accessList.clients.forEach(ip => console.log(`  - ${ip}`));
        }
        
        if (accessList.clients_removed && accessList.clients_removed.length > 0) {
          console.log(chalk.red(`Denied IPs (${accessList.clients_removed.length}):`));
          accessList.clients_removed.forEach(ip => console.log(`  - ${ip}`));
        }
        
        if (accessList.auth && accessList.auth.length > 0) {
          console.log(chalk.blue(`Basic Auth Users (${accessList.auth.length}):`));
          accessList.auth.forEach(user => console.log(`  - ${user.username}`));
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

async function collectAccessListData(options) {
  const data = {};
  
  // Name
  if (options.name) {
    data.name = options.name;
  } else {
    data.name = await utils.inputRequired('Access list name:');
  }
  
  // Description
  if (options.description) {
    data.meta = { description: options.description };
  } else {
    const description = await utils.inputRequired(
      'Description (optional):',
      null,
      true // Allow empty
    );
    if (description) {
      data.meta = { description };
    }
  }
  
  // Satisfy any/all
  data.satisfy_any = options.satisfyAny || await utils.confirmAction('Satisfy ANY rule (vs ALL)?');
  
  // Pass auth header
  data.pass_auth = options.passAuth !== undefined ? options.passAuth : 
                   await utils.confirmAction('Pass auth header?');
  
  // Allowed clients
  if (options.clients) {
    data.clients = options.clients.split(',').map(c => c.trim());
  } else {
    const hasClients = await utils.confirmAction('Add allowed IP addresses?');
    if (hasClients) {
      const clients = await utils.inputRequired(
        'Allowed IPs (comma-separated):',
        (input) => {
          const ips = input.split(',').map(ip => ip.trim());
          return ips.every(ip => utils.validateIp(ip)) || 
                 'Please enter valid IP addresses';
        }
      );
      data.clients = clients.split(',').map(c => c.trim());
    }
  }
  
  // Denied clients
  if (options.clientsRemoved) {
    data.clients_removed = options.clientsRemoved.split(',').map(c => c.trim());
  } else {
    const hasDeniedClients = await utils.confirmAction('Add denied IP addresses?');
    if (hasDeniedClients) {
      const clients = await utils.inputRequired(
        'Denied IPs (comma-separated):',
        (input) => {
          const ips = input.split(',').map(ip => ip.trim());
          return ips.every(ip => utils.validateIp(ip)) || 
                 'Please enter valid IP addresses';
        }
      );
      data.clients_removed = clients.split(',').map(c => c.trim());
    }
  }
  
  // Basic auth users
  if (options.auth) {
    data.auth = options.auth.split(',').map(user => {
      const [username, password] = user.split(':');
      return { username, password };
    });
  } else {
    const hasAuth = await utils.confirmAction('Add basic authentication users?');
    if (hasAuth) {
      data.auth = [];
      let addMore = true;
      
      while (addMore) {
        const username = await utils.inputRequired('Username:');
        const password = await utils.passwordInput('Password:');
        
        data.auth.push({ username, password });
        
        addMore = await utils.confirmAction('Add another user?');
      }
    }
  }
  
  return data;
}

module.exports = {
  listCommand,
  createCommand,
  updateCommand,
  deleteCommand,
  showCommand
};