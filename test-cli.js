#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

// Simple test runner for the CLI
console.log(chalk.blue.bold('🧪 Testing Nginx Proxy Manager CLI\n'));

const tests = [
  {
    name: 'CLI Help',
    command: ['node', [path.join(__dirname, 'bin/npm-cli.js'), '--help']],
    expected: 'CLI for managing Nginx Proxy Manager'
  },
  {
    name: 'CLI Version',
    command: ['node', [path.join(__dirname, 'bin/npm-cli.js'), '--version']],
    expected: '1.0.0'
  },
  {
    name: 'Auth Help',
    command: ['node', [path.join(__dirname, 'bin/npm-cli.js'), 'auth', '--help']],
    expected: 'Authentication management commands'
  },
  {
    name: 'Hosts Help',
    command: ['node', [path.join(__dirname, 'bin/npm-cli.js'), 'hosts', '--help']],
    expected: 'Proxy hosts management commands'
  },
  {
    name: 'Certificates Help',
    command: ['node', [path.join(__dirname, 'bin/npm-cli.js'), 'certificates', '--help']],
    expected: 'SSL certificate management commands'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(chalk.blue(`Running: ${test.name}`));
    
    const [cmd, args] = test.command;
    const proc = spawn(cmd, args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      const success = stdout.includes(test.expected) || stderr.includes(test.expected);
      
      if (success) {
        console.log(chalk.green(`✓ ${test.name} - PASSED`));
      } else {
        console.log(chalk.red(`✗ ${test.name} - FAILED`));
        console.log(chalk.gray('Expected:'), test.expected);
        console.log(chalk.gray('Got stdout:'), stdout.substring(0, 200));
        console.log(chalk.gray('Got stderr:'), stderr.substring(0, 200));
      }
      
      resolve({ name: test.name, success, code, stdout, stderr });
    });
    
    proc.on('error', (error) => {
      console.log(chalk.red(`✗ ${test.name} - ERROR: ${error.message}`));
      resolve({ name: test.name, success: false, error: error.message });
    });
  });
}

async function runAllTests() {
  console.log(chalk.yellow('Starting CLI tests...\n'));
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(); // Empty line for readability
  }
  
  // Summary
  console.log(chalk.blue.bold('📊 Test Summary\n'));
  console.log(chalk.green(`✓ Passed: ${passed}`));
  console.log(chalk.red(`✗ Failed: ${failed}`));
  console.log(chalk.blue(`📈 Total: ${tests.length}`));
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 All tests passed!'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed!'));
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Test runner error:'), error);
  process.exit(1);
});