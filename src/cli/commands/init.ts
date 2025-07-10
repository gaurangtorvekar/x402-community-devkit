import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WalletManager } from '../../lib/wallet/WalletManager';
import { showFundingInstructions } from '../../lib/faucet/instructions';

export const initCommand = new Command('init')
  .description('Initialize x402 in existing project')
  .action(async () => {
    const spinner = ora();
    
    try {
      const cwd = process.cwd();
      const packageJsonPath = path.join(cwd, 'package.json');
      
      try {
        await fs.access(packageJsonPath);
      } catch {
        console.error(chalk.red('Error: No package.json found. Run this command in a Node.js project directory.'));
        process.exit(1);
      }
      
      const walletManager = new WalletManager();
      
      if (await walletManager.walletExists()) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'x402 wallet already exists. Overwrite?',
            default: false
          }
        ]);
        
        if (!overwrite) {
          console.log(chalk.yellow('Initialization cancelled.'));
          return;
        }
      }
      
      const { seed } = await inquirer.prompt([
        {
          type: 'input',
          name: 'seed',
          message: 'Enter an optional seed phrase for wallet generation (press enter to skip):',
          default: ''
        }
      ]);
      
      spinner.start('Generating development wallet...');
      
      const wallet = await walletManager.createWallet(seed);
      
      spinner.text = 'Updating .env file...';
      
      const envPath = path.join(cwd, '.env');
      let envContent = '';
      
      try {
        envContent = await fs.readFile(envPath, 'utf8');
      } catch {
        // File doesn't exist, create new
      }
      
      const envLines = envContent.split('\\n');
      const updatedLines = envLines.filter(line => 
        !line.startsWith('X402_PRIVATE_KEY=') && 
        !line.startsWith('X402_WALLET_ADDRESS=')
      );
      
      updatedLines.push(`X402_PRIVATE_KEY=${wallet.privateKey}`);
      updatedLines.push(`X402_WALLET_ADDRESS=${wallet.address}`);
      
      await fs.writeFile(envPath, updatedLines.join('\\n'));
      
      spinner.text = 'Checking .gitignore...';
      
      const gitignorePath = path.join(cwd, '.gitignore');
      let gitignoreContent = '';
      
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      } catch {
        // File doesn't exist, create new
      }
      
      const gitignoreLines = gitignoreContent.split('\\n');
      const hasX402 = gitignoreLines.some(line => line.includes('.x402/'));
      const hasEnv = gitignoreLines.some(line => line.includes('.env'));
      
      if (!hasX402 || !hasEnv) {
        if (!hasEnv) gitignoreLines.push('.env');
        if (!hasX402) gitignoreLines.push('.x402/');
        await fs.writeFile(gitignorePath, gitignoreLines.join('\\n'));
      }
      
      spinner.succeed(chalk.green('x402 initialized successfully!'));
      
      console.log(chalk.cyan('\\n🚀 Next steps:\\n'));
      console.log(chalk.white('   1. Install x402 packages:'));
      console.log(chalk.gray('      npm install x402-axios  # for making paid requests'));
      console.log(chalk.gray('      npm install x402-express  # for creating paid APIs'));
      console.log(chalk.white('\\n   2. Fund your wallet:'));
      console.log(chalk.gray('      x402-devkit fund'));
      console.log(chalk.white('\\n   3. Start building with x402!\\n'));
      
      await showFundingInstructions(wallet.address);
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to initialize x402'));
      console.error(error);
      process.exit(1);
    }
  });