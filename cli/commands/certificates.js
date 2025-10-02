const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all certificates')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .option('--active-only', 'Show only active certificates')
    .option('--expired-only', 'Show only expired certificates')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const certificates = await api.getCertificates(params);
        
        let filteredCerts = certificates;
        
        if (options.activeOnly) {
          filteredCerts = certificates.filter(cert => cert.is_valid);
        } else if (options.expiredOnly) {
          filteredCerts = certificates.filter(cert => !cert.is_valid);
        }
        
        if (filteredCerts.length === 0) {
          utils.info('No certificates found');
          return;
        }
        
        utils.formatOutput(filteredCerts);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function createCommand() {
  const cmd = new Command('create');
  cmd.alias('add')
    .description('Create a new certificate')
    .option('-n, --name <name>', 'Certificate name')
    .option('-d, --domain-names <domains>', 'Domain names (comma-separated)')
    .option('-t, --type <type>', 'Certificate type (letsencrypt, custom)', 'letsencrypt')
    .option('--letsencrypt-email <email>', 'Let\'s Encrypt email')
    .option('--letsencrypt-staging', 'Use Let\'s Encrypt staging')
    .option('--cert-file <path>', 'Custom certificate file path')
    .option('--key-file <path>', 'Custom private key file path')
    .option('--ca-file <path>', 'Custom CA certificate file path')
    .option('--meta <json>', 'Additional metadata as JSON')
    .action(async (options) => {
      try {
        let data = {};
        
        // Interactive mode if not all required options provided
        if (!options.name || !options.domainNames) {
          data = await collectCertificateData(options);
        } else {
          data = {
            nice_name: options.name,
            domain_names: utils.parseDomainList(options.domainNames),
            meta: {}
          };
          
          // Handle different certificate types
          if (options.type === 'letsencrypt') {
            data.provider = 'letsencrypt';
            if (options.letsencryptEmail) {
              data.meta.letsencrypt_email = options.letsencryptEmail;
            }
            if (options.letsencryptStaging) {
              data.meta.letsencrypt_staging = true;
            }
          } else if (options.type === 'custom') {
            data.provider = 'other';
            if (options.certFile) {
              data.certificate = require('fs').readFileSync(options.certFile, 'utf8');
            }
            if (options.keyFile) {
              data.certificate_key = require('fs').readFileSync(options.keyFile, 'utf8');
            }
            if (options.caFile) {
              data.certificate_ca = require('fs').readFileSync(options.caFile, 'utf8');
            }
          }
          
          if (options.meta) {
            try {
              const meta = JSON.parse(options.meta);
              data.meta = { ...data.meta, ...meta };
            } catch (e) {
              throw new Error('Invalid JSON for --meta option');
            }
          }
        }
        
        const spinner = utils.showSpinner('Creating certificate...');
        
        try {
          const certificate = await api.createCertificate(data);
          spinner.succeed('Certificate created successfully!');
          
          utils.success(`Certificate ID: ${certificate.id}`);
          utils.info(`Name: ${certificate.nice_name}`);
          utils.info(`Domains: ${certificate.domain_names.join(', ')}`);
          utils.info(`Provider: ${certificate.provider}`);
          utils.info(`Status: ${certificate.is_valid ? chalk.green('Valid') : chalk.red('Invalid')}`);
          
          if (certificate.provider === 'letsencrypt') {
            utils.info('The certificate will be automatically provisioned by Let\'s Encrypt');
          }
          
        } catch (error) {
          spinner.fail('Failed to create certificate');
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
    .description('Delete a certificate')
    .argument('<id>', 'Certificate ID', parseInt)
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (id, options) => {
      try {
        // Get certificate info first
        const certificate = await api.getCertificate(id);
        
        if (!options.force) {
          const confirmed = await utils.confirmAction(
            `Are you sure you want to delete certificate "${certificate.nice_name}" (${certificate.domain_names.join(', ')})?`
          );
          
          if (!confirmed) {
            utils.info('Deletion cancelled');
            return;
          }
        }
        
        const spinner = utils.showSpinner('Deleting certificate...');
        
        try {
          await api.deleteCertificate(id);
          spinner.succeed('Certificate deleted successfully!');
          
        } catch (error) {
          spinner.fail('Failed to delete certificate');
          throw error;
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function renewCommand() {
  const cmd = new Command('renew');
  cmd.description('Renew a Let\'s Encrypt certificate')
    .argument('<id>', 'Certificate ID', parseInt)
    .action(async (id) => {
      try {
        const certificate = await api.getCertificate(id);
        
        if (certificate.provider !== 'letsencrypt') {
          throw new Error('Only Let\'s Encrypt certificates can be renewed');
        }
        
        const spinner = utils.showSpinner('Renewing certificate...');
        
        try {
          await api.renewCertificate(id);
          spinner.succeed('Certificate renewed successfully!');
          
          utils.success(`Certificate ID: ${certificate.id}`);
          utils.info(`Name: ${certificate.nice_name}`);
          utils.info('The certificate has been queued for renewal');
          
        } catch (error) {
          spinner.fail('Failed to renew certificate');
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
  cmd.description('Show detailed information about a certificate')
    .argument('<id>', 'Certificate ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const certificate = await api.getCertificate(id, params);
        
        utils.formatOutput(certificate);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

async function collectCertificateData(options) {
  const data = {};
  
  // Certificate name
  if (options.name) {
    data.nice_name = options.name;
  } else {
    data.nice_name = await utils.inputRequired('Certificate name:');
  }
  
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
  
  // Certificate type
  const certType = options.type || await utils.selectFromList(
    'Certificate type:',
    ['letsencrypt', 'custom']
  );
  
  data.meta = {};
  
  if (certType === 'letsencrypt') {
    data.provider = 'letsencrypt';
    
    // Let's Encrypt email
    if (options.letsencryptEmail) {
      data.meta.letsencrypt_email = options.letsencryptEmail;
    } else {
      const email = await utils.inputRequired(
        'Let\'s Encrypt email:',
        utils.validateEmail
      );
      data.meta.letsencrypt_email = email;
    }
    
    // Staging environment
    if (options.letsencryptStaging) {
      data.meta.letsencrypt_staging = true;
    } else {
      const useStaging = await utils.confirmAction('Use Let\'s Encrypt staging environment?');
      if (useStaging) {
        data.meta.letsencrypt_staging = true;
      }
    }
    
  } else if (certType === 'custom') {
    data.provider = 'other';
    
    // Certificate files
    const fs = require('fs');
    
    if (options.certFile) {
      data.certificate = fs.readFileSync(options.certFile, 'utf8');
    } else {
      const certPath = await utils.inputRequired(
        'Certificate file path:',
        (input) => fs.existsSync(input) || 'File not found'
      );
      data.certificate = fs.readFileSync(certPath, 'utf8');
    }
    
    if (options.keyFile) {
      data.certificate_key = fs.readFileSync(options.keyFile, 'utf8');
    } else {
      const keyPath = await utils.inputRequired(
        'Private key file path:',
        (input) => fs.existsSync(input) || 'File not found'
      );
      data.certificate_key = fs.readFileSync(keyPath, 'utf8');
    }
    
    // Optional CA certificate
    const hasCaCert = await utils.confirmAction('Include CA certificate?');
    if (hasCaCert) {
      if (options.caFile) {
        data.certificate_ca = fs.readFileSync(options.caFile, 'utf8');
      } else {
        const caPath = await utils.inputRequired(
          'CA certificate file path:',
          (input) => fs.existsSync(input) || 'File not found'
        );
        data.certificate_ca = fs.readFileSync(caPath, 'utf8');
      }
    }
  }
  
  return data;
}

module.exports = {
  listCommand,
  createCommand,
  deleteCommand,
  renewCommand,
  showCommand
};