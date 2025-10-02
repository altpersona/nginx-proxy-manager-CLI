const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner, validateDomain } = require('../lib/utils');

function redirectionCommands(program) {
  const redirectCmd = program
    .command('redirection')
    .alias('redirect')
    .description('Redirection host management commands');

  // List redirection hosts command
  redirectCmd
    .command('list')
    .alias('ls')
    .description('List all redirection hosts')
    .option('--json', 'Output in JSON format')
    .option('--enabled', 'Show only enabled redirections')
    .option('--disabled', 'Show only disabled redirections')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching redirection hosts...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        let redirections = await api.getRedirectionHosts();

        spinner.stop();

        // Filter redirections if requested
        if (options.enabled) {
          redirections = redirections.filter(redir => redir.enabled);
        } else if (options.disabled) {
          redirections = redirections.filter(redir => !redir.enabled);
        }

        if (redirections.length === 0) {
          warning('No redirection hosts found');
          return;
        }

        if (options.json) {
          console.log(formatOutput(redirections, 'json'));
        } else {
          const formattedRedirections = redirections.map(redir => ({
            id: redir.id,
            domains: redir.domain_names.join(', '),
            destination: redir.forward_scheme + '://' + redir.forward_domain_name,
            type: redir.type,
            enabled: redir.enabled,
            code: redir.http_redirect_code || 'N/A'
          }));
          console.log(formatOutput(formattedRedirections));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Get redirection host details command
  redirectCmd
    .command('get <id>')
    .description('Get redirection host details')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Fetching redirection host details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const redirection = await api.getRedirectionHost(id);

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(redirection, 'json'));
        } else {
          console.log(formatOutput(redirection));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Create redirection host command
  redirectCmd
    .command('create')
    .description('Create a new redirection host')
    .option('-d, --domains <domains>', 'Comma-separated list of domains')
    .option('--destination <destination>', 'Destination URL')
    .option('-t, --type <type>', 'Redirection type (permanent, temporary, proxy)', 'permanent')
    .option('-c, --code <code>', 'HTTP redirect code (301, 302, 307, 308)', '301')
    .option('--enabled', 'Enable the redirection', true)
    .option('--advanced <config>', 'Advanced configuration')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let {
          domains,
          destination,
          type,
          code,
          enabled,
          advanced
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

        if (!destination) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'destination',
              message: 'Destination URL (e.g., https://example.com):',
              validate: (input) => {
                if (!input.trim()) return 'Destination URL is required';
                if (!input.startsWith('http://') && !input.startsWith('https://')) {
                  return 'Destination must start with http:// or https://';
                }
                return true;
              }
            }
          ]);
          destination = answers.destination;
        }

        if (!type) {
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'type',
              message: 'Redirection type:',
              choices: [
                { name: 'Permanent (301)', value: 'permanent' },
                { name: 'Temporary (302)', value: 'temporary' },
                { name: 'Proxy', value: 'proxy' }
              ],
              default: 'permanent'
            }
          ]);
          type = answers.type;
        }

        // Parse domains
        const domainList = domains.split(',').map(d => d.trim());

        // Parse destination URL
        let forwardScheme, forwardDomainName;
        try {
          const url = new URL(destination);
          forwardScheme = url.protocol.replace(':', '');
          forwardDomainName = url.hostname + url.pathname;
        } catch (error) {
          throw new Error('Invalid destination URL format');
        }

        // Determine redirect code based on type
        let httpRedirectCode = null;
        if (type === 'permanent') {
          httpRedirectCode = parseInt(code) || 301;
        } else if (type === 'temporary') {
          httpRedirectCode = parseInt(code) || 302;
        }

        // Prepare data
        const redirectionData = {
          domain_names: domainList,
          forward_scheme: forwardScheme,
          forward_domain_name: forwardDomainName,
          type: type,
          http_redirect_code: httpRedirectCode,
          enabled: enabled !== false,
          advanced_config: advanced || ''
        };

        const spinner = createSpinner('Creating redirection host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.createRedirectionHost(redirectionData);

        spinner.stop();

        success('Redirection host created successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Update redirection host command
  redirectCmd
    .command('update <id>')
    .description('Update a redirection host')
    .option('-d, --domains <domains>', 'Comma-separated list of domains')
    .option('--destination <destination>', 'Destination URL')
    .option('-t, --type <type>', 'Redirection type (permanent, temporary, proxy)')
    .option('-c, --code <code>', 'HTTP redirect code (301, 302, 307, 308)')
    .option('--enabled', 'Enable the redirection')
    .option('--disabled', 'Disable the redirection')
    .option('--advanced <config>', 'Advanced configuration')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        // Get current redirection details
        const spinner = createSpinner('Fetching current redirection details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentRedirection = await api.getRedirectionHost(id);

        spinner.stop();

        // Merge updates with current data
        const updateData = {
          domain_names: options.domains ? options.domains.split(',').map(d => d.trim()) : currentRedirection.domain_names,
          forward_scheme: currentRedirection.forward_scheme,
          forward_domain_name: currentRedirection.forward_domain_name,
          type: options.type || currentRedirection.type,
          http_redirect_code: options.code ? parseInt(options.code) : currentRedirection.http_redirect_code,
          enabled: options.disabled ? false : (options.enabled !== undefined ? options.enabled : currentRedirection.enabled),
          advanced_config: options.advanced !== undefined ? options.advanced : currentRedirection.advanced_config
        };

        // Update destination if provided
        if (options.destination) {
          try {
            const url = new URL(options.destination);
            updateData.forward_scheme = url.protocol.replace(':', '');
            updateData.forward_domain_name = url.hostname + url.pathname;
          } catch (error) {
            throw new Error('Invalid destination URL format');
          }
        }

        // Update redirect code based on type if type changed
        if (options.type) {
          if (options.type === 'permanent') {
            updateData.http_redirect_code = parseInt(options.code) || 301;
          } else if (options.type === 'temporary') {
            updateData.http_redirect_code = parseInt(options.code) || 302;
          } else if (options.type === 'proxy') {
            updateData.http_redirect_code = null;
          }
        }

        const updateSpinner = createSpinner('Updating redirection host...');
        updateSpinner.start();

        const result = await api.updateRedirectionHost(id, updateData);

        updateSpinner.stop();

        success('Redirection host updated successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Delete redirection host command
  redirectCmd
    .command('delete <id>')
    .description('Delete a redirection host')
    .option('-f, --force', 'Force deletion without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete redirection host ${id}?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Deletion cancelled');
            return;
          }
        }

        const spinner = createSpinner('Deleting redirection host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.deleteRedirectionHost(id);

        spinner.stop();

        success(`Redirection host ${id} deleted successfully!`);

        if (options.json) {
          console.log(formatOutput({ message: 'Redirection host deleted successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Enable redirection command
  redirectCmd
    .command('enable <id>')
    .description('Enable a redirection host')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Enabling redirection host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentRedirection = await api.getRedirectionHost(id);
        
        const updateData = {
          ...currentRedirection,
          enabled: true
        };

        const result = await api.updateRedirectionHost(id, updateData);

        spinner.stop();

        success(`Redirection host ${id} enabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Disable redirection command
  redirectCmd
    .command('disable <id>')
    .description('Disable a redirection host')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Disabling redirection host...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const currentRedirection = await api.getRedirectionHost(id);
        
        const updateData = {
          ...currentRedirection,
          enabled: false
        };

        const result = await api.updateRedirectionHost(id, updateData);

        spinner.stop();

        success(`Redirection host ${id} disabled successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Test redirection command
  redirectCmd
    .command('test <id>')
    .description('Test redirection configuration')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Testing redirection...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const redirection = await api.getRedirectionHost(id);

        spinner.stop();

        // Test configuration
        const testResult = {
          id: redirection.id,
          domains: redirection.domain_names,
          destination: `${redirection.forward_scheme}://${redirection.forward_domain_name}`,
          type: redirection.type,
          code: redirection.http_redirect_code,
          enabled: redirection.enabled,
          status: redirection.enabled ? 'Active' : 'Disabled',
          test_status: 'Configuration valid'
        };

        // Check for common issues
        const issues = [];
        
        if (!redirection.enabled) {
          issues.push('Redirection is disabled');
        }

        if (redirection.domain_names.length === 0) {
          issues.push('No domain names configured');
        }

        if (!redirection.forward_domain_name) {
          issues.push('No destination configured');
        }

        if (redirection.type === 'permanent' && redirection.http_redirect_code !== 301) {
          issues.push('Permanent redirection should use 301 status code');
        }

        if (redirection.type === 'temporary' && ![302, 307, 308].includes(redirection.http_redirect_code)) {
          issues.push('Temporary redirection should use 302, 307, or 308 status code');
        }

        testResult.issues = issues;
        testResult.status = issues.length === 0 ? 'Valid' : 'Issues found';

        if (options.json) {
          console.log(formatOutput(testResult, 'json'));
        } else {
          console.log(formatOutput(testResult));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return redirectCmd;
}

module.exports = redirectionCommands;