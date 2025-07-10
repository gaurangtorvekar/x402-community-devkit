export interface StoredWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  authTag: string;
  createdAt: number;
  entropyHash: string;
  version: number;
}