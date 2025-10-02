const chalk = require('chalk');
const { table } = require('table');
const config = require('./config');
const moment = require('moment');

function showBanner() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                  Nginx Proxy Manager CLI v1.0.0                       ║
║                                                                       ║
║         Manage your reverse proxy configuration with ease             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
  `));
}

function handleError(error) {
  let cfg;
  try {
    cfg = typeof config === 'function' ? config() : config;
  } catch (e) {
    // Fallback to basic error handling if config is not available
    console.error(chalk.red.bold('Error:'), error.message);
    process.exit(1);
  }
  
  if (cfg && cfg.isDebug && cfg.isDebug()) {
    console.error(chalk.red.bold('Error:'), error);
    if (error.stack) {
      console.error(chalk.red.bold('Stack:'), error.stack);
    }
  } else {
    console.error(chalk.red.bold('Error:'), error.message);
  }
  
  process.exit(1);
}

function formatOutput(data, format = null) {
  const cfg = config();
  const outputFormat = format || cfg.getOutputFormat();
  
  switch (outputFormat) {
    case 'json':
      console.log(JSON.stringify(data, null, 2));
      break;
    case 'yaml':
      const yaml = require('js-yaml');
      console.log(yaml.dump(data));
      break;
    case 'table':
    default:
      if (Array.isArray(data)) {
        printTable(data);
      } else {
        printObject(data);
      }
      break;
  }
}

function printTable(data) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No data to display'));
    return;
  }

  // Get headers from first item
  const headers = Object.keys(data[0]).filter(key => 
    !key.startsWith('_') && key !== 'meta' && key !== 'locations'
  );
  
  // Create table data
  const tableData = [
    headers.map(h => chalk.bold(h.toUpperCase().replace(/_/g, ' ')))
  ];

  data.forEach(item => {
    const row = headers.map(header => {
      let value = item[header];
      
      // Format specific fields
      if (header === 'enabled') {
        return value ? chalk.green('✓') : chalk.red('✗');
      }
      if (header.includes('date') || header.includes('on')) {
        return value ? moment(value).format('YYYY-MM-DD HH:mm') : '';
      }
      if (header === 'domain_names' && Array.isArray(value)) {
        return value.join(', ');
      }
      if (typeof value === 'boolean') {
        return value ? chalk.green('Yes') : chalk.red('No');
      }
      if (value === null || value === undefined) {
        return chalk.gray('N/A');
      }
      
      return String(value);
    });
    tableData.push(row);
  });

  // Print table
  console.log(table(tableData, {
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
    columnDefault: {
      paddingLeft: 1,
      paddingRight: 1
    }
  }));
}

function printObject(data) {
  if (!data) {
    console.log(chalk.yellow('No data to display'));
    return;
  }

  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('_') || key === 'meta' || key === 'locations') return;
    
    const formattedKey = key.toUpperCase().replace(/_/g, ' ');
    
    // Format specific fields
    if (key === 'enabled') {
      console.log(`${chalk.bold(formattedKey)}: ${value ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    } else if (key.includes('date') || key.includes('on')) {
      const formattedDate = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : chalk.gray('N/A');
      console.log(`${chalk.bold(formattedKey)}: ${formattedDate}`);
    } else if (key === 'domain_names' && Array.isArray(value)) {
      console.log(`${chalk.bold(formattedKey)}: ${value.join(', ')}`);
    } else if (typeof value === 'boolean') {
      console.log(`${chalk.bold(formattedKey)}: ${value ? chalk.green('Yes') : chalk.red('No')}`);
    } else if (value === null || value === undefined) {
      console.log(`${chalk.bold(formattedKey)}: ${chalk.gray('N/A')}`);
    } else if (typeof value === 'object') {
      console.log(`${chalk.bold(formattedKey)}:`);
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(`${chalk.bold(formattedKey)}: ${value}`);
    }
  });
}

function formatDate(date) {
  if (!date) return chalk.gray('N/A');
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

function formatBoolean(value, trueText = 'Yes', falseText = 'No') {
  return value ? chalk.green(trueText) : chalk.red(falseText);
}

function formatStatus(enabled) {
  return enabled ? chalk.green.bold('ENABLED') : chalk.red.bold('DISABLED');
}

function formatArray(array, separator = ', ') {
  if (!Array.isArray(array) || array.length === 0) {
    return chalk.gray('None');
  }
  return array.join(separator);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
  return domainRegex.test(domain);
}

function validatePort(port) {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

function validateIp(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

function parseDomainList(domains) {
  if (Array.isArray(domains)) return domains;
  return domains.split(',').map(d => d.trim()).filter(d => d);
}

function parsePortList(ports) {
  if (Array.isArray(ports)) return ports;
  return ports.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
}

function confirmAction(message) {
  const inquirer = require('inquirer');
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: message,
      default: false
    }
  ]).then(answer => answer.confirm);
}

function selectFromList(message, choices) {
  const inquirer = require('inquirer');
  return inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: message,
      choices: choices
    }
  ]).then(answer => answer.selection);
}

function inputRequired(message, validate = null) {
  const inquirer = require('inquirer');
  const question = {
    type: 'input',
    name: 'input',
    message: message,
    validate: validate || (input => input.trim() !== '' || 'This field is required')
  };
  
  return inquirer.prompt([question]).then(answer => answer.input);
}

function passwordInput(message) {
  const inquirer = require('inquirer');
  return inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: message,
      mask: '*'
    }
  ]).then(answer => answer.password);
}

function showSpinner(message) {
  const ora = require('ora');
  return ora(message).start();
}

function success(message) {
  console.log(chalk.green.bold('✓'), message);
}

function warning(message) {
  console.log(chalk.yellow.bold('⚠'), message);
}

function info(message) {
  console.log(chalk.blue.bold('ℹ'), message);
}

function error(message) {
  console.log(chalk.red.bold('✗'), message);
}

module.exports = {
  showBanner,
  handleError,
  formatOutput,
  formatDate,
  formatBoolean,
  formatStatus,
  formatArray,
  validateEmail,
  validateDomain,
  validatePort,
  validateIp,
  parseDomainList,
  parsePortList,
  confirmAction,
  selectFromList,
  inputRequired,
  passwordInput,
  showSpinner,
  success,
  warning,
  info,
  error
};