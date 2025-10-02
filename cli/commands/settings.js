const { Command } = require('commander');
const chalk = require('chalk');
const api = require('../lib/api');
const utils = require('../lib/utils');

function listCommand() {
  const cmd = new Command('list');
  cmd.alias('ls')
    .description('List all settings')
    .option('-q, --query <query>', 'Search query')
    .option('-e, --expand <fields>', 'Expand related fields (comma-separated)')
    .action(async (options) => {
      try {
        const params = {};
        
        if (options.query) params.query = options.query;
        if (options.expand) params.expand = options.expand;
        
        const settings = await api.getSettings(params);
        
        if (settings.length === 0) {
          utils.info('No settings found');
          return;
        }
        
        utils.formatOutput(settings);
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function updateCommand() {
  const cmd = new Command('update');
  cmd.alias('set')
    .description('Update a setting')
    .argument('<id>', 'Setting ID', parseInt)
    .option('-v, --value <value>', 'Setting value')
    .option('-t, --type <type>', 'Value type (string, number, boolean, json)')
    .action(async (id, options) => {
      try {
        let data = {};
        
        // Get current setting first
        const currentSetting = await api.getSetting(id);
        
        // Determine the new value
        let value = options.value;
        
        if (!value) {
          console.log(chalk.blue.bold(`\nCurrent Setting:`));
          utils.formatOutput(currentSetting);
          
          value = await utils.inputRequired(
            'New value:',
            (input) => input.trim() !== '' || 'Value cannot be empty'
          );
        }
        
        // Parse value based on type
        if (options.type) {
          value = parseValueByType(value, options.type);
        } else {
          // Auto-detect type based on current setting
          value = parseValueByType(value, detectValueType(currentSetting.value));
        }
        
        data = {
          value: value
        };
        
        const spinner = utils.showSpinner('Updating setting...');
        
        try {
          const setting = await api.updateSetting(id, data);
          spinner.succeed('Setting updated successfully!');
          
          utils.success(`Setting ID: ${setting.id}`);
          utils.info(`Name: ${setting.name}`);
          utils.info(`Value: ${setting.value}`);
          
        } catch (error) {
          spinner.fail('Failed to update setting');
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
  cmd.description('Show detailed information about a setting')
    .argument('<id>', 'Setting ID', parseInt)
    .option('-e, --expand <fields>', 'Expand related fields')
    .action(async (id, options) => {
      try {
        const params = {};
        if (options.expand) params.expand = options.expand;
        
        const setting = await api.getSetting(id, params);
        
        utils.formatOutput(setting);
        
        // Show additional information
        console.log(chalk.blue.bold('\nSetting Details:'));
        console.log(`Scope: ${setting.scope || 'global'}`);
        console.log(`Type: ${detectValueType(setting.value)}`);
        console.log(`Description: ${setting.description || 'No description available'}`);
        
        if (setting.meta && Object.keys(setting.meta).length > 0) {
          console.log(chalk.blue.bold('\nMetadata:'));
          Object.entries(setting.meta).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
          });
        }
        
      } catch (error) {
        utils.handleError(error);
      }
    });
  
  return cmd;
}

function parseValueByType(value, type) {
  switch (type.toLowerCase()) {
    case 'boolean':
    case 'bool':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
      
    case 'number':
    case 'int':
    case 'integer':
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`);
      }
      return num;
      
    case 'float':
    case 'double':
      const float = parseFloat(value);
      if (isNaN(float)) {
        throw new Error(`Invalid float: ${value}`);
      }
      return float;
      
    case 'json':
    case 'object':
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }
      
    case 'string':
    case 'text':
    default:
      return String(value);
  }
}

function detectValueType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'object') return 'json';
  if (typeof value === 'string') {
    // Try to detect JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        JSON.parse(value);
        return 'json';
      } catch {
        return 'string';
      }
    }
    
    // Try to detect boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }
    
    // Try to detect number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return 'number';
    }
    
    return 'string';
  }
  
  return 'string';
}

// Common settings management
async function manageCommonSettings() {
  try {
    const settings = await api.getSettings();
    
    console.log(chalk.blue.bold('\nCommon Settings Management:'));
    
    // Group settings by category
    const categories = {
      'Default Site': settings.filter(s => s.name.includes('default-site')),
      'SSL/TLS': settings.filter(s => s.name.includes('ssl') || s.name.includes('tls')),
      'Security': settings.filter(s => s.name.includes('security') || s.name.includes('exploit')),
      'Performance': settings.filter(s => s.name.includes('cache') || s.name.includes('performance')),
      'Other': settings.filter(s => !s.name.includes('default-site') && !s.name.includes('ssl') && !s.name.includes('tls') && !s.name.includes('security') && !s.name.includes('exploit') && !s.name.includes('cache') && !s.name.includes('performance'))
    };
    
    Object.entries(categories).forEach(([category, categorySettings]) => {
      if (categorySettings.length > 0) {
        console.log(chalk.green.bold(`\n${category}:`));
        categorySettings.forEach(setting => {
          console.log(`  ${setting.id}: ${setting.name} = ${setting.value}`);
          if (setting.description) {
            console.log(`     ${chalk.gray(setting.description)}`);
          }
        });
      }
    });
    
  } catch (error) {
    utils.handleError(error);
  }
}

module.exports = {
  listCommand,
  updateCommand,
  showCommand,
  manageCommonSettings
};