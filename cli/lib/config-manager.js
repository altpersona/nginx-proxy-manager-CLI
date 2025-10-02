// Config Manager - Avoids circular dependencies by providing a clean interface
const configFactory = require('./config');

let configInstance = null;

function getConfigInstance() {
  if (!configInstance) {
    configInstance = configFactory();
  }
  return configInstance;
}

function initConfig(options) {
  const config = getConfigInstance();
  config.init(options);
  return config;
}

module.exports = {
  getConfig: getConfigInstance,
  initConfig
};