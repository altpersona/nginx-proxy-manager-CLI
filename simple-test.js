#!/usr/bin/env node

// Simple test to verify basic CLI functionality
const { execSync } = require('child_process');
const path = require('path');
const chalk = require('chalk');

const cliPath = path.join(__dirname, 'bin/npm-cli.js');

console.log(chalk.blue.bold('🔧 Simple CLI Test\n'));

function runTest(description, command) {
  try {
    console.log(chalk.blue(`Testing: ${description}`));
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(chalk.green(`✓ ${description} - PASSED`));
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ ${description} - FAILED`));
    if (error.stdout) console.log(chalk.gray('Output:'), error.stdout.substring(0, 100));
    if (error.stderr) console.log(chalk.gray('Error:'), error.stderr.substring(0, 100));
    return false;
  }
}

const tests = [
  ['CLI should show help', `node ${cliPath} --help`],
  ['CLI should show version', `node ${cliPath} --version`],
  ['Auth help should work', `node ${cliPath} auth --help`],
  ['Hosts help should work', `node ${cliPath} hosts --help`],
  ['Certificates help should work', `node ${cliPath} certificates --help`],
  ['Access lists help should work', `node ${cliPath} access-lists --help`],
  ['Streams help should work', `node ${cliPath} streams --help`],
  ['Redirection help should work', `node ${cliPath} redirection --help`],
  ['Settings help should work', `node ${cliPath} settings --help`]
];

let passed = 0;
let failed = 0;

tests.forEach(([description, command]) => {
  if (runTest(description, command)) {
    passed++;
  } else {
    failed++;
  }
  console.log(); // Empty line
});

console.log(chalk.blue.bold('📊 Test Summary\n'));
console.log(chalk.green(`✓ Passed: ${passed}`));
console.log(chalk.red(`✗ Failed: ${failed}`));
console.log(chalk.blue(`📈 Total: ${tests.length}`));

if (failed === 0) {
  console.log(chalk.green.bold('\n🎉 All basic tests passed!'));
  console.log(chalk.yellow('\n💡 Next steps:'));
  console.log(chalk.white('1. Install dependencies: npm install'));
  console.log(chalk.white('2. Link the CLI: npm link'));
  console.log(chalk.white('3. Test authentication: npm-cli auth login'));
  console.log(chalk.white('4. List hosts: npm-cli hosts list'));
} else {
  console.log(chalk.red.bold('\n❌ Some tests failed!'));
  console.log(chalk.yellow('\n🔍 Check the following:'));
  console.log(chalk.white('1. Are all dependencies installed?'));
  console.log(chalk.white('2. Are there any syntax errors in the code?'));
  console.log(chalk.white('3. Check the error messages above for details'));
}