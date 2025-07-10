import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WalletManager } from '../../lib/wallet/WalletManager';
import { showFundingInstructions } from '../../lib/faucet/instructions';
import { execSync } from 'child_process';

export const createCommand = new Command('create')
  .argument('<name>', 'Project name')
  .description('Create a new x402 project')
  .action(async (name: string) => {
    const spinner = ora();
    
    try {
      const projectPath = path.join(process.cwd(), name);
      try {
        await fs.access(projectPath);
        console.error(chalk.red(`Error: Directory ${name} already exists`));
        process.exit(1);
      } catch {
        // Directory doesn't exist, good to proceed
      }
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'template',
          message: 'What type of x402 integration?',
          choices: [
            { name: 'Both buyer and seller examples', value: 'full' },
            { name: 'Buyer only (make paid requests)', value: 'buyer' },
            { name: 'Seller only (create paid API)', value: 'seller' }
          ],
          default: 'full'
        },
        {
          type: 'input',
          name: 'seed',
          message: 'Enter an optional seed phrase for wallet generation (press enter to skip):',
          default: ''
        }
      ]);
      
      spinner.start('Creating project structure...');
      
      await fs.mkdir(projectPath, { recursive: true });
      
      const templatePath = path.join(__dirname, '../../../templates/project-template');
      await copyTemplateFiles(templatePath, projectPath, { 
        projectName: name,
        template: answers.template 
      });
      
      spinner.text = 'Generating development wallet...';
      
      const walletManager = new WalletManager(path.join(projectPath, '.x402/wallet.json'));
      const wallet = await walletManager.createWallet(answers.seed);
      
      const envPath = path.join(projectPath, '.env');
      const envContent = `# x402 Development Wallet (Base Sepolia)\\nX402_PRIVATE_KEY=${wallet.privateKey}\\nX402_WALLET_ADDRESS=${wallet.address}\\n`;
      await fs.writeFile(envPath, envContent);
      
      spinner.text = 'Installing dependencies...';
      
      execSync('npm install', { cwd: projectPath, stdio: 'pipe' });
      
      spinner.succeed(chalk.green('Project created successfully!'));
      
      console.log(chalk.cyan('\\n📁 Project created at:'), chalk.white(projectPath));
      console.log(chalk.cyan('\\n🚀 Next steps:\\n'));
      console.log(chalk.white(`   cd ${name}`));
      console.log(chalk.white('   npm run fund  # Get test ETH and USDC'));
      console.log(chalk.white('   npm run dev   # Start development\\n'));
      
      await showFundingInstructions(wallet.address);
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(error);
      process.exit(1);
    }
  });

async function copyTemplateFiles(src: string, dest: string, variables: any) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name.replace('.template', ''));
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyTemplateFiles(srcPath, destPath, variables);
    } else {
      let content = await fs.readFile(srcPath, 'utf8');
      
      content = content.replace(/\\{\\{PROJECT_NAME\\}\\}/g, variables.projectName);
      content = content.replace(/\\{\\{TEMPLATE_TYPE\\}\\}/g, variables.template);
      
      await fs.writeFile(destPath, content);
    }
  }
}