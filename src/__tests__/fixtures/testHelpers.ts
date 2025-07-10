import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';

export async function createTempDir(prefix: string = 'x402-test-'): Promise<string> {
  const tempDir = path.join(process.cwd(), `${prefix}${randomBytes(8).toString('hex')}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

export function generateTestSeed(): string {
  return `test-seed-${randomBytes(16).toString('hex')}`;
}

export const mockWalletData = {
  address: '0x1234567890123456789012345678901234567890',
  privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234' as `0x${string}`,
  encryptedPrivateKey: 'encrypted-test-key',
  salt: 'test-salt',
  iv: 'test-iv',
  authTag: 'test-auth-tag',
  createdAt: 1234567890,
  entropyHash: 'test-entropy-hash',
  version: 1
};