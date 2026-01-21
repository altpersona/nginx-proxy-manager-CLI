#!/usr/bin/env node

const NginxProxyManagerAPI = require('./lib/api');
const { formatOutput, success, warning, info, handleError, createSpinner } = require('./lib/utils');
const chalk = require('chalk');
const axios = require('axios');

class Error500Diagnoser {
  constructor() {
    this.api = new NginxProxyManagerAPI();
  }

  async diagnose(domain = 'gitea.raptio.us') {
    console.log(chalk.red.bold(`🚨 Diagnosing 500 Error for: ${domain}\n`));
    
    try {
      // Step 1: Find and analyze the proxy host
      const host = await this.findProxyHost(domain);
      if (!host) return;
      
      // Step 2: Check for common 500 error causes
      await this.checkCommon500Causes(host);
      
      // Step 3: Test the actual request flow
      await this.testRequestFlow(host);
      
      // Step 4: Check Nginx configuration
      await this.checkNginxConfig(host);
      
      // Step 5: Provide specific 500 error solutions
      this.provide500ErrorSolutions(host);
      
    } catch (error) {
      handleError(error);
    }
  }
  
  async findProxyHost(domain) {
    const spinner = createSpinner('Finding proxy host configuration...');
    spinner.start();
    
    try {
      const hosts = await this.api.getProxyHosts();
      const targetHost = hosts.find(host => 
        host.domain_names && host.domain_names.includes(domain)
      );
      
      spinner.stop();
      
      if (!targetHost) {
        warning(`No proxy host found for domain: ${domain}`);
        return null;
      }
      
      success(`Found proxy host configuration (ID: ${targetHost.id})`);
      console.log();
      
      // Display key configuration details
      info('Current Configuration:');
      console.log(`  Domain: ${chalk.bold(targetHost.domain_names.join(', '))}`);
      console.log(`  Forward: ${chalk.bold(`${targetHost.forward_scheme}://${targetHost.forward_host}:${targetHost.forward_port}`)}`);
      console.log(`  Status: ${targetHost.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
      console.log(`  SSL Forced: ${targetHost.ssl_forced ? chalk.green('Yes') : chalk.yellow('No')}`);
      console.log(`  Certificate: ${targetHost.certificate_id ? chalk.green('Configured') : chalk.red('Not configured')}`);
      console.log();
      
      return targetHost;
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }
  
  async checkCommon500Causes(host) {
    info('🔍 Checking Common 500 Error Causes:');
    console.log(chalk.gray('─'.repeat(50)));
    
    const issues = [];
    
    // Cause 1: Target service not responding
    if (host.forward_host === 'localhost' || host.forward_host === '127.0.0.1') {
      issues.push({
        cause: 'Target service on localhost',
        details: 'Gitea might not be running on the NPM host',
        check: 'Verify Gitea container/service is running'
      });
    }
    
    // Cause 2: SSL misconfiguration
    if (host.ssl_forced && !host.certificate_id) {
      issues.push({
        cause: 'SSL certificate missing',
        details: 'SSL is forced but no certificate is configured',
        check: 'Add SSL certificate or disable SSL forcing'
      });
    }
    
    // Cause 3: Wrong port/scheme combination
    if (host.forward_scheme === 'https' && host.forward_port === 80) {
      issues.push({
        cause: 'HTTPS to port 80',
        details: 'Trying to use HTTPS on HTTP port',
        check: 'Change forward port to 443 or scheme to HTTP'
      });
    }
    
    // Cause 4: Gitea specific issues
    if (host.forward_port === 3000 || host.forward_port === 22) {
      issues.push({
        cause: 'Gitea specific port',
        details: `Port ${host.forward_port} is commonly used by Gitea`,
        check: 'Ensure Gitea is configured to accept external connections'
      });
    }
    
    // Cause 5: Advanced config issues
    if (host.advanced_config && host.advanced_config.includes('proxy_pass')) {
      issues.push({
        cause: 'Custom proxy configuration',
        details: 'Advanced config may contain syntax errors',
        check: 'Review advanced configuration for nginx syntax errors'
      });
    }
    
    if (issues.length === 0) {
      success('No obvious configuration issues found');
    } else {
      issues.forEach((issue, index) => {
        console.log(`${chalk.red.bold(index + 1 + '.')} ${chalk.yellow(issue.cause)}`);
        console.log(`   ${chalk.gray('Details:')} ${issue.details}`);
        console.log(`   ${chalk.blue('Check:')} ${issue.check}`);
        console.log();
      });
    }
    
    console.log();
  }
  
  async testRequestFlow(host) {
    info('🧪 Testing Request Flow:');
    console.log(chalk.gray('─'.repeat(50)));
    
    const tests = [
      {
        name: 'Direct target connection',
        url: `${host.forward_scheme}://${host.forward_host}:${host.forward_port}`,
        description: 'Testing if Gitea is accessible directly'
      },
      {
        name: 'Domain DNS resolution',
        url: `https://${host.domain_names[0]}`,
        description: 'Testing if domain resolves correctly'
      }
    ];
    
    for (const test of tests) {
      const spinner = createSpinner(`${test.description}...`);
      spinner.start();
      
      try {
        const response = await axios({
          method: 'HEAD',
          url: test.url,
          timeout: 10000,
          validateStatus: () => true // Don't throw on any status code
        });
        
        spinner.stop();
        
        if (response.status >= 200 && response.status < 400) {
          success(`${test.name}: HTTP ${response.status} ✓`);
        } else if (response.status >= 400 && response.status < 500) {
          warning(`${test.name}: HTTP ${response.status} ⚠️`);
        } else {
          console.log(`${chalk.red(`${test.name}: HTTP ${response.status} ✗`)}`);
        }
        
        // Show response headers if available
        if (response.headers && response.headers.server) {
          console.log(`   Server: ${response.headers.server}`);
        }
        
      } catch (error) {
        spinner.stop();
        
        if (error.code === 'ECONNREFUSED') {
          console.log(`${chalk.red(`${test.name}: Connection refused ✗`)}`);
          console.log(`   The target service is not running or not accessible`);
        } else if (error.code === 'ENOTFOUND') {
          console.log(`${chalk.red(`${test.name}: DNS resolution failed ✗`)}`);
          console.log(`   The domain or host cannot be resolved`);
        } else if (error.code === 'ETIMEDOUT') {
          console.log(`${chalk.red(`${test.name}: Connection timeout ✗`)}`);
          console.log(`   The connection timed out, service may be overloaded`);
        } else {
          console.log(`${chalk.red(`${test.name}: ${error.message} ✗`)}`);
        }
      }
      
      console.log();
    }
  }
  
  async checkNginxConfig(host) {
    info('⚙️  Nginx Configuration Check:');
    console.log(chalk.gray('─'.repeat(50)));
    
    // Simulate nginx configuration analysis
    console.log('Analyzing proxy configuration...');
    
    const configIssues = [];
    
    // Check for common nginx configuration problems
    if (host.advanced_config) {
      if (host.advanced_config.includes('proxy_set_header Host $host;')) {
        configIssues.push('Host header is being set correctly');
      }
      
      if (host.advanced_config.includes('proxy_set_header X-Real-IP')) {
        configIssues.push('Real IP header is configured');
      }
      
      if (host.advanced_config.includes('proxy_buffering')) {
        configIssues.push('Proxy buffering is configured');
      }
    }
    
    if (configIssues.length === 0) {
      warning('No custom nginx configuration detected');
      console.log('Default nginx proxy configuration will be used');
    } else {
      success('Custom nginx configuration found:');
      configIssues.forEach(issue => console.log(`  ✓ ${issue}`));
    }
    
    console.log();
    
    // Gitea-specific nginx recommendations
    info('Gitea-specific Nginx Recommendations:');
    const giteaConfig = `
location / {
    proxy_pass ${host.forward_scheme}://${host.forward_host}:${host.forward_port};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
`;
    
    console.log('Recommended nginx configuration for Gitea:');
    console.log(chalk.gray(giteaConfig));
    console.log();
  }
  
  provide500ErrorSolutions(host) {
    info('🛠️  500 Error Specific Solutions:');
    console.log(chalk.gray('─'.repeat(50)));
    
    const solutions = [
      {
        priority: 'HIGH',
        solution: 'Check Gitea logs for the actual error',
        command: 'docker logs gitea-container-name',
        description: 'The 500 error details will be in Gitea logs'
      },
      {
        priority: 'HIGH',
        solution: 'Verify Gitea is running and accessible',
        command: `curl -I ${host.forward_scheme}://${host.forward_host}:${host.forward_port}`,
        description: 'Test direct connection to Gitea'
      },
      {
        priority: 'MEDIUM',
        solution: 'Check nginx error logs',
        command: 'docker logs nginx-proxy-manager',
        description: 'Look for proxy_pass errors or timeouts'
      },
      {
        priority: 'MEDIUM',
        solution: 'Test with SSL disabled temporarily',
        command: `npm-cli hosts update ${host.id} --no-ssl-forced`,
        description: 'Rule out SSL certificate issues'
      },
      {
        priority: 'LOW',
        solution: 'Add proper proxy headers',
        command: `npm-cli hosts update ${host.id} --advanced "proxy_set_header Host \\$host; proxy_set_header X-Real-IP \\$remote_addr; proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \\$scheme;"`,
        description: 'Configure proper proxy headers for Gitea'
      }
    ];
    
    solutions.forEach((sol, index) => {
      const priorityColor = sol.priority === 'HIGH' ? chalk.red : 
                           sol.priority === 'MEDIUM' ? chalk.yellow : chalk.gray;
      
      console.log(`${priorityColor(`[${sol.priority}]`)} ${chalk.bold(sol.solution)}`);
      console.log(`   ${chalk.blue('Command:')} ${sol.command}`);
      console.log(`   ${chalk.gray('Description:')} ${sol.description}`);
      console.log();
    });
    
    console.log(chalk.red.bold('🚨 Critical Next Steps:'));
    console.log('1. Check Gitea application logs immediately');
    console.log('2. Verify database connectivity for Gitea');
    console.log('3. Test the proxy configuration with a simple HTTP service first');
    console.log('4. Ensure Gitea is configured to accept reverse proxy connections');
    console.log();
  }
}

// Main execution
if (require.main === module) {
  const domain = process.argv[2] || 'gitea.raptio.us';
  const diagnoser = new Error500Diagnoser();
  
  console.log(chalk.bold.red('🚨 500 Error Diagnostic Tool'));
  console.log(chalk.gray('Diagnosing proxy host configuration issues\n'));
  
  diagnoser.diagnose(domain).catch(console.error);
}

module.exports = Error500Diagnoser;