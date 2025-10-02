#!/usr/bin/env node

/**
 * Simple test script to verify CLI functionality
 * This script tests basic CLI operations without requiring a running NPM instance
 */

const { spawn } = require('child_process');
const chalk = require('chalk');

const CLI_PATH = './bin/npm-cli.js';

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...command.split(' ').concat(args)], {
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function testCommand(description, command, expectedInOutput = null) {
  console.log(chalk.blue(`\n🧪 Testing: ${description}`));
  console.log(chalk.gray(`Command: npm-cli ${command}`));
  
  try {
    const result = await runCommand(command);
    
    if (result.code !== 0) {
      console.log(chalk.red(`❌ Failed with exit code: ${result.code}`));
      if (result.stderr) {
        console.log(chalk.red(`Error: ${result.stderr}`));
      }
      return false;
    }
    
    if (expectedInOutput) {
      const found = result.stdout.toLowerCase().includes(expectedInOutput.toLowerCase());
      if (!found) {
        console.log(chalk.red(`❌ Expected output not found: "${expectedInOutput}"`));
        console.log(chalk.gray(`Actual output: ${result.stdout}`));
        return false;
      }
    }
    
    console.log(chalk.green(`✅ Passed`));
    if (result.stdout) {
      console.log(chalk.gray(`Output: ${result.stdout.substring(0, 100)}${result.stdout.length > 100 ? '...' : ''}`));
    }
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function runTests() {
  console.log(chalk.blue.bold('🚀 Nginx Proxy Manager CLI Test Suite'));
  console.log(chalk.blue('=====================================\n'));
  
  let passed = 0;
  let total = 0;
  
  // Test basic commands
  const tests = [
    ['Help command', '--help', 'usage'],
    ['Version command', '--version', '1.0.0'],
    ['Config show', 'config --show', 'apiurl'],
    ['Auth status (should fail without auth)', 'status', 'authentication'],
    ['Hosts list (should fail without auth)', 'hosts list', 'authentication'],
    ['Certs list (should fail without auth)', 'certs list', 'authentication'],
    ['Access-lists list (should fail without auth)', 'access-lists list', 'authentication'],
    ['Streams list (should fail without auth)', 'streams list', 'authentication'],
    ['Redirections list (should fail without auth)', 'redirections list', 'authentication'],
  ];
  
  for (const [description, command, expected] of tests) {
    total++;
    const result = await testCommand(description, command, expected);
    if (result) passed++;
  }
  
  // Test command structure
  console.log(chalk.blue('\n🔍 Testing Command Structure...'));
  
  const commandStructureTests = [
    ['Hosts commands available', 'hosts --help', 'list'],
    ['Certs commands available', 'certs --help', 'list'],
    ['Access-lists commands available', 'access-lists --help', 'list'],
    ['Streams commands available', 'streams --help', 'list'],
    ['Redirections commands available', 'redirections --help', 'list'],
    ['Settings commands available', 'settings --help', 'list'],
  ];
  
  for (const [description, command, expected] of commandStructureTests) {
    total++;
    const result = await testCommand(description, command, expected);
    if (result) passed++;
  }
  
  // Test invalid commands
  console.log(chalk.blue('\n🚫 Testing Error Handling...'));
  
  const errorTests = [
    ['Invalid command', 'invalid-command', 'invalid command'],
    ['Invalid subcommand', 'hosts invalid', 'invalid'],
    ['Missing required argument', 'hosts show', 'required'],
  ];
  
  for (const [description, command, expected] of errorTests) {
    total++;
    const result = await testCommand(description, command, expected);
    if (result) passed++;
  }
  
  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary'));
  console.log(chalk.blue('================\n'));
  
  const percentage = Math.round((passed / total) * 100);
  const color = percentage >= 80 ? chalk.green : percentage >= 60 ? chalk.yellow : chalk.red;
  
  console.log(color(`✅ Passed: ${passed}/${total} (${percentage}%)`));
  
  if (passed === total) {
    console.log(chalk.green.bold('\n🎉 All tests passed! CLI is working correctly.'));
  } else {
    console.log(chalk.yellow(`\n⚠️  Some tests failed. Check the output above for details.`));
    console.log(chalk.gray('\nNote: Authentication failures are expected if no NPM instance is running.'));
  }
  
  // Additional recommendations
  console.log(chalk.blue('\n💡 Next Steps:'));
  console.log(chalk.gray('1. Start your Nginx Proxy Manager instance'));
  console.log(chalk.gray('2. Run: npm-cli login'));
  console.log(chalk.gray('3. Test with real data: npm-cli hosts list'));
  console.log(chalk.gray('4. Explore more commands with: npm-cli --help'));
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
}

module.exports = { runTests, runCommand };