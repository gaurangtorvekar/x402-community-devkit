import { WalletManager } from '../../../lib/wallet/WalletManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createTempDir, cleanupTempDir, generateTestSeed } from '../../fixtures/testHelpers';

describe('WalletManager', () => {
  let tempDir: string;
  let testWalletPath: string;
  let manager: WalletManager;
  
  beforeEach(async () => {
    tempDir = await createTempDir();
    testWalletPath = path.join(tempDir, 'wallet.json');
    manager = new WalletManager(testWalletPath);
  });
  
  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });
  
  describe('createWallet', () => {
    it('should generate different wallets with different entropy', async () => {
      const wallet1 = await manager.createWallet('seed1');
      
      const manager2 = new WalletManager(path.join(tempDir, 'wallet2.json'));
      const wallet2 = await manager2.createWallet('seed2');
      
      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });
    
    it('should generate deterministic wallets with same seed', async () => {
      const seed = generateTestSeed();
      const wallet1 = await manager.createWallet(seed);
      
      await fs.rm(testWalletPath);
      
      const wallet2 = await manager.createWallet(seed);
      
      expect(wallet1.address).toBe(wallet2.address);
      expect(wallet1.privateKey).toBe(wallet2.privateKey);
    });
    
    it('should persist wallet to disk', async () => {
      const wallet = await manager.createWallet();
      
      const fileExists = await manager.walletExists();
      expect(fileExists).toBe(true);
      
      const fileContent = await fs.readFile(testWalletPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      
      expect(parsed.address).toBe(wallet.address);
      expect(parsed.encryptedPrivateKey).toBeDefined();
      expect(parsed.version).toBe(1);
    });
    
    it('should create directory if it does not exist', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'path', 'wallet.json');
      const nestedManager = new WalletManager(nestedPath);
      
      await nestedManager.createWallet();
      
      const fileExists = await nestedManager.walletExists();
      expect(fileExists).toBe(true);
    });
  });
  
  describe('loadWallet', () => {
    it('should load previously created wallet', async () => {
      const created = await manager.createWallet();
      const loaded = await manager.loadWallet();
      
      expect(loaded).not.toBeNull();
      expect(loaded!.address).toBe(created.address);
      expect(loaded!.privateKey).toBe(created.privateKey);
    });
    
    it('should return null for non-existent wallet', async () => {
      const loaded = await manager.loadWallet();
      expect(loaded).toBeNull();
    });
    
    it('should return null for corrupted wallet file', async () => {
      await fs.writeFile(testWalletPath, 'invalid json');
      
      const loaded = await manager.loadWallet();
      expect(loaded).toBeNull();
    });
  });
  
  describe('walletExists', () => {
    it('should return true for existing wallet', async () => {
      await manager.createWallet();
      
      const exists = await manager.walletExists();
      expect(exists).toBe(true);
    });
    
    it('should return false for non-existent wallet', async () => {
      const exists = await manager.walletExists();
      expect(exists).toBe(false);
    });
  });
  
  describe('encryption', () => {
    it('should encrypt and decrypt private key correctly', async () => {
      const wallet = await manager.createWallet();
      const loaded = await manager.loadWallet();
      
      expect(loaded!.privateKey).toBe(wallet.privateKey);
    });
    
    it('should store different encrypted data for same private key', async () => {
      const seed = generateTestSeed();
      const wallet1 = await manager.createWallet(seed);
      
      const manager2 = new WalletManager(path.join(tempDir, 'wallet2.json'));
      const wallet2 = await manager2.createWallet(seed);
      
      const file1 = await fs.readFile(testWalletPath, 'utf8');
      const file2 = await fs.readFile(path.join(tempDir, 'wallet2.json'), 'utf8');
      
      const parsed1 = JSON.parse(file1);
      const parsed2 = JSON.parse(file2);
      
      expect(parsed1.encryptedPrivateKey).not.toBe(parsed2.encryptedPrivateKey);
      expect(parsed1.salt).not.toBe(parsed2.salt);
      expect(parsed1.iv).not.toBe(parsed2.iv);
    });
  });
});