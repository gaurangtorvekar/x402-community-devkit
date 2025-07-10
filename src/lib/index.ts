import { WalletManager, WalletWithPrivateKey } from './wallet/WalletManager';
import { showFundingInstructions } from './faucet/instructions';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NETWORKS, type NetworkType } from './config/constants';
import chalk from 'chalk';

export interface X402DevKitOptions {
  walletPath?: string;
  network?: NetworkType;
}

export interface Balances {
  eth: string;
  usdc: string;
}

export class X402DevKit {
  private walletManager: WalletManager;
  private network: NetworkType;
  private publicClient: any;
  private walletPromise: Promise<WalletWithPrivateKey> | null = null;
  
  constructor(options: X402DevKitOptions = {}) {
    this.walletManager = new WalletManager(options.walletPath);
    this.network = options.network || 'base-sepolia';
    
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(NETWORKS[this.network].rpcUrl)
    });
  }
  
  async getWallet(): Promise<WalletWithPrivateKey> {
    if (!this.walletPromise) {
      this.walletPromise = this.initializeWallet();
    }
    
    return this.walletPromise;
  }
  
  private async initializeWallet(): Promise<WalletWithPrivateKey> {
    let wallet = await this.walletManager.loadWallet();
    
    if (!wallet) {
      console.log(chalk.yellow('No wallet found. Creating new wallet...'));
      wallet = await this.walletManager.createWallet();
      console.log(chalk.green('✓ New wallet created!'));
    }
    
    return wallet;
  }
  
  async getBalances(): Promise<Balances> {
    const wallet = await this.getWallet();
    
    const ethBalance = await this.publicClient.getBalance({
      address: wallet.address
    });
    
    const usdcBalance = await this.publicClient.readContract({
      address: NETWORKS[this.network].usdcAddress,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: 'balance', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [wallet.address]
    });
    
    return {
      eth: formatEther(ethBalance),
      usdc: (Number(usdcBalance) / 1e6).toFixed(2)
    };
  }
  
  async needsFunding(): Promise<boolean> {
    const balances = await this.getBalances();
    const minEth = parseFloat(NETWORKS[this.network].minEthBalance);
    const minUsdc = parseFloat(NETWORKS[this.network].minUsdcBalance);
    
    return parseFloat(balances.eth) < minEth || parseFloat(balances.usdc) < minUsdc;
  }
  
  async showFundingInstructions(): Promise<void> {
    const wallet = await this.getWallet();
    await showFundingInstructions(wallet.address, this.network);
  }
  
  createBuyer(): any {
    console.log(chalk.yellow('To create a buyer, install x402-axios or x402-fetch'));
    console.log(chalk.gray('npm install x402-axios'));
    console.log(chalk.gray('Then use withPaymentInterceptor with your wallet'));
  }
  
  createSeller(): any {
    console.log(chalk.yellow('To create a seller, install x402-express'));
    console.log(chalk.gray('npm install x402-express'));
    console.log(chalk.gray('Then use paymentMiddleware with your configuration'));
  }
}

export { WalletManager, WalletWithPrivateKey };
export * from './config/constants';
export * from './wallet/storage';