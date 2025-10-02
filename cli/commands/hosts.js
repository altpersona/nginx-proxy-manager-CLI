const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all proxy hosts')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .option('--enabled-only', 'Show only enabled hosts')
    .option('--disabled-only', 'Show only disabled hosts')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const hosts = await api.getHosts(params);
        
        let filteredHosts = hosts;
        
        if (options.enabledOnly) {
          filteredHosts = hosts.filter(host => host.enabled);
        } else if (options.disabledOnly) {
          filteredHosts = hosts.filter(host => !host.enabled);
        }
        
        if (filteredHosts.length === 0) {
          utils.info('No proxy hosts found');
          return;
        }
        
        utils.formatOutput(filteredHosts);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function createCommand() {
  const cmd = new Command('create');
  cmd.alias('add')
    .description('Create a new proxy host')
    .option('-d, --domain-names <domains>', 'Domain names (comma-separated)')
    .option('-f, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port', parseInt)
    .option('-s, --ssl-forced', 'Force SSL')
    .option('-c, --certificate-id <id>', 'Certificate ID', parseInt)
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .option('--block-exploits', 'Enable exploit blocking')
    .option('--caching-enabled', 'Enable caching')
    .option('--allow-websocket-upgrade', 'Allow WebSocket upgrade')
    .option('--http2-support', 'Enable HTTP/2 support')
    .option('--hsts-enabled', 'Enable HSTS')
    .option('--hsts-subdomains', 'Include subdomains in HSTS')
    .option('--enabled', 'Enable host immediately', true)
    .option('--advanced', 'Show advanced configuration options')
    .action(async (options) => {
      try {
        let data = {};
        
        // Interactive mode if not all required options provided
        if (!options.domainNames || !options.forwardHost || !options.forwardPort) {
          data = await collectHostData(options);
        } else {
          data = {
            domain_names: utils.parseDomainList(options.domainNames),
            forward_host: options.forwardHost,
            forward_port: options.forwardPort,
            ssl_forced: options.sslForced || false,
            certificate_id: options.certificateId || 0,
            access_list_id: options.accessListId || 0,
            block_exploits: options.blockExploits || false,
            caching_enabled: options.cachingEnabled || false,
            allow_websocket_upgrade: options.allowWebsocketUpgrade || false,
            http2_support: options.http2Support || false,
            hsts_enabled: options.hstsEnabled || false,
            hsts_subdomains: options.hstsSubdomains || false,
            enabled: options.enabled !== false,
            meta: {},
            locations: []
          };
        }
        
        const spinner = utils.showSpinner('Creating proxy host...');
        
        try {
          const host = await api.createHost(data);
          spinner.succeed('Proxy host created successfully!');
          
          utils.success(`Host ID: ${host.id}`);
          utils.info(`Domains: ${host.domain_names.join(', ')}`);
          utils.info(`Forward: ${host.forward_host}:${host.forward_port}`);
          utils.info(`Status: ${utils.formatStatus(host.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to create proxy host');
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
    .description('Update an existing proxy host')
    .argument('<id>', 'Host ID', parseInt)
    .option('-d, --domain-names <domains>', 'Domain names (comma-separated)')
    .option('-f, --forward-host <host>', 'Forward host')
    .option('-p, --forward-port <port>', 'Forward port', parseInt)
    .option('-s, --ssl-forced', 'Force SSL')
    .option('-c, --certificate-id <id>', 'Certificate ID', parseInt)
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .option('--block-exploits', 'Enable exploit blocking')
    .option('--caching-enabled', 'Enable caching')
    .option('--allow-websocket-upgrade', 'Allow WebSocket upgrade')
    .option('--http2-support', 'Enable HTTP/2 support')
    .option('--hsts-enabled', 'Enable HSTS')
    .option('--hsts-subdomains', 'Include subdomains in HSTS')
    .option('--advanced', 'Show advanced configuration options')
    .action(async (id, options) => {
      try {
        // Get current host data
        const currentHost = await api.getHost(id);
        
        // Merge with options
        const data = {
          ...currentHost,
          ...(options.domainNames && { domain_names: utils.parseDomainList(options.domainNames) }),
          ...(options.forwardHost && { forward_host: options.forwardHost }),
          ...(options.forwardPort && { forward_port: options.forwardPort }),
          ...(options.sslForced !== undefined && { ssl_forced: options.sslForced }),
          ...(options.certificateId && { certificate_id: options.certificateId }),
          ...(options.accessListId && { access_list_id: options.accessListId }),
          ...(options.blockExploits !== undefined && { block_exploits: options.blockExploits }),
          ...(options.cachingEnabled !== undefined && { caching_enabled: options.cachingEnabled }),
          ...(options.allowWebsocketUpgrade !== undefined && { allow_websocket_upgrade: options.allowWebsocketUpgrade }),
          ...(options.http2Support !== undefined && { http2_support: options.http2Support }),
          ...(options.hstsEnabled !== undefined && { hsts_enabled: options.hstsEnabled }),
          ...(options.hstsSubdomains !== undefined && { hsts_subdomains: options.hstsSubdomains })
        };
        
        const spinner = utils.showSpinner('Updating proxy host...');
        
        try {
          const host = await api.updateHost(id, data);
          spinner.succeed('Proxy host updated successfully!');
          
          utils.success(`Host ID: ${host.id}`);
          utils.info(`Domains: ${host.domain_names.join(', ')}`);
          utils.info(`Forward: ${host.forward_host}:${host.forward_port}`);
          utils.info(`Status: ${utils.formatStatus(host.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to update proxy host');
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
    .description('Delete a proxy host')
    .argument('<id>', 'Host ID', parseInt)
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (id, options) => {
      try {
        // Get host info first
        const host = await api.getHost(id);
        
        if (!options.force) {
          const confirmed = await utils.confirmAction(
            `Are you sure you want to delete proxy host "${host.domain_names.join(', ')}"?`
          );
          
          if (!confirmed) {
            utils.info('Deletion cancelled');
            return;
          }
        }
        
        const spinner = utils.showSpinner('Deleting proxy host...');
        
        try {
          await api.deleteHost(id);
          spinner.succeed('Proxy host deleted successfully!');
          
        } catch (error) {
          spinner.fail('Failed to delete proxy host');
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
  cmd.description('Enable a proxy host')
    .argument('<id>', 'Host ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Enabling proxy host...');
        
        try {
          await api.enableHost(id);
          spinner.succeed('Proxy host enabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to enable proxy host');
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
  cmd.description('Disable a proxy host')
    .argument('<id>', 'Host ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Disabling proxy host...');
        
        try {
          await api.disableHost(id);
          spinner.succeed('Proxy host disabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to disable proxy host');
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
  cmd.description('Show detailed information about a proxy host')
    .argument('<id>', 'Host ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const host = await api.getHost(id, params);
        
        utils.formatOutput(host);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

async function collectHostData(options) {
  const data = {};
  
  // Domain names
  if (options.domainNames) {
    data.domain_names = utils.parseDomainList(options.domainNames);
  } else {
    const domains = await utils.inputRequired(
      'Domain names (comma-separated):',
      (input) => {
        const domains = utils.parseDomainList(input);
        return domains.length > 0 && domains.every(d => utils.validateDomain(d)) || 
               'Please enter valid domain names';
      }
    );
    data.domain_names = utils.parseDomainList(domains);
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
    const port = await utils.inputRequired(
      'Forward port:',
      (input) => utils.validatePort(input) || 'Please enter a valid port number (1-65535)'
    );
    data.forward_port = parseInt(port, 10);
  }
  
  // SSL settings
  data.ssl_forced = options.sslForced || false;
  data.certificate_id = options.certificateId || 0;
  
  // Security settings
  data.block_exploits = options.blockExploits || false;
  data.caching_enabled = options.cachingEnabled || false;
  data.allow_websocket_upgrade = options.allowWebsocketUpgrade || false;
  data.http2_support = options.http2Support || false;
  
  // HSTS settings
  data.hsts_enabled = options.hstsEnabled || false;
  data.hsts_subdomains = options.hstsSubdomains || false;
  
  // Access control
  data.access_list_id = options.accessListId || 0;
  
  // Status
  data.enabled = options.enabled !== false;
  
  // Meta and locations
  data.meta = {};
  data.locations = [];
  
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