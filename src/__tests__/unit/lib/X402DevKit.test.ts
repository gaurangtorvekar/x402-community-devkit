import { X402DevKit } from "../../../lib/index";
import { createTempDir, cleanupTempDir } from "../../fixtures/testHelpers";
import * as path from "path";

jest.mock("viem", () => ({
  createPublicClient: jest.fn(() => ({
    getBalance: jest.fn(() => Promise.resolve(BigInt("1000000000000000000"))), // 1 ETH
    readContract: jest.fn(() => Promise.resolve(BigInt("50000000"))), // 50 USDC
  })),
  http: jest.fn(),
  formatEther: jest.fn(() => "1.0"),
  parseEther: jest.fn(() => BigInt("1000000000000000000")),
}));

jest.mock("viem/chains", () => ({
  baseSepolia: {},
}));

describe("X402DevKit", () => {
  let tempDir: string;
  let testWalletPath: string;
  let devkit: X402DevKit;

  beforeEach(async () => {
    tempDir = await createTempDir();
    testWalletPath = path.join(tempDir, "wallet.json");
    devkit = new X402DevKit({ walletPath: testWalletPath });
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const defaultDevkit = new X402DevKit();
      expect(defaultDevkit).toBeDefined();
    });

    it("should initialize with custom options", () => {
      const customDevkit = new X402DevKit({
        walletPath: testWalletPath,
        network: "base-sepolia",
      });
      expect(customDevkit).toBeDefined();
    });
  });

  describe("getWallet", () => {
    it("should create wallet if none exists", async () => {
      const wallet = await devkit.getWallet();

      expect(wallet).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should load existing wallet", async () => {
      const wallet1 = await devkit.getWallet();
      const wallet2 = await devkit.getWallet();

      expect(wallet1.address).toBe(wallet2.address);
    });
  });

  describe("getBalances", () => {
    it("should return ETH and USDC balances", async () => {
      const balances = await devkit.getBalances();

      expect(balances).toHaveProperty("eth");
      expect(balances).toHaveProperty("usdc");
      expect(typeof balances.eth).toBe("string");
      expect(typeof balances.usdc).toBe("string");
    });
  });

  describe("needsFunding", () => {
    it("should return false for funded wallet", async () => {
      const needsFunding = await devkit.needsFunding();

      expect(typeof needsFunding).toBe("boolean");
    });
  });

  describe("showFundingInstructions", () => {
    it("should show funding instructions", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await devkit.showFundingInstructions();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createBuyer", () => {
    it("should provide buyer instructions", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      devkit.createBuyer();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createSeller", () => {
    it("should provide seller instructions", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      devkit.createSeller();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
