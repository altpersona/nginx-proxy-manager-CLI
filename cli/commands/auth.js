const chalk = require('chalk');
const config = require('../lib/config');
const api = require('../lib/api');
const utils = require('../lib/utils');

async function login(options = {}) {
  const cfg = config();
  
  try {
    // Get credentials
    let email = options.email;
    let password = options.password;

    if (!email) {
      email = await utils.inputRequired('Email address:', utils.validateEmail);
    }

    if (!password) {
      password = await utils.passwordInput('Password:');
    }

    const spinner = utils.showSpinner('Authenticating...');
    
    try {
      // Attempt login
      const response = await api.login(email, password);
      
      spinner.succeed('Authentication successful!');
      
      // Save token if requested
      if (options.save) {
        cfg.saveToken(response);
        utils.success('Credentials saved to configuration file');
      } else {
        utils.info('Token:', response.token);
        utils.info('Expires:', response.expires);
      }
      
      utils.success(`Logged in as ${email}`);
      
    } catch (error) {
      spinner.fail('Authentication failed');
      throw error;
    }
    
  } catch (error) {
    if (error.message.includes('Invalid email or password')) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }
    throw error;
  }
}

async function logout() {
  const cfg = config();
  
  try {
    cfg.removeToken();
    utils.success('Logged out successfully');
    utils.info('Authentication token removed');
  } catch (error) {
    throw new Error(`Failed to logout: ${error.message}`);
  }
}

async function status() {
  const cfg = config();
  
  try {
    console.log(chalk.blue.bold('\nAuthentication Status:'));
    
    // Check if token exists
    const token = cfg.getToken();
    if (!token) {
      console.log(chalk.red('Status: Not authenticated'));
      console.log(chalk.yellow('Please run: npm-cli login'));
      return;
    }
    
    console.log(chalk.green('Status: Authenticated'));
    
    // Test API connectivity
    const spinner = utils.showSpinner('Testing API connectivity...');
    
    try {
      const response = await api.getStatus();
      spinner.succeed('API connectivity: OK');
      
      console.log(chalk.blue.bold('\nAPI Information:'));
      console.log(`URL: ${cfg.getApiUrl()}`);
      console.log(`Version: ${response.version.major}.${response.version.minor}.${response.version.revision}`);
      console.log(`Status: ${response.status}`);
      
    } catch (error) {
      spinner.fail('API connectivity: Failed');
      console.log(chalk.red(`Error: ${error.message}`));
    }
    
    // Show token info (without exposing the actual token)
    console.log(chalk.blue.bold('\nToken Information:'));
    console.log('Token: ' + chalk.green('Present (hidden for security)'));
    
    if (cfg.token && cfg.token.expires) {
      const expires = new Date(cfg.token.expires);
      const now = new Date();
      const isExpired = expires < now;
      
      if (isExpired) {
        console.log(chalk.red('Expires: Token has expired'));
        console.log(chalk.yellow('Please run: npm-cli login'));
      } else {
        const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
        console.log(`Expires: ${utils.formatDate(expires)} (${daysLeft} days remaining)`);
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to check status: ${error.message}`);
  }
}

module.exports = {
  login,
  logout,
  status
};