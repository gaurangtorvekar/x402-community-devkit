import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createTempDir, cleanupTempDir } from '../fixtures/testHelpers';

describe('CLI Integration', () => {
  let tempDir: string;
  let originalCwd: string;
  
  beforeEach(async () => {
    tempDir = await createTempDir();
    originalCwd = process.cwd();
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
  });
  
  describe('x402-devkit init', () => {
    it('should initialize x402 in existing project', async () => {
      process.chdir(tempDir);
      
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project'
      };
      
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      const mockInput = 'test-seed\\n';
      const projectRoot = path.resolve(__dirname, '../../..');
      const result = execSync(`echo "${mockInput}" | node -e "
        const { initCommand } = require('${projectRoot}/dist/cli/commands/init');
        const { program } = require('commander');
        program.addCommand(initCommand);
        program.parse(['node', 'test', 'init']);
      "`, {
        cwd: tempDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Next steps');
      
      const envExists = await fs.access(path.join(tempDir, '.env')).then(() => true).catch(() => false);
      expect(envExists).toBe(true);
      
      const walletExists = await fs.access(path.join(tempDir, '.x402/wallet.json')).then(() => true).catch(() => false);
      expect(walletExists).toBe(true);
    }, 30000);
  });
  
  describe('x402-devkit fund', () => {
    it('should show funding instructions', async () => {
      process.chdir(tempDir);
      
      await fs.mkdir(path.join(tempDir, '.x402'), { recursive: true });
      
      const mockWallet = {
        address: '0x1234567890123456789012345678901234567890',
        encryptedPrivateKey: 'mock-encrypted',
        salt: 'mock-salt',
        iv: 'mock-iv',
        authTag: 'mock-auth-tag',
        createdAt: Date.now(),
        entropyHash: 'mock-entropy',
        version: 1
      };
      
      await fs.writeFile(
        path.join(tempDir, '.x402/wallet.json'),
        JSON.stringify(mockWallet, null, 2)
      );
      
      const projectRoot = path.resolve(__dirname, '../../..');
      const result = execSync(`node -e "
        const { fundCommand } = require('${projectRoot}/dist/cli/commands/fund');
        const { program } = require('commander');
        program.addCommand(fundCommand);
        program.parse(['node', 'test', 'fund']);
      "`, {
        cwd: tempDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Wallet Information');
    }, 30000);
  });
});