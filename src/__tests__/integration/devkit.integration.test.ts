import { X402DevKit } from '../../lib/index';
import { createTempDir, cleanupTempDir } from '../fixtures/testHelpers';
import * as path from 'path';

describe('X402DevKit Integration', () => {
  let tempDir: string;
  let testWalletPath: string;
  
  beforeEach(async () => {
    tempDir = await createTempDir();
    testWalletPath = path.join(tempDir, 'wallet.json');
  });
  
  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });
  
  it('should create a complete wallet workflow', async () => {
    const devkit = new X402DevKit({ walletPath: testWalletPath });
    
    const wallet = await devkit.getWallet();
    expect(wallet).toBeDefined();
    expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    
    const wallet2 = await devkit.getWallet();
    expect(wallet.address).toBe(wallet2.address);
  });
  
  it('should persist wallet across devkit instances', async () => {
    const devkit1 = new X402DevKit({ walletPath: testWalletPath });
    const wallet1 = await devkit1.getWallet();
    
    const devkit2 = new X402DevKit({ walletPath: testWalletPath });
    const wallet2 = await devkit2.getWallet();
    
    expect(wallet1.address).toBe(wallet2.address);
    expect(wallet1.privateKey).toBe(wallet2.privateKey);
  });
  
  it('should handle multiple concurrent wallet accesses', async () => {
    const devkit = new X402DevKit({ walletPath: testWalletPath });
    
    const promises = Array(5).fill(null).map(() => devkit.getWallet());
    const wallets = await Promise.all(promises);
    
    const firstWallet = wallets[0];
    wallets.forEach(wallet => {
      expect(wallet.address).toBe(firstWallet.address);
      expect(wallet.privateKey).toBe(firstWallet.privateKey);
    });
  });
});