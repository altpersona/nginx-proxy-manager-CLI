#!/usr/bin/env node

const NginxProxyManagerAPI = require('./lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('./lib/utils');
const chalk = require('chalk');

class GiteaTroubleshooter {
  constructor() {
    this.api = new NginxProxyManagerAPI();
  }

  async troubleshoot(domain = 'gitea.raptio.us') {
    console.log(chalk.blue.bold(`🔍 Troubleshooting proxy host: ${domain}\n`));
    
    try {
      // Step 1: Find the proxy host
      const spinner = createSpinner('Searching for proxy host...');
      spinner.start();
      
      const hosts = await this.api.getProxyHosts();
      const targetHost = hosts.find(host => 
        host.domain_names && host.domain_names.includes(domain)
      );
      
      spinner.stop();
      
      if (!targetHost) {
        warning(`No proxy host found for domain: ${domain}`);
        console.log(chalk.yellow('💡 Suggestions:'));
        console.log('  - Check if the domain is spelled correctly');
        console.log('  - Verify the proxy host exists in Nginx Proxy Manager');
        console.log('  - Use "npm-cli hosts list" to see all configured hosts');
        return;
      }
      
      success(`Found proxy host (ID: ${targetHost.id})`);
      console.log();
      
      // Step 2: Analyze the configuration
      await this.analyzeConfiguration(targetHost);
      
      // Step 3: Check common issues
      await this.checkCommonIssues(targetHost);
      
      // Step 4: Test connectivity
      await this.testConnectivity(targetHost);
      
      // Step 5: Provide recommendations
      this.provideRecommendations(targetHost);
      
    } catch (error) {
      handleError(error);
    }
  }
  
  async analyzeConfiguration(host) {
    info('📋 Configuration Analysis:');
    console.log(chalk.gray('─'.repeat(50)));
    
    // Basic info
    console.log(`${chalk.bold('Domain:')} ${host.domain_names.join(', ')}`);
    console.log(`${chalk.bold('Forward to:')} ${host.forward_scheme}://${host.forward_host}:${host.forward_port}`);
    console.log(`${chalk.bold('Status:')} ${host.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`${chalk.bold('SSL Forced:')} ${host.ssl_forced ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log(`${chalk.bold('HTTP2:')} ${host.http2_support ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
    console.log(`${chalk.bold('Certificate:')} ${host.certificate_id ? chalk.green(`ID: ${host.certificate_id}`) : chalk.red('None')}`);
    
    // Advanced config
    if (host.advanced_config) {
      console.log(`${chalk.bold('Advanced Config:')}`);
      console.log(chalk.gray(host.advanced_config));
    }
    
    // Locations
    if (host.locations && host.locations.length > 0) {
      console.log(`${chalk.bold('Locations:')} ${host.locations.length}`);
      host.locations.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.path} → ${location.forward_scheme}://${location.forward_host}:${location.forward_port}`);
      });
    }
    
    console.log();
  }
  
  async checkCommonIssues(host) {
    info('🔧 Checking for Common Issues:');
    console.log(chalk.gray('─'.repeat(50)));
    
    const issues = [];
    
    // Check 1: Host is disabled
    if (!host.enabled) {
      issues.push({
        severity: 'critical',
        issue: 'Proxy host is disabled',
        solution: 'Enable the host using: npm-cli hosts enable ' + host.id
      });
    }
    
    // Check 2: No certificate but SSL forced
    if (host.ssl_forced && !host.certificate_id) {
      issues.push({
        severity: 'critical',
        issue: 'SSL is forced but no certificate is configured',
        solution: 'Either disable SSL forcing or add a certificate'
      });
    }
    
    // Check 3: Forward host is localhost/127.0.0.1
    if (host.forward_host === 'localhost' || host.forward_host === '127.0.0.1') {
      issues.push({
        severity: 'warning',
        issue: 'Forwarding to localhost/127.0.0.1',
        solution: 'Ensure the target service is running on the Nginx Proxy Manager host'
      });
    }
    
    // Check 4: Common port issues
    if (host.forward_port === 80 && host.forward_scheme === 'https') {
      issues.push({
        severity: 'warning',
        issue: 'HTTPS forwarding to port 80',
        solution: 'Check if the target service expects HTTPS on port 80'
      });
    }
    
    if (host.forward_port === 443 && host.forward_scheme === 'http') {
      issues.push({
        severity: 'warning',
        issue: 'HTTP forwarding to port 443',
        solution: 'Check if the target service expects HTTP on port 443'
      });
    }
    
    // Check 5: Blocked ports
    const blockedPorts = [22, 25, 53, 110, 143, 993, 995];
    if (blockedPorts.includes(host.forward_port)) {
      issues.push({
        severity: 'warning',
        issue: `Forwarding to potentially blocked port ${host.forward_port}`,
        solution: 'Ensure this port is allowed by your firewall/security policies'
      });
    }
    
    // Display issues
    if (issues.length === 0) {
      success('No common configuration issues found');
    } else {
      issues.forEach((issue, index) => {
        const severityColor = issue.severity === 'critical' ? chalk.red : chalk.yellow;
        console.log(`${index + 1}. ${severityColor(issue.issue)}`);
        console.log(`   💡 Solution: ${issue.solution}`);
        console.log();
      });
    }
    
    console.log();
  }
  
  async testConnectivity(host) {
    info('🌐 Connectivity Tests:');
    console.log(chalk.gray('─'.repeat(50)));
    
    // Test DNS resolution
    const dns = require('dns').promises;
    try {
      const addresses = await dns.resolve4(host.domain_names[0]);
      success(`DNS resolution: ${addresses.join(', ')}`);
    } catch (error) {
      warning(`DNS resolution failed: ${error.message}`);
    }
    
    // Test forward host connectivity
    const http = require('http');
    const https = require('https');
    
    const testUrl = `${host.forward_scheme}://${host.forward_host}:${host.forward_port}`;
    const spinner = createSpinner(`Testing connection to ${testUrl}...`);
    spinner.start();
    
    const protocol = host.forward_scheme === 'https' ? https : http;
    const options = {
      hostname: host.forward_host,
      port: host.forward_port,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };
    
    return new Promise((resolve) => {
      const req = protocol.request(options, (res) => {
        spinner.stop();
        if (res.statusCode >= 200 && res.statusCode < 500) {
          success(`Target service is reachable (HTTP ${res.statusCode})`);
        } else {
          warning(`Target service returned HTTP ${res.statusCode}`);
        }
        resolve();
      });
      
      req.on('error', (error) => {
        spinner.stop();
        warning(`Cannot connect to target service: ${error.message}`);
        resolve();
      });
      
      req.on('timeout', () => {
        spinner.stop();
        warning('Connection to target service timed out');
        req.destroy();
        resolve();
      });
      
      req.end();
    });
  }
  
  provideRecommendations(host) {
    info('💡 Recommendations:');
    console.log(chalk.gray('─'.repeat(50)));
    
    const recommendations = [];
    
    // Recommendation 1: Check logs
    recommendations.push('Check Nginx Proxy Manager logs for detailed error messages');
    
    // Recommendation 2: Verify target service
    recommendations.push(`Verify that the target service at ${host.forward_host}:${host.forward_port} is running`);
    
    // Recommendation 3: Test directly
    recommendations.push(`Test the target service directly: curl -I ${host.forward_scheme}://${host.forward_host}:${host.forward_port}`);
    
    // Recommendation 4: Certificate issues
    if (host.ssl_forced && !host.certificate_id) {
      recommendations.push('Configure SSL certificate or disable SSL forcing');
    }
    
    // Recommendation 5: Advanced debugging
    if (host.advanced_config) {
      recommendations.push('Review advanced configuration for syntax errors');
    }
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log();
    console.log(chalk.blue.bold('🎯 Next Steps:'));
    console.log('1. Check the Nginx Proxy Manager logs for the specific 500 error');
    console.log('2. Verify the target service is accessible from the NPM container');
    console.log('3. Test the configuration changes and monitor the results');
    console.log();
  }
}

// Main execution
if (require.main === module) {
  const domain = process.argv[2] || 'gitea.raptio.us';
  const troubleshooter = new GiteaTroubleshooter();
  
  console.log(chalk.bold.blue('🛠️  Nginx Proxy Manager Troubleshooter'));
  console.log(chalk.gray('Analyzing proxy host configuration and common issues\n'));
  
  troubleshooter.troubleshoot(domain).catch(console.error);
}

module.exports = GiteaTroubleshooter;