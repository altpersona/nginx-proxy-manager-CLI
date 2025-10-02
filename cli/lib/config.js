const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const CONFIG_DIR = path.join(os.homedir(), '.npm-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

let configInstance = null;

// Export the function immediately to avoid circular dependency issues
module.exports = getConfig;

// Define the class after the export to avoid instantiation issues
class Config {
  constructor() {
    // Lazy initialization to avoid issues during module loading
    if (!this.config) {
      this.config = this.loadConfig();
    }
    if (!this.token) {
      this.token = this.loadToken();
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not load config file: ${error.message}`));
    }
    
    return this.getDefaultConfig();
  }

  loadToken() {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not load token file: ${error.message}`));
    }
    
    return null;
  }

  getDefaultConfig() {
    return {
      apiUrl: process.env.NPM_API_URL || 'http://localhost:3000',
      timeout: 30000,
      retries: 3,
      outputFormat: 'table',
      verifySsl: true,
      defaultDomain: null,
      debug: false
    };
  }

  init(options = {}) {
    // Override with command line options
    if (options.url) this.config.apiUrl = options.url;
    if (options.token) this.token = { token: options.token };
    if (options.config) {
      // Load custom config file
      try {
        const customConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        this.config = { ...this.config, ...customConfig };
      } catch (error) {
        throw new Error(`Could not load custom config file: ${error.message}`);
      }
    }
    if (options.json) this.config.outputFormat = 'json';
    if (options.verbose) this.config.debug = true;
  }

  getApiUrl() {
    return this.config.apiUrl;
  }

  getToken() {
    // Priority: CLI token > env var > stored token
    return process.env.NPM_TOKEN || (this.token ? this.token.token : null);
  }

  getTimeout() {
    return this.config.timeout;
  }

  getRetries() {
    return this.config.retries;
  }

  getOutputFormat() {
    return this.config.outputFormat;
  }

  getVerifySsl() {
    return this.config.verifySsl;
  }

  getDefaultDomain() {
    return this.config.defaultDomain;
  }

  isDebug() {
    return this.config.debug;
  }

  saveConfig() {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Could not save config file: ${error.message}`);
    }
  }

  saveToken(tokenData) {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      this.token = tokenData;
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
      // Set appropriate permissions
      fs.chmodSync(TOKEN_FILE, 0o600);
    } catch (error) {
      throw new Error(`Could not save token file: ${error.message}`);
    }
  }

  removeToken() {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        fs.unlinkSync(TOKEN_FILE);
      }
      this.token = null;
    } catch (error) {
      throw new Error(`Could not remove token file: ${error.message}`);
    }
  }

  async manage(options) {
    if (options.show) {
      console.log(chalk.blue('Current Configuration:'));
      console.log(JSON.stringify(this.config, null, 2));
      return;
    }

    if (options.get) {
      const value = this.getNestedValue(this.config, options.get);
      console.log(value !== undefined ? value : chalk.red('Key not found'));
      return;
    }

    if (options.set) {
      const [key, value] = options.set.split('=');
      if (!key || value === undefined) {
        throw new Error('Invalid format. Use: --set key=value');
      }
      this.setNestedValue(this.config, key, this.parseValue(value));
      this.saveConfig();
      console.log(chalk.green(`Set ${key} = ${value}`));
      return;
    }

    if (options.reset) {
      this.config = this.getDefaultConfig();
      this.saveConfig();
      console.log(chalk.green('Configuration reset to defaults'));
      return;
    }

    // Default: show current config
    console.log(chalk.blue('Current Configuration:'));
    console.log(JSON.stringify(this.config, null, 2));
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  parseValue(value) {
    // Try to parse as JSON, number, or boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value) && !isNaN(parseFloat(value))) return parseFloat(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

// Singleton pattern
function getConfig() {
  if (!configInstance) {
    configInstance = new Config();
  }
  return configInstance;
}

module.exports = getConfig();