import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { X402DevKit } from "../../lib/index";
import { NETWORKS } from "../../lib/config/constants";

export const fundCommand = new Command("fund").description("Show funding instructions and check balances").action(async () => {
  const spinner = ora();

  try {
    const devkit = new X402DevKit();

    spinner.start("Checking wallet...");

    const wallet = await devkit.getWallet();

    spinner.text = "Fetching balances...";

    const balances = await devkit.getBalances();

    spinner.succeed(chalk.green("Wallet status checked!"));

    console.log(chalk.cyan("\n💳 Wallet Information\n"));
    console.log(chalk.white("Address:"), chalk.green(wallet.address));
    console.log(chalk.white("Network:"), chalk.yellow("Base Sepolia"));

    console.log(chalk.cyan("\n💰 Current Balances\n"));
    console.log(chalk.white("ETH:"), chalk.yellow(balances.eth + " ETH"));
    console.log(chalk.white("USDC:"), chalk.yellow(balances.usdc + " USDC"));

    const needsFunding = await devkit.needsFunding();

    if (needsFunding) {
      const minEth = NETWORKS["base-sepolia"].minEthBalance;
      const minUsdc = NETWORKS["base-sepolia"].minUsdcBalance;

      console.log(chalk.red("\n⚠️  Wallet needs funding!"));
      console.log(chalk.gray(`You need at least ${minEth} ETH and ${minUsdc} USDC to use x402.\n`));

      await devkit.showFundingInstructions();
    } else {
      console.log(chalk.green("\n✅ Wallet is funded and ready to use!"));
      console.log(chalk.gray("\nYou can start making x402 payments and receiving funds.\n"));
    }
  } catch (error) {
    spinner.fail(chalk.red("Failed to check wallet status"));
    console.error(error);
    process.exit(1);
  }
});
