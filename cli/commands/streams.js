const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all stream hosts')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .option('--enabled-only', 'Show only enabled streams')
    .option('--disabled-only', 'Show only disabled streams')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const streams = await api.getStreams(params);
        
        let filteredStreams = streams;
        
        if (options.enabledOnly) {
          filteredStreams = streams.filter(stream => stream.enabled);
        } else if (options.disabledOnly) {
          filteredStreams = streams.filter(stream => !stream.enabled);
        }
        
        if (filteredStreams.length === 0) {
          utils.info('No stream hosts found');
          return;
        }
        
        utils.formatOutput(filteredStreams);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function createCommand() {
  const cmd = new Command('create');
  cmd.alias('add')
    .description('Create a new stream host')
    .option('-n, --name <name>', 'Stream name')
    .option('-i, --incoming-port <port>', 'Incoming port', parseInt)
    .option('-f, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port', parseInt)
    .option('-t, --tcp', 'TCP protocol (default)')
    .option('-u, --udp', 'UDP protocol')
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .option('--enabled', 'Enable stream immediately', true)
    .action(async (options) => {
      try {
        let data = {};
        
        // Interactive mode if not all required options provided
        if (!options.name || !options.incomingPort || !options.forwardHost || !options.forwardPort) {
          data = await collectStreamData(options);
        } else {
          data = {
            incoming_port: options.incomingPort,
            forward_host: options.forwardHost,
            forward_port: options.forwardPort,
            tcp_forwarding: !options.udp, // Default to TCP unless UDP specified
            udp_forwarding: options.udp || false,
            access_list_id: options.accessListId || 0,
            enabled: options.enabled !== false,
            meta: {
              nice_name: options.name
            }
          };
        }
        
        const spinner = utils.showSpinner('Creating stream host...');
        
        try {
          const stream = await api.createStream(data);
          spinner.succeed('Stream host created successfully!');
          
          utils.success(`Stream ID: ${stream.id}`);
          utils.info(`Name: ${stream.meta.nice_name || 'N/A'}`);
          utils.info(`Incoming: ${stream.incoming_port}`);
          utils.info(`Forward: ${stream.forward_host}:${stream.forward_port}`);
          utils.info(`Protocol: ${stream.tcp_forwarding ? 'TCP' : 'UDP'}`);
          utils.info(`Status: ${utils.formatStatus(stream.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to create stream host');
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
    .description('Update an existing stream host')
    .argument('<id>', 'Stream ID', parseInt)
    .option('-n, --name <name>', 'Stream name')
    .option('-i, --incoming-port <port>', 'Incoming port', parseInt)
    .option('-f, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port', parseInt)
    .option('-t, --tcp', 'TCP protocol')
    .option('-u, --udp', 'UDP protocol')
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .action(async (id, options) => {
      try {
        // Get current stream data
        const currentStream = await api.getStream(id);
        
        // Merge with options
        const data = {
          ...currentStream,
          meta: { ...currentStream.meta }
        };
        
        if (options.name) {
          data.meta.nice_name = options.name;
        }
        
        if (options.incomingPort) {
          data.incoming_port = options.incomingPort;
        }
        
        if (options.forwardHost) {
          data.forward_host = options.forwardHost;
        }
        
        if (options.forwardPort) {
          data.forward_port = options.forwardPort;
        }
        
        // Handle protocol options
        if (options.tcp) {
          data.tcp_forwarding = true;
          data.udp_forwarding = false;
        } else if (options.udp) {
          data.tcp_forwarding = false;
          data.udp_forwarding = true;
        }
        
        if (options.accessListId) {
          data.access_list_id = options.accessListId;
        }
        
        const spinner = utils.showSpinner('Updating stream host...');
        
        try {
          const stream = await api.updateStream(id, data);
          spinner.succeed('Stream host updated successfully!');
          
          utils.success(`Stream ID: ${stream.id}`);
          utils.info(`Name: ${stream.meta.nice_name || 'N/A'}`);
          utils.info(`Incoming: ${stream.incoming_port}`);
          utils.info(`Forward: ${stream.forward_host}:${stream.forward_port}`);
          utils.info(`Protocol: ${stream.tcp_forwarding ? 'TCP' : 'UDP'}`);
          utils.info(`Status: ${utils.formatStatus(stream.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to update stream host');
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
    .description('Delete a stream host')
    .argument('<id>', 'Stream ID', parseInt)
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (id, options) => {
      try {
        // Get stream info first
        const stream = await api.getStream(id);
        
        if (!options.force) {
          const confirmed = await utils.confirmAction(
            `Are you sure you want to delete stream "${stream.meta.nice_name || id}"?`
          );
          
          if (!confirmed) {
            utils.info('Deletion cancelled');
            return;
          }
        }
        
        const spinner = utils.showSpinner('Deleting stream host...');
        
        try {
          await api.deleteStream(id);
          spinner.succeed('Stream host deleted successfully!');
          
        } catch (error) {
          spinner.fail('Failed to delete stream host');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function enableCommand() {
  const cmd = new Command('enable');
  cmd.description('Enable a stream host')
    .argument('<id>', 'Stream ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Enabling stream host...');
        
        try {
          await api.enableStream(id);
          spinner.succeed('Stream host enabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to enable stream host');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function disableCommand() {
  const cmd = new Command('disable');
  cmd.description('Disable a stream host')
    .argument('<id>', 'Stream ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Disabling stream host...');
        
        try {
          await api.disableStream(id);
          spinner.succeed('Stream host disabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to disable stream host');
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
  cmd.description('Show detailed information about a stream host')
    .argument('<id>', 'Stream ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const stream = await api.getStream(id, params);
        
        utils.formatOutput(stream);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

async function collectStreamData(options) {
  const data = {};
  
  // Name
  if (options.name) {
    data.meta = { nice_name: options.name };
  } else {
    const name = await utils.inputRequired(
      'Stream name (optional):',
      null,
      true // Allow empty
    );
    if (name) {
      data.meta = { nice_name: name };
    } else {
      data.meta = {};
    }
  }
  
  // Incoming port
  if (options.incomingPort) {
    data.incoming_port = options.incomingPort;
  } else {
    const incomingPort = await utils.inputRequired(
      'Incoming port:',
      (input) => utils.validatePort(input) || 'Please enter a valid port number (1-65535)'
    );
    data.incoming_port = parseInt(incomingPort, 10);
  }
  
  // Forward host
  if (options.forwardHost) {
    data.forward_host = options.forwardHost;
  } else {
    data.forward_host = await utils.inputRequired(
      'Forward host:',
      (input) => utils.validateDomain(input) || utils.validateIp(input) || 
               'Please enter a valid hostname or IP address'
    );
  }
  
  // Forward port
  if (options.forwardPort) {
    data.forward_port = options.forwardPort;
  } else {
    const forwardPort = await utils.inputRequired(
      'Forward port:',
      (input) => utils.validatePort(input) || 'Please enter a valid port number (1-65535)'
    );
    data.forward_port = parseInt(forwardPort, 10);
  }
  
  // Protocol
  if (options.tcp || options.udp) {
    data.tcp_forwarding = !options.udp;
    data.udp_forwarding = options.udp || false;
  } else {
    const protocol = await utils.selectFromList(
      'Protocol:',
      ['TCP', 'UDP']
    );
    data.tcp_forwarding = protocol === 'TCP';
    data.udp_forwarding = protocol === 'UDP';
  }
  
  // Access list
  data.access_list_id = options.accessListId || 0;
  
  // Status
  data.enabled = options.enabled !== false;
  
  return data;
}

module.exports = {
  listCommand,
  createCommand,
  updateCommand,
  deleteCommand,
  enableCommand,
  disableCommand,
  showCommand
};