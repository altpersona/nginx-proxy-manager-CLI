const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const CONFIG_DIR = path.join(os.homedir(), '.npm-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

let configCache = null;

function getDefaultConfig() {
  return {
    url: 'http://localhost:81',
    token: null,
    outputFormat: 'table',
    timeout: 30000,
    verifySsl: true
  };
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  if (configCache) {
    return configCache;
  }

  ensureConfigDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      configCache = yaml.load(content);
    } catch (error) {
      console.warn('Warning: Failed to load config file, using defaults');
      configCache = getDefaultConfig();
    }
  } else {
    configCache = getDefaultConfig();
    saveConfig(configCache);
  }

  return configCache;
}

function saveConfig(config) {
  ensureConfigDir();
  
  try {
    const yamlContent = yaml.dump(config);
    fs.writeFileSync(CONFIG_FILE, yamlContent, 'utf8');
    configCache = config;
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

function getConfig() {
  return loadConfig();
}

function updateConfig(updates) {
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig);
  return newConfig;
}

function resetConfig() {
  const defaultConfig = getDefaultConfig();
  saveConfig(defaultConfig);
  return defaultConfig;
}

function getConfigPath() {
  return CONFIG_FILE;
}

function setConfigPath(configPath) {
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      configCache = yaml.load(content);
      return configCache;
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
  } else {
    throw new Error(`Config file not found: ${configPath}`);
  }
}

module.exports = {
  getConfig,
  updateConfig,
  resetConfig,
  getConfigPath,
  setConfigPath,
  getDefaultConfig
};