const chalk = require('chalk');
const inquirer = require('inquirer');
const NginxProxyManagerAPI = require('../lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('../lib/utils');

function certificatesCommands(program) {
  const certCmd = program
    .command('certificates')
    .alias('certs')
    .description('SSL certificate management commands');

  // List certificates command
  certCmd
    .command('list')
    .alias('ls')
    .description('List all SSL certificates')
    .option('--json', 'Output in JSON format')
    .option('--expired', 'Show only expired certificates')
    .option('--valid', 'Show only valid certificates')
    .action(async (options) => {
      try {
        const spinner = createSpinner('Fetching certificates...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        let certificates = await api.getCertificates();

        spinner.stop();

        // Filter certificates if requested
        if (options.expired) {
          certificates = certificates.filter(cert => new Date(cert.expires_on) < new Date());
        } else if (options.valid) {
          certificates = certificates.filter(cert => new Date(cert.expires_on) >= new Date());
        }

        if (certificates.length === 0) {
          warning('No certificates found');
          return;
        }

        if (options.json) {
          console.log(formatOutput(certificates, 'json'));
        } else {
          const formattedCerts = certificates.map(cert => ({
            id: cert.id,
            name: cert.nice_name,
            provider: cert.provider,
            domains: cert.domain_names.join(', '),
            expires: new Date(cert.expires_on).toLocaleDateString(),
            status: new Date(cert.expires_on) < new Date() ? 'Expired' : 'Valid'
          }));
          console.log(formatOutput(formattedCerts));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Get certificate details command
  certCmd
    .command('get <id>')
    .description('Get certificate details')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Fetching certificate details...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const certificate = await api.getCertificate(id);

        spinner.stop();

        if (options.json) {
          console.log(formatOutput(certificate, 'json'));
        } else {
          console.log(formatOutput(certificate));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Create certificate command
  certCmd
    .command('create')
    .description('Create a new SSL certificate')
    .option('-n, --name <name>', 'Certificate name')
    .option('-d, --domains <domains>', 'Comma-separated list of domains')
    .option('-p, --provider <provider>', 'Certificate provider (letsencrypt, custom)', 'letsencrypt')
    .option('--letsencrypt-email <email>', 'Let\'s Encrypt email address')
    .option('--dns-provider <provider>', 'DNS provider for DNS challenge')
    .option('--dns-credentials <credentials>', 'DNS provider credentials (JSON format)')
    .option('--agree-tos', 'Agree to Let\'s Encrypt Terms of Service')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        let {
          name,
          domains,
          provider,
          letsencryptEmail,
          dnsProvider,
          dnsCredentials,
          agreeTos
        } = options;

        // Prompt for missing required values
        if (!name) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Certificate name:',
              validate: (input) => {
                if (!input.trim()) return 'Certificate name is required';
                return true;
              }
            }
          ]);
          name = answers.name;
        }

        if (!domains) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'domains',
              message: 'Domain names (comma-separated):',
              validate: (input) => {
                if (!input.trim()) return 'At least one domain is required';
                return true;
              }
            }
          ]);
          domains = answers.domains;
        }

        if (provider === 'letsencrypt') {
          if (!letsencryptEmail) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'email',
                message: 'Let\'s Encrypt email address:',
                validate: (input) => {
                  if (!input.trim()) return 'Email is required for Let\'s Encrypt';
                  return true;
                }
              }
            ]);
            letsencryptEmail = answers.email;
          }

          if (!agreeTos) {
            const answers = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'agree',
                message: 'Do you agree to Let\'s Encrypt Terms of Service?',
                default: false
              }
            ]);
            agreeTos = answers.agree;
          }

          if (!agreeTos) {
            throw new Error('You must agree to Let\'s Encrypt Terms of Service');
          }
        }

        // Parse domains
        const domainList = domains.split(',').map(d => d.trim());

        // Prepare data
        let certData = {
          nice_name: name,
          domain_names: domainList,
          provider: provider
        };

        if (provider === 'letsencrypt') {
          certData = {
            ...certData,
            meta: {
              letsencrypt_email: letsencryptEmail,
              letsencrypt_agree: agreeTos,
              dns_challenge: dnsProvider ? true : false,
              dns_provider: dnsProvider || undefined,
              dns_provider_credentials: dnsCredentials ? JSON.parse(dnsCredentials) : undefined
            }
          };
        }

        const spinner = createSpinner('Creating certificate...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.createCertificate(certData);

        spinner.stop();

        success('Certificate created successfully!');

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Delete certificate command
  certCmd
    .command('delete <id>')
    .description('Delete a certificate')
    .option('-f, --force', 'Force deletion without confirmation')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete certificate ${id}?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            info('Deletion cancelled');
            return;
          }
        }

        const spinner = createSpinner('Deleting certificate...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.deleteCertificate(id);

        spinner.stop();

        success(`Certificate ${id} deleted successfully!`);

        if (options.json) {
          console.log(formatOutput({ message: 'Certificate deleted successfully' }, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Renew certificate command
  certCmd
    .command('renew <id>')
    .description('Renew a Let\'s Encrypt certificate')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Renewing certificate...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const result = await api.renewCertificate(id);

        spinner.stop();

        success(`Certificate ${id} renewed successfully!`);

        if (options.json) {
          console.log(formatOutput(result, 'json'));
        } else {
          console.log(formatOutput(result));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Test certificate command
  certCmd
    .command('test <id>')
    .description('Test certificate configuration')
    .option('--json', 'Output in JSON format')
    .action(async (id, options) => {
      try {
        const spinner = createSpinner('Testing certificate...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const certificate = await api.getCertificate(id);

        spinner.stop();

        // Check if certificate is expired
        const expiresOn = new Date(certificate.expires_on);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresOn - now) / (1000 * 60 * 60 * 24));

        let status = 'Valid';
        if (daysUntilExpiry < 0) {
          status = 'Expired';
        } else if (daysUntilExpiry < 30) {
          status = 'Expiring Soon';
        }

        const testResult = {
          id: certificate.id,
          name: certificate.nice_name,
          provider: certificate.provider,
          domains: certificate.domain_names,
          expires_on: certificate.expires_on,
          days_until_expiry: daysUntilExpiry,
          status: status
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

  // Auto-renew command
  certCmd
    .command('auto-renew')
    .description('Renew all expiring certificates')
    .option('--days <days>', 'Renew certificates expiring in less than N days', '30')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const days = parseInt(options.days);
        const spinner = createSpinner('Fetching certificates...');
        spinner.start();

        const api = new NginxProxyManagerAPI();
        const certificates = await api.getCertificates();

        spinner.stop();

        const now = new Date();
        const expiringCerts = certificates.filter(cert => {
          const expiresOn = new Date(cert.expires_on);
          const daysUntilExpiry = Math.ceil((expiresOn - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry < days && cert.provider === 'letsencrypt';
        });

        if (expiringCerts.length === 0) {
          info(`No certificates expiring within ${days} days found`);
          return;
        }

        info(`Found ${expiringCerts.length} certificate(s) expiring within ${days} days`);

        const results = [];
        for (const cert of expiringCerts) {
          const renewSpinner = createSpinner(`Renewing certificate ${cert.nice_name}...`);
          renewSpinner.start();

          try {
            const result = await api.renewCertificate(cert.id);
            results.push({
              id: cert.id,
              name: cert.nice_name,
              status: 'success',
              result: result
            });
            renewSpinner.stop();
            success(`Certificate ${cert.nice_name} renewed successfully`);
          } catch (error) {
            renewSpinner.stop();
            warning(`Failed to renew certificate ${cert.nice_name}: ${error.message}`);
            results.push({
              id: cert.id,
              name: cert.nice_name,
              status: 'failed',
              error: error.message
            });
          }
        }

        if (options.json) {
          console.log(formatOutput(results, 'json'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  return certCmd;
}

module.exports = certificatesCommands;