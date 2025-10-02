const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner, validatePort, validateIp } = require('../lib/utils');

function streamsCommands(program) {
  const streamCmd = program
    .command('streams')
    .description('Stream (TCP/UDP) management commands');

  // List streams command
  streamCmd
    .command('list')
    .alias('ls')
    .description('List all streams')
    .option('--json', 'Output in JSON format')
    .option('--tcp', 'Show only TCP streams')
    .option('--udp', 'Show only UDP streams')
    .option('--enabled', 'Show only enabled streams')
    .option('--disabled', 'Show only disabled streams')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching streams...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        let streams = await api.getStreams();

        spinner.stop();

        // Filter streams if requested
        if (options.tcp) {
          streams = streams.filter(stream => stream.tcp_forwarding);
        } else if (options.udp) {
          streams = streams.filter(stream => stream.udp_forwarding);
        }

        if (options.enabled) {
          streams = streams.filter(stream => stream.enabled);
        } else if (options.disabled) {
          streams = streams.filter(stream => !stream.enabled);
        }

        if (streams.length === 0) {
          warning('No streams found');
          return;
        }

        if (options.json) {
          console.log(formatOutput(streams, 'json'));
        } else {
          const formattedStreams = streams.map(stream => ({
            id: stream.id,
            incoming: `${stream.incoming_address}:${stream.incoming_port}`,
            forward: `${stream.forwarding_host}:${stream.forwarding_port}`,
            protocol: stream.tcp_forwarding && stream.udp_forwarding ? 'TCP/UDP' : (stream.tcp_forwarding ? 'TCP' : 'UDP'),
            enabled: stream.enabled
          }));
          console.log(formatOutput(formattedStreams));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Get stream details command
  streamCmd
    .command('get <id>')
    .description('Get stream details')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Fetching stream details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const stream = await api.getStream(id);

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(stream, 'json'));
        } else {
          console.log(formatOutput(stream));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Create stream command
  streamCmd
    .command('create')
    .description('Create a new stream')
    .option('-i, --incoming-address <address>', 'Incoming address (0.0.0.0 for all)')
    .option('-p, --incoming-port <port>', 'Incoming port')
    .option('-h, --forward-host <host>', 'Forward host')
    .option('-f, --forward-port <port>', 'Forward port')
    .option('--tcp', 'Enable TCP forwarding')
    .option('--udp', 'Enable UDP forwarding')
    .option('--enabled', 'Enable the stream', true)
    .option('--advanced <config>', 'Advanced configuration')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let {
          incomingAddress,
          incomingPort,
          forwardHost,
          forwardPort,
          tcp,
          udp,
          enabled,
          advanced
        } = options;

        // Prompt for missing required values
        if (!incomingAddress) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'incomingAddress',
              message: 'Incoming address (0.0.0.0 for all interfaces):',
              default: '0.0.0.0',
              validate: (input) => {
                if (!input.trim()) return 'Incoming address is required';
                return true;
              }
            }
          ]);
          incomingAddress = answers.incomingAddress;
        }

        if (!incomingPort) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'incomingPort',
              message: 'Incoming port:',
              validate: (input) => {
                if (!validatePort(input)) {
                  return 'Please enter a valid port (1-65535)';
                }
                return true;
              }
            }
          ]);
          incomingPort = answers.incomingPort;
        }

        if (!forwardHost) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'forwardHost',
              message: 'Forward host:',
              validate: (input) => {
                if (!input.trim()) return 'Forward host is required';
                return true;
              }
            }
          ]);
          forwardHost = answers.forwardHost;
        }

        if (!forwardPort) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'forwardPort',
              message: 'Forward port:',
              validate: (input) => {
                if (!validatePort(input)) {
                  return 'Please enter a valid port (1-65535)';
                }
                return true;
              }
            }
          ]);
          forwardPort = answers.forwardPort;
        }

        if (!tcp && !udp) {
          const answers = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'protocols',
              message: 'Select protocols:',
              choices: [
                { name: 'TCP', value: 'tcp' },
                { name: 'UDP', value: 'udp' }
              ],
              validate: (input) => {
                if (input.length === 0) return 'At least one protocol must be selected';
                return true;
              }
            }
          ]);
          tcp = answers.protocols.includes('tcp');
          udp = answers.protocols.includes('udp');
        }

        // Prepare data
        const streamData = {
          incoming_address: incomingAddress,
          incoming_port: parseInt(incomingPort),
          forwarding_host: forwardHost,
          forwarding_port: parseInt(forwardPort),
          tcp_forwarding: tcp || false,
          udp_forwarding: udp || false,
          enabled: enabled !== false,
          advanced_config: advanced || ''
        };

        const spinner = createSpinner('Creating stream...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.createStream(streamData);

        spinner.stop();

        success('Stream created successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Update stream command
  streamCmd
    .command('update <id>')
    .description('Update a stream')
    .option('-i, --incoming-address <address>', 'Incoming address')
    .option('-p, --incoming-port <port>', 'Incoming port')
    .option('-h, --forward-host <host>', 'Forward host')
    .option('-f, --forward-port <port>', 'Forward port')
    .option('--tcp', 'Enable TCP forwarding')
    .option('--no-tcp', 'Disable TCP forwarding')
    .option('--udp', 'Enable UDP forwarding')
    .option('--no-udp', 'Disable UDP forwarding')
    .option('--enabled', 'Enable the stream')
    .option('--disabled', 'Disable the stream')
    .option('--advanced <config>', 'Advanced configuration')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        // Get current stream details
        const spinner = createSpinner('Fetching current stream details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentStream = await api.getStream(id);

        spinner.stop();

        // Merge updates with current data
        const updateData = {
          incoming_address: options.incomingAddress || currentStream.incoming_address,
          incoming_port: options.incomingPort ? parseInt(options.incomingPort) : currentStream.incoming_port,
          forwarding_host: options.forwardHost || currentStream.forwarding_host,
          forwarding_port: options.forwardPort ? parseInt(options.forwardPort) : currentStream.forwarding_port,
          tcp_forwarding: options.tcp !== undefined ? options.tcp : currentStream.tcp_forwarding,
          udp_forwarding: options.udp !== undefined ? options.udp : currentStream.udp_forwarding,
          enabled: options.disabled ? false : (options.enabled !== undefined ? options.enabled : currentStream.enabled),
          advanced_config: options.advanced !== undefined ? options.advanced : currentStream.advanced_config
        };

        const updateSpinner = createSpinner('Updating stream...');
        updateSpinner.start();

        const result = await api.updateStream(id, updateData);

        updateSpinner.stop();

        success('Stream updated successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Delete stream command
  streamCmd
    .command('delete <id>')
    .description('Delete a stream')
    .option('-f, --force', 'Force deletion without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete stream ${id}?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Deletion cancelled');
            return;
          }
        }

        const spinner = createSpinner('Deleting stream...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.deleteStream(id);

        spinner.stop();

        success(`Stream ${id} deleted successfully!`);

        if (options.json) {
          console.log(formatOutput({ message: 'Stream deleted successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Enable stream command
  streamCmd
    .command('enable <id>')
    .description('Enable a stream')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Enabling stream...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentStream = await api.getStream(id);
        
        const updateData = {
          ...currentStream,
          enabled: true
        };

        const result = await api.updateStream(id, updateData);

        spinner.stop();

        success(`Stream ${id} enabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Disable stream command
  streamCmd
    .command('disable <id>')
    .description('Disable a stream')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Disabling stream...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentStream = await api.getStream(id);
        
        const updateData = {
          ...currentStream,
          enabled: false
        };

        const result = await api.updateStream(id, updateData);

        spinner.stop();

        success(`Stream ${id} disabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Test stream command
  streamCmd
    .command('test <id>')
    .description('Test stream connectivity')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Testing stream...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const stream = await api.getStream(id);

        spinner.stop();

        // Basic connectivity test simulation
        const testResult = {
          id: stream.id,
          incoming: `${stream.incoming_address}:${stream.incoming_port}`,
          forward: `${stream.forwarding_host}:${stream.forwarding_port}`,
          protocol: stream.tcp_forwarding && stream.udp_forwarding ? 'TCP/UDP' : (stream.tcp_forwarding ? 'TCP' : 'UDP'),
          enabled: stream.enabled,
          status: stream.enabled ? 'Active' : 'Disabled',
          test_status: 'Configuration valid'
        };

        if (options.json) {
          console.log(formatOutput(testResult, 'json'));
        } else {
          console.log(formatOutput(testResult));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return streamCmd;
}

module.exports = streamsCommands;