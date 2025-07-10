import { randomBytes, createCipheriv, createDecipheriv, scryptSync, createHash } from "crypto";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import * as fs from "fs/promises";
import * as path from "path";
import { WALLET_FILE, WALLET_ENCRYPTION_ALGORITHM } from "../config/constants";
import { StoredWallet } from "./storage";

export class WalletManager {
  private walletPath: string;

  constructor(walletPath: string = WALLET_FILE) {
    this.walletPath = walletPath;
  }

  async createWallet(userSeed?: string): Promise<PrivateKeyAccount> {
    const entropy = this.generateEntropy(userSeed);

    const privateKey = this.derivePrivateKey(entropy);
    const account = privateKeyToAccount(privateKey);

    await this.saveWallet(privateKey, account, entropy);

    return account;
  }

  private generateEntropy(userSeed?: string): Buffer {
    const timestamp = Buffer.from(Date.now().toString());
    const nanoTime = Buffer.from(process.hrtime.bigint().toString());
    const randomness = randomBytes(32);
    const seed = Buffer.from(userSeed || randomBytes(100).toString("hex"));
    const pid = Buffer.from(process.pid.toString());

    return Buffer.concat([timestamp, nanoTime, randomness, seed, pid]);
  }

  private derivePrivateKey(entropy: Buffer): `0x${string}` {
    const key = scryptSync(entropy, "x402-devkit-salt", 32);
    return `0x${key.toString("hex")}` as `0x${string}`;
  }

  private async saveWallet(privateKey: `0x${string}`, account: PrivateKeyAccount, entropy: Buffer): Promise<void> {
    await fs.mkdir(path.dirname(this.walletPath), { recursive: true });

    const password = this.getWalletPassword();
    const encrypted = this.encrypt(privateKey, password);

    const walletData: StoredWallet = {
      address: account.address,
      encryptedPrivateKey: encrypted.encryptedData,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      createdAt: Date.now(),
      entropyHash: createHash("sha256").update(entropy).digest("hex"),
      version: 1,
    };

    await fs.writeFile(this.walletPath, JSON.stringify(walletData, null, 2));
  }

  async loadWallet(): Promise<PrivateKeyAccount | null> {
    try {
      const data = await fs.readFile(this.walletPath, "utf8");
      const wallet: StoredWallet = JSON.parse(data);

      const password = this.getWalletPassword();
      const privateKey = this.decrypt(wallet.encryptedPrivateKey, password, wallet.salt, wallet.iv, wallet.authTag);

      return privateKeyToAccount(privateKey as `0x${string}`);
    } catch {
      return null;
    }
  }

  async walletExists(): Promise<boolean> {
    try {
      await fs.access(this.walletPath);
      return true;
    } catch {
      return false;
    }
  }

  private getWalletPassword(): string {
    return "x402-devkit-dev-password";
  }

  private encrypt(data: string, password: string) {
    const salt = randomBytes(32);
    const key = scryptSync(password, salt, 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv(WALLET_ENCRYPTION_ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted.toString("hex"),
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  private decrypt(encryptedData: string, password: string, saltHex: string, ivHex: string, authTagHex: string): string {
    const salt = Buffer.from(saltHex, "hex");
    const key = scryptSync(password, salt, 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(WALLET_ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, "hex")), decipher.final()]);

    return decrypted.toString("utf8");
  }
}
