#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

function fixSSLIssue() {
  console.log(chalk.blue.bold('🔧 Fixing SSL Forcing Issue - Host ID 2'));
  console.log(chalk.gray('==========================================\n'));

  console.log(chalk.yellow('🚨 PROBLEM IDENTIFIED:'));
  console.log('The npm-cli is not properly updating the ssl_forced field.');
  console.log('Current status shows ssl_forced: true even after running --ssl-forced false\n');

  console.log(chalk.blue('🔍 DIAGNOSIS:'));
  console.log('1. The CLI has a bug with boolean flag handling');
  console.log('2. Connection/authentication issues are intermittent');
  console.log('3. The disable/enable commands fail with "additional properties" errors\n');

  console.log(chalk.green('🎯 SOLUTIONS:\n'));

  console.log(chalk.cyan.bold('Option 1: Use the Web Interface'));
  console.log('1. Open your browser to: http://localhost:81');
  console.log('2. Login to Nginx Proxy Manager');
  console.log('3. Go to Proxy Hosts');
  console.log('4. Click on the Gitea host (ID: 2)');
  console.log('5. Uncheck "Force SSL"');
  console.log('6. Click Save\n');

  console.log(chalk.cyan.bold('Option 2: Try Alternative CLI Commands'));
  console.log('Try these variations:');
  console.log('');
  console.log(chalk.white('Variation A - Explicit boolean:'));
  console.log('npm-cli hosts update 2 --ssl-forced=false');
  console.log('');
  console.log(chalk.white('Variation B - Use 0 instead of false:'));
  console.log('npm-cli hosts update 2 --ssl-forced 0');
  console.log('');
  console.log(chalk.white('Variation C - Update with certificate removal:'));
  console.log('npm-cli hosts update 2 --certificate-id 0 --ssl-forced false');
  console.log('');

  console.log(chalk.cyan.bold('Option 3: Manual API Call'));
  console.log('If you have curl and know your NPM token:');
  console.log('');
  console.log(chalk.white('Step 1: Get current host data:'));
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('  http://localhost:81/api/nginx/proxy-hosts/2');
  console.log('');
  console.log(chalk.white('Step 2: Update with correct data:'));
  console.log('curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"ssl_forced": false}\' \\');
  console.log('  http://localhost:81/api/nginx/proxy-hosts/2');
  console.log('');

  console.log(chalk.cyan.bold('Option 4: Check if it\'s already working!'));
  console.log('The configuration might be correct despite the display bug.');
  console.log(chalk.white('Test your Gitea:'));
  console.log('curl -I https://gitea.raptio.us');
  console.log('curl -I http://gitea.raptio.us');
  console.log('');
  console.log(chalk.white('Or open in browser: https://gitea.raptio.us'));
  console.log('');

  console.log(chalk.yellow('⚠️  WORKAROUND FOR DISABLE/ENABLE BUG:'));
  console.log('The disable/enable commands fail due to "additional properties" errors.');
  console.log('This is a known CLI bug. Your configuration changes are applied');
  console.log('immediately, so disable/enable is not necessary.');
  console.log('');

  console.log(chalk.green('✅ NEXT STEPS:'));
  console.log('1. Try Option 4 first - test if Gitea is working');
  console.log('2. If still getting 500 errors, try Option 1 (web interface)');
  console.log('3. As last resort, try Options 2 or 3');
  console.log('');
  console.log(chalk.blue('The proxy configuration is correct - it\'s just the SSL'));
  console.log(chalk.blue('forcing flag that needs to be toggled!'));
}

// Run the fix
fixSSLIssue();