const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all redirection hosts')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .option('--enabled-only', 'Show only enabled redirections')
    .option('--disabled-only', 'Show only disabled redirections')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const redirections = await api.getRedirections(params);
        
        let filteredRedirections = redirections;
        
        if (options.enabledOnly) {
          filteredRedirections = redirections.filter(redir => redir.enabled);
        } else if (options.disabledOnly) {
          filteredRedirections = redirections.filter(redir => !redir.enabled);
        }
        
        if (filteredRedirections.length === 0) {
          utils.info('No redirection hosts found');
          return;
        }
        
        utils.formatOutput(filteredRedirections);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function createCommand() {
  const cmd = new Command('create');
  cmd.alias('add')
    .description('Create a new redirection host')
    .option('-d, --domain-names <domains>', 'Domain names (comma-separated)')
    .option('-r, --redirect-to <url>', 'Redirect to URL')
    .option('-c, --code <code>', 'Redirect code (301, 302, 307, 308)', '302')
    .option('-s, --ssl-forced', 'Force SSL')
    .option('--cert-id <id>', 'Certificate ID', parseInt)
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .option('--block-exploits', 'Enable exploit blocking')
    .option('--caching-enabled', 'Enable caching')
    .option('--allow-websocket-upgrade', 'Allow WebSocket upgrade')
    .option('--http2-support', 'Enable HTTP/2 support')
    .option('--hsts-enabled', 'Enable HSTS')
    .option('--hsts-subdomains', 'Include subdomains in HSTS')
    .option('--enabled', 'Enable redirection immediately', true)
    .action(async (options) => {
      try {
        let data = {};
        
        // Interactive mode if not all required options provided
        if (!options.domainNames || !options.redirectTo) {
          data = await collectRedirectionData(options);
        } else {
          data = {
            domain_names: utils.parseDomainList(options.domainNames),
            forward_scheme: '',
            forward_domain_name: '',
            forward_http_code: parseInt(options.code) || 302,
            ssl_forced: options.sslForced || false,
            certificate_id: options.certId || 0,
            access_list_id: options.accessListId || 0,
            block_exploits: options.blockExploits || false,
            caching_enabled: options.cachingEnabled || false,
            allow_websocket_upgrade: options.allowWebsocketUpgrade || false,
            http2_support: options.http2Support || false,
            hsts_enabled: options.hstsEnabled || false,
            hsts_subdomains: options.hstsSubdomains || false,
            enabled: options.enabled !== false,
            meta: {
              redirect_to_url: options.redirectTo
            },
            locations: []
          };
        }
        
        const spinner = utils.showSpinner('Creating redirection host...');
        
        try {
          const redirection = await api.createRedirection(data);
          spinner.succeed('Redirection host created successfully!');
          
          utils.success(`Redirection ID: ${redirection.id}`);
          utils.info(`Domains: ${redirection.domain_names.join(', ')}`);
          utils.info(`Redirect to: ${redirection.meta.redirect_to_url}`);
          utils.info(`Code: ${redirection.forward_http_code}`);
          utils.info(`Status: ${utils.formatStatus(redirection.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to create redirection host');
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
    .description('Update an existing redirection host')
    .argument('<id>', 'Redirection ID', parseInt)
    .option('-d, --domain-names <domains>', 'Domain names (comma-separated)')
    .option('-r, --redirect-to <url>', 'Redirect to URL')
    .option('-c, --code <code>', 'Redirect code (301, 302, 307, 308)')
    .option('-s, --ssl-forced', 'Force SSL')
    .option('--cert-id <id>', 'Certificate ID', parseInt)
    .option('-a, --access-list-id <id>', 'Access list ID', parseInt)
    .option('--block-exploits', 'Enable exploit blocking')
    .option('--caching-enabled', 'Enable caching')
    .option('--allow-websocket-upgrade', 'Allow WebSocket upgrade')
    .option('--http2-support', 'Enable HTTP/2 support')
    .option('--hsts-enabled', 'Enable HSTS')
    .option('--hsts-subdomains', 'Include subdomains in HSTS')
    .action(async (id, options) => {
      try {
        // Get current redirection data
        const currentRedirection = await api.getRedirection(id);
        
        // Merge with options
        const data = {
          ...currentRedirection,
          meta: { ...currentRedirection.meta }
        };
        
        if (options.domainNames) {
          data.domain_names = utils.parseDomainList(options.domainNames);
        }
        
        if (options.redirectTo) {
          data.meta.redirect_to_url = options.redirectTo;
        }
        
        if (options.code) {
          data.forward_http_code = parseInt(options.code);
        }
        
        if (options.sslForced !== undefined) {
          data.ssl_forced = options.sslForced;
        }
        
        if (options.certId) {
          data.certificate_id = options.certId;
        }
        
        if (options.accessListId) {
          data.access_list_id = options.accessListId;
        }
        
        if (options.blockExploits !== undefined) {
          data.block_exploits = options.blockExploits;
        }
        
        if (options.cachingEnabled !== undefined) {
          data.caching_enabled = options.cachingEnabled;
        }
        
        if (options.allowWebsocketUpgrade !== undefined) {
          data.allow_websocket_upgrade = options.allowWebsocketUpgrade;
        }
        
        if (options.http2Support !== undefined) {
          data.http2_support = options.http2Support;
        }
        
        if (options.hstsEnabled !== undefined) {
          data.hsts_enabled = options.hstsEnabled;
        }
        
        if (options.hstsSubdomains !== undefined) {
          data.hsts_subdomains = options.hstsSubdomains;
        }
        
        const spinner = utils.showSpinner('Updating redirection host...');
        
        try {
          const redirection = await api.updateRedirection(id, data);
          spinner.succeed('Redirection host updated successfully!');
          
          utils.success(`Redirection ID: ${redirection.id}`);
          utils.info(`Domains: ${redirection.domain_names.join(', ')}`);
          utils.info(`Redirect to: ${redirection.meta.redirect_to_url}`);
          utils.info(`Code: ${redirection.forward_http_code}`);
          utils.info(`Status: ${utils.formatStatus(redirection.enabled)}`);
          
        } catch (error) {
          spinner.fail('Failed to update redirection host');
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
    .description('Delete a redirection host')
    .argument('<id>', 'Redirection ID', parseInt)
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (id, options) => {
      try {
        // Get redirection info first
        const redirection = await api.getRedirection(id);
        
        if (!options.force) {
          const confirmed = await utils.confirmAction(
            `Are you sure you want to delete redirection "${redirection.domain_names.join(', ')}"?`
          );
          
          if (!confirmed) {
            utils.info('Deletion cancelled');
            return;
          }
        }
        
        const spinner = utils.showSpinner('Deleting redirection host...');
        
        try {
          await api.deleteRedirection(id);
          spinner.succeed('Redirection host deleted successfully!');
          
        } catch (error) {
          spinner.fail('Failed to delete redirection host');
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
  cmd.description('Enable a redirection host')
    .argument('<id>', 'Redirection ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Enabling redirection host...');
        
        try {
          await api.enableRedirection(id);
          spinner.succeed('Redirection host enabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to enable redirection host');
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
  cmd.description('Disable a redirection host')
    .argument('<id>', 'Redirection ID', parseInt)
    .action(async (id) => {
      try {
        const spinner = utils.showSpinner('Disabling redirection host...');
        
        try {
          await api.disableRedirection(id);
          spinner.succeed('Redirection host disabled successfully!');
          
        } catch (error) {
          spinner.fail('Failed to disable redirection host');
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
  cmd.description('Show detailed information about a redirection host')
    .argument('<id>', 'Redirection ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const redirection = await api.getRedirection(id, params);
        
        utils.formatOutput(redirection);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

async function collectRedirectionData(options) {
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
  
  // Redirect URL
  if (options.redirectTo) {
    data.meta = { redirect_to_url: options.redirectTo };
  } else {
    const redirectUrl = await utils.inputRequired(
      'Redirect to URL:',
      (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    );
    data.meta = { redirect_to_url: redirectUrl };
  }
  
  // Redirect code
  if (options.code) {
    data.forward_http_code = parseInt(options.code);
  } else {
    const code = await utils.selectFromList(
      'Redirect code:',
      [
        { name: '301 - Permanent Redirect', value: 301 },
        { name: '302 - Temporary Redirect', value: 302 },
        { name: '307 - Temporary Redirect (preserve method)', value: 307 },
        { name: '308 - Permanent Redirect (preserve method)', value: 308 }
      ]
    );
    data.forward_http_code = code;
  }
  
  // SSL settings
  data.ssl_forced = options.sslForced || false;
  data.certificate_id = options.certId || 0;
  
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
  
  // Locations
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