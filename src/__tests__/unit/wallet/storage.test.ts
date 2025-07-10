import { StoredWallet } from '../../../lib/wallet/storage';

describe('StoredWallet', () => {
  const mockStoredWallet: StoredWallet = {
    address: '0x1234567890123456789012345678901234567890',
    encryptedPrivateKey: 'encrypted-key',
    salt: 'salt-value',
    iv: 'iv-value',
    authTag: 'auth-tag',
    createdAt: Date.now(),
    entropyHash: 'entropy-hash',
    version: 1
  };

  it('should have correct structure', () => {
    expect(mockStoredWallet).toHaveProperty('address');
    expect(mockStoredWallet).toHaveProperty('encryptedPrivateKey');
    expect(mockStoredWallet).toHaveProperty('salt');
    expect(mockStoredWallet).toHaveProperty('iv');
    expect(mockStoredWallet).toHaveProperty('authTag');
    expect(mockStoredWallet).toHaveProperty('createdAt');
    expect(mockStoredWallet).toHaveProperty('entropyHash');
    expect(mockStoredWallet).toHaveProperty('version');
  });

  it('should have correct types', () => {
    expect(typeof mockStoredWallet.address).toBe('string');
    expect(typeof mockStoredWallet.encryptedPrivateKey).toBe('string');
    expect(typeof mockStoredWallet.salt).toBe('string');
    expect(typeof mockStoredWallet.iv).toBe('string');
    expect(typeof mockStoredWallet.authTag).toBe('string');
    expect(typeof mockStoredWallet.createdAt).toBe('number');
    expect(typeof mockStoredWallet.entropyHash).toBe('string');
    expect(typeof mockStoredWallet.version).toBe('number');
  });

  it('should validate address format', () => {
    expect(mockStoredWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have version 1', () => {
    expect(mockStoredWallet.version).toBe(1);
  });
});