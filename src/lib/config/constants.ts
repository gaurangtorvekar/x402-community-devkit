export const NETWORKS = {
  "base-sepolia": {
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    minEthBalance: "0.01",
    minUsdcBalance: "0.1",
    explorer: "https://sepolia.basescan.org",
  },
} as const;

export const FAUCET_LINKS = {
  "base-sepolia": {
    eth: [
      { name: "Chainlink Faucet", url: "https://faucets.chain.link/sepolia" },
      { name: "Alchemy Faucet", url: "https://www.alchemy.com/faucets/base-sepolia" },
      { name: "QuickNode Faucet", url: "https://faucet.quicknode.com/base/sepolia" },
      { name: "Circle USDC Faucet", url: "https://faucet.circle.com/" },
    ],
    usdc: [{ name: "Circle USDC Faucet", url: "https://faucet.circle.com/" }],
  },
} as const;

export const WALLET_FILE = ".x402/wallet.json";
export const WALLET_ENCRYPTION_ALGORITHM = "aes-256-gcm";

export type NetworkType = keyof typeof NETWORKS;
