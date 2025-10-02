const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner, validateDomain, validatePort, validateIp } = require('../lib/utils');

function hostsCommands(program) {
  const hostsCmd = program
    .command('hosts')
    .description('Proxy hosts management commands');

  // List hosts command
  hostsCmd
    .command('list')
    .alias('ls')
    .description('List all proxy hosts')
    .option('--json', 'Output in JSON format')
    .option('--enabled', 'Show only enabled hosts')
    .option('--disabled', 'Show only disabled hosts')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching proxy hosts...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        let hosts = await api.getProxyHosts();

        spinner.stop();

        // Filter hosts if requested
        if (options.enabled) {
          hosts = hosts.filter(host => host.enabled);
        } else if (options.disabled) {
          hosts = hosts.filter(host => !host.enabled);
        }

        if (hosts.length === 0) {
          warning('No proxy hosts found');
          return;
        }

        if (options.json) {
          console.log(formatOutput(hosts, 'json'));
        } else {
          const formattedHosts = hosts.map(host => ({
            id: host.id,
            domains: host.domain_names.join(', '),
            forward: `${host.forward_scheme}://${host.forward_host}:${host.forward_port}`,
            enabled: host.enabled,
            certificate: host.certificate_id ? 'Yes' : 'No',
            ssl_forced: host.ssl_forced ? 'Yes' : 'No'
          }));
          console.log(formatOutput(formattedHosts));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Get host details command
  hostsCmd
    .command('get <id>')
    .description('Get proxy host details')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Fetching proxy host details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const host = await api.getProxyHost(id);

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(host, 'json'));
        } else {
          console.log(formatOutput(host));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Create host command
  hostsCmd
    .command('create')
    .description('Create a new proxy host')
    .option('-d, --domains <domains>', 'Comma-separated list of domains')
    .option('-h, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port')
    .option('-s, --forward-scheme <scheme>', 'Forward scheme (http/https)', 'http')
    .option('-c, --certificate-id <id>', 'Certificate ID')
    .option('--ssl-forced', 'Force SSL')
    .option('--http2', 'Enable HTTP2')
    .option('--enabled', 'Enable the host', true)
    .option('--advanced <config>', 'Advanced configuration')
    .option('--access-list-id <id>', 'Access list ID')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let {
          domains,
          forwardHost,
          forwardPort,
          forwardScheme,
          certificateId,
          sslForced,
          http2,
          enabled,
          advanced,
          accessListId
        } = options;

        // Prompt for missing required values
        if (!domains) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'domains',
              message: 'Domain names (comma-separated):',
              validate: (input) => {
                if (!input.trim()) return 'At least one domain is required';
                const domainList = input.split(',').map(d => d.trim());
                const invalidDomains = domainList.filter(d => !validateDomain(d));
                if (invalidDomains.length > 0) {
                  return `Invalid domains: ${invalidDomains.join(', ')}`;
                }
                return true;
              }
            }
          ]);
          domains = answers.domains;
        }

        if (!forwardHost) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'forwardHost',
              message: 'Forward host:',
              validate: (input) => {
                if (!input.trim()) return 'Forward host is required';
                if (!validateDomain(input) && !validateIp(input)) {
                  return 'Please enter a valid domain or IP address';
                }
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
              default: '80',
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

        // Parse domains
        const domainList = domains.split(',').map(d => d.trim());

        // Prepare data
        const hostData = {
          domain_names: domainList,
          forward_host: forwardHost,
          forward_port: parseInt(forwardPort),
          forward_scheme: forwardScheme || 'http',
          enabled: enabled !== false,
          certificate_id: certificateId || 0,
          ssl_forced: sslForced || false,
          http2_support: http2 || false,
          advanced_config: advanced || '',
          access_list_id: accessListId || 0,
          locations: [],
          meta: {
            letsencrypt_agree: false,
            dns_challenge: false
          }
        };

        const spinner = createSpinner('Creating proxy host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.createProxyHost(hostData);

        spinner.stop();

        success('Proxy host created successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Update host command
  hostsCmd
    .command('update <id>')
    .description('Update a proxy host')
    .option('-d, --domains <domains>', 'Comma-separated list of domains')
    .option('-h, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port')
    .option('-s, --forward-scheme <scheme>', 'Forward scheme (http/https)')
    .option('-c, --certificate-id <id>', 'Certificate ID')
    .option('--ssl-forced', 'Force SSL')
    .option('--no-ssl-forced', 'Disable SSL forced')
    .option('--http2', 'Enable HTTP2')
    .option('--no-http2', 'Disable HTTP2')
    .option('--enabled', 'Enable the host')
    .option('--disabled', 'Disable the host')
    .option('--advanced <config>', 'Advanced configuration')
    .option('--access-list-id <id>', 'Access list ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        // Get current host details
        const spinner = createSpinner('Fetching current host details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentHost = await api.getProxyHost(id);

        spinner.stop();

        // Merge updates with current data
        const updateData = {
          domain_names: options.domains ? options.domains.split(',').map(d => d.trim()) : currentHost.domain_names,
          forward_host: options.forwardHost || currentHost.forward_host,
          forward_port: options.forwardPort ? parseInt(options.forwardPort) : currentHost.forward_port,
          forward_scheme: options.forwardScheme || currentHost.forward_scheme,
          enabled: options.disabled ? false : (options.enabled !== undefined ? options.enabled : currentHost.enabled),
          certificate_id: options.certificateId !== undefined ? parseInt(options.certificateId) : currentHost.certificate_id,
          ssl_forced: options.sslForced !== undefined ? options.sslForced : currentHost.ssl_forced,
          http2_support: options.http2 !== undefined ? options.http2 : currentHost.http2_support,
          advanced_config: options.advanced !== undefined ? options.advanced : currentHost.advanced_config,
          access_list_id: options.accessListId !== undefined ? parseInt(options.accessListId) : currentHost.access_list_id,
          locations: currentHost.locations,
          meta: currentHost.meta
        };

        const updateSpinner = createSpinner('Updating proxy host...');
        updateSpinner.start();

        const result = await api.updateProxyHost(id, updateData);

        updateSpinner.stop();

        success('Proxy host updated successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Delete host command
  hostsCmd
    .command('delete <id>')
    .description('Delete a proxy host')
    .option('-f, --force', 'Force deletion without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete proxy host ${id}?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Deletion cancelled');
            return;
          }
        }

        const spinner = createSpinner('Deleting proxy host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.deleteProxyHost(id);

        spinner.stop();

        success(`Proxy host ${id} deleted successfully!`);

        if (options.json) {
          console.log(formatOutput({ message: 'Proxy host deleted successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Enable host command
  hostsCmd
    .command('enable <id>')
    .description('Enable a proxy host')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Enabling proxy host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentHost = await api.getProxyHost(id);
        
        const updateData = {
          ...currentHost,
          enabled: true
        };

        const result = await api.updateProxyHost(id, updateData);

        spinner.stop();

        success(`Proxy host ${id} enabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Disable host command
  hostsCmd
    .command('disable <id>')
    .description('Disable a proxy host')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Disabling proxy host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentHost = await api.getProxyHost(id);
        
        const updateData = {
          ...currentHost,
          enabled: false
        };

        const result = await api.updateProxyHost(id, updateData);

        spinner.stop();

        success(`Proxy host ${id} disabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return hostsCmd;
}

module.exports = hostsCommands;