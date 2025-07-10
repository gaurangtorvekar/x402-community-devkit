import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { FAUCET_LINKS, NETWORKS, type NetworkType } from '../config/constants';

export async function showFundingInstructions(address: string, network: NetworkType = 'base-sepolia'): Promise<void> {
  console.log(chalk.cyan('\n💰 Funding Instructions for Base Sepolia\n'));
  console.log(chalk.white('Your wallet address:'), chalk.green(address));
  
  try {
    await clipboardy.write(address);
    console.log(chalk.gray('(Address copied to clipboard!)'));
  } catch {
    console.log(chalk.gray('(Copy the address above)'));
  }
  
  console.log(chalk.yellow('\n📝 Step 1: Get Base Sepolia ETH (for gas fees)'));
  console.log(chalk.gray('You need at least 0.01 ETH to pay for transactions\n'));
  
  FAUCET_LINKS[network].eth.forEach((faucet, index) => {
    console.log(`   ${index + 1}. ${faucet.name}:`);
    console.log(`      ${chalk.blue.underline(faucet.url)}`);
  });
  
  console.log(chalk.yellow('\n💵 Step 2: Get USDC test tokens'));
  console.log(chalk.gray('You need USDC to make payments with x402\n'));
  console.log(`   ${FAUCET_LINKS[network].usdc}`);
  console.log(`   USDC Contract: ${chalk.cyan(NETWORKS[network].usdcAddress)}`);
  
  console.log(chalk.yellow('\n🔍 Step 3: Verify your balances'));
  console.log(`   Check your wallet on Base Sepolia explorer:`);
  console.log(`   ${chalk.blue.underline(NETWORKS[network].explorer + '/address/' + address)}`);
  
  console.log(chalk.green('\n✅ Once you have both ETH and USDC, you\'re ready to use x402!'));
  console.log(chalk.gray('\nRun'), chalk.cyan('x402-devkit fund'), chalk.gray('again to check your balances\n'));
}