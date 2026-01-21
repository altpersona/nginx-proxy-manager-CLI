#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

function diagnoseConnection() {
  console.log(chalk.blue.bold('🔧 Diagnosing NPM-CLI Connection Issue'));
  console.log(chalk.gray('=========================================\n'));

  // Step 1: Check if npm-cli is installed and working
  console.log(chalk.yellow('1. Testing npm-cli installation...'));
  const versionCheck = runCommand('npm-cli --version');
  if (versionCheck) {
    console.log(chalk.green('✅ npm-cli is installed'));
  } else {
    console.log(chalk.red('❌ npm-cli command not found'));
    console.log(chalk.blue('💡 Install it with: npm install -g nginx-proxy-manager-cli'));
    return;
  }

  // Step 2: Check authentication status
  console.log(chalk.yellow('\n2. Checking authentication status...'));
  const authStatus = runCommand('npm-cli auth status 2>&1');
  if (authStatus && !authStatus.includes('Not authenticated')) {
    console.log(chalk.green('✅ Authentication is working'));
  } else {
    console.log(chalk.red('❌ Not authenticated'));
    console.log(chalk.blue('💡 You need to login first:'));
    console.log(chalk.white('   npm-cli auth login'));
    console.log(chalk.gray('   Enter your NPM admin email and password'));
    console.log(chalk.yellow('\n⚠️  After logging in, run this script again to get the fix commands.'));
    return;
  }

  // Step 3: Test basic API connection
  console.log(chalk.yellow('\n3. Testing API connection...'));
  const hostsTest = runCommand('npm-cli hosts list --json 2>&1');
  if (hostsTest && !hostsTest.includes('Error')) {
    console.log(chalk.green('✅ API connection is working'));
    
    // Step 4: Find Gitea host
    console.log(chalk.yellow('\n4. Finding Gitea proxy host...'));
    try {
      const hosts = JSON.parse(hostsTest);
      const giteaHost = hosts.find(host => 
        host.domain_names && host.domain_names.some(domain => 
          domain.toLowerCase().includes('gitea.raptio.us')
        )
      );
      
      if (giteaHost) {
        console.log(chalk.green(`✅ Found Gitea host (ID: ${giteaHost.id})`));
        console.log(chalk.blue('\n📋 Current Gitea Configuration:'));
        console.log(chalk.white(`   Domain: ${giteaHost.domain_names.join(', ')}`));
        console.log(chalk.white(`   Forward: ${giteaHost.forward_scheme}://${giteaHost.forward_host}:${giteaHost.forward_port}`));
        console.log(chalk.white(`   SSL Forced: ${giteaHost.ssl_forced}`));
        console.log(chalk.white(`   Certificate: ${giteaHost.certificate_id ? 'Yes' : 'No'}`));
        console.log(chalk.white(`   Enabled: ${giteaHost.enabled}`));
        
        // Step 5: Provide the working commands
        console.log(chalk.yellow('\n5. Fix Commands (copy and paste these):'));
        console.log(chalk.green.bold('\n# Fix the 500 error:'));
        console.log(chalk.white(`npm-cli hosts update 2 \\`));
        console.log(chalk.white(`  --forward-scheme http \\`));
        console.log(chalk.white(`  --forward-host localhost \\`));
        console.log(chalk.white(`  --forward-port 3000 \\`));
        console.log(chalk.white(`  --ssl-forced false \\`));
        console.log(chalk.white(`  --advanced "proxy_set_header Host \\$host; proxy_set_header X-Real-IP \\$remote_addr; proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \\$scheme;"`));
        
        console.log(chalk.green.bold('\n# Restart the host:'));
        console.log(chalk.white(`npm-cli hosts disable 2`));
        console.log(chalk.white(`npm-cli hosts enable 2`));
        
        console.log(chalk.green.bold('\n# Test the fix:'));
        console.log(chalk.white(`curl -I https://gitea.raptio.us`));
        
      } else {
        console.log(chalk.red('❌ No Gitea proxy host found'));
        console.log(chalk.blue('💡 Create one with:'));
        console.log(chalk.white('   npm-cli hosts create -d gitea.raptio.us -h localhost -p 3000'));
      }
    } catch (parseError) {
      console.log(chalk.red('❌ Failed to parse hosts list'));
      console.log(chalk.gray('Raw output:'), hostsTest);
    }
  } else {
    console.log(chalk.red('❌ Cannot connect to Nginx Proxy Manager API'));
    console.log(chalk.blue('💡 Check these settings:'));
    console.log(chalk.white('   1. NPM_URL environment variable'));
    console.log(chalk.white('   2. NPM_TOKEN environment variable'));
    console.log(chalk.white('   3. Nginx Proxy Manager is running'));
    console.log(chalk.white('   4. Network connectivity to NPM'));
    
    // Show current config
    console.log(chalk.yellow('\n📊 Current Configuration:'));
    const config = runCommand('npm-cli auth status 2>&1');
    if (config) {
      console.log(chalk.gray(config));
    }
  }
}

// Run the diagnosis
diagnoseConnection();