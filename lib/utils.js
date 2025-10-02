const chalk = require('chalk');
const { table } = require('table');
const ora = require('ora');

function formatOutput(data, format = 'table', options = {}) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (Array.isArray(data)) {
    return formatTable(data, options);
  }

  if (typeof data === 'object') {
    return formatObject(data, options);
  }

  return String(data);
}

function formatTable(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return chalk.gray('No data available');
  }

  // Extract headers from first object
  const headers = Object.keys(data[0]);
  
  // Create table data
  const tableData = [
    headers.map(h => chalk.bold(h.toUpperCase())),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return formatValue(value, header);
    }))
  ];

  const config = {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    },
    columns: {
      0: { alignment: 'left' }
    },
    ...options.tableConfig
  };

  return table(tableData, config);
}

function formatObject(obj, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return String(obj);
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return chalk.gray('Empty object');
  }

  const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
  
  return entries.map(([key, value]) => {
    const formattedKey = chalk.bold(key.padEnd(maxKeyLength));
    const formattedValue = formatValue(value, key);
    return `${formattedKey} : ${formattedValue}`;
  }).join('\n');
}

function formatValue(value, key = '') {
  if (value === null || value === undefined) {
    return chalk.gray('null');
  }

  if (typeof value === 'boolean') {
    return value ? chalk.green('✓ true') : chalk.red('✗ false');
  }

  if (typeof value === 'number') {
    return chalk.cyan(value.toString());
  }

  if (value instanceof Date) {
    return chalk.magenta(value.toISOString());
  }

  if (typeof value === 'string') {
    // Special formatting for common fields
    if (key.toLowerCase().includes('status')) {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'online' || lowerValue === 'active' || lowerValue === 'enabled') {
        return chalk.green(value);
      } else if (lowerValue === 'offline' || lowerValue === 'inactive' || lowerValue === 'disabled') {
        return chalk.red(value);
      }
    }

    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      return chalk.magenta(value);
    }

    if (key.toLowerCase().includes('id')) {
      return chalk.yellow(value);
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return chalk.gray('[]');
    }
    return chalk.gray(`[${value.length} items]`);
  }

  if (typeof value === 'object') {
    return chalk.gray('{object}');
  }

  return String(value);
}

function createSpinner(text = 'Loading...') {
  return ora({
    text: text,
    spinner: 'dots',
    color: 'blue'
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

function validatePort(port) {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

function validateIp(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function parseProxyHost(data) {
  return {
    id: data.id,
    domain_names: data.domain_names,
    forward_host: data.forward_host,
    forward_port: data.forward_port,
    forward_scheme: data.forward_scheme,
    enabled: data.enabled,
    certificate_id: data.certificate_id,
    ssl_forced: data.ssl_forced,
    http2_support: data.http2_support,
    advanced_config: data.advanced_config,
    locations: data.locations,
    access_list_id: data.access_list_id,
    meta: data.meta
  };
}

function parseCertificate(data) {
  return {
    id: data.id,
    provider: data.provider,
    nice_name: data.nice_name,
    domain_names: data.domain_names,
    expires_on: data.expires_on,
    meta: data.meta
  };
}

function parseAccessList(data) {
  return {
    id: data.id,
    name: data.name,
    pass_auth: data.pass_auth,
    satisfy_any: data.satisfy_any,
    access_list: data.access_list,
    client_certificate: data.client_certificate,
    meta: data.meta
  };
}

function handleError(error, verbose = false) {
  if (verbose) {
    console.error(chalk.red('Error details:'));
    console.error(error);
  }

  if (error.response) {
    console.error(chalk.red('API Error:'), error.message);
    if (error.response.data && error.response.data.error) {
      console.error(chalk.red('Details:'), error.response.data.error);
    }
  } else if (error.request) {
    console.error(chalk.red('Connection Error:'), error.message);
  } else {
    console.error(chalk.red('Error:'), error.message);
  }

  process.exit(1);
}

function success(message) {
  console.log(chalk.green('✓'), message);
}

function warning(message) {
  console.log(chalk.yellow('⚠'), message);
}

function info(message) {
  console.log(chalk.blue('ℹ'), message);
}

module.exports = {
  formatOutput,
  formatTable,
  formatObject,
  formatValue,
  createSpinner,
  validateEmail,
  validateDomain,
  validatePort,
  validateIp,
  parseProxyHost,
  parseCertificate,
  parseAccessList,
  handleError,
  success,
  warning,
  info
};