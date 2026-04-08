import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org/";
const USDC_ADDRESS = "0x128Fb6c5229Cad52c2Bf3E8B245aC47EA5d9DB0D";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const WALLETS = [
  "0x7083d904291D855Eaf10B707F4238dFF9f017051", // Wallet 1 (Proposer)
  "0x7781d1F167cCA6a37272eead437f0d876d3059E2", // Wallet 2 (Client)
  "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5"  // Wallet 3 (Evaluator)
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Distributing funds from deployer: ${deployer.address}`);

  const usdcAbi = ["function transfer(address, uint256) returns (bool)", "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, deployer);
  const decimals = await usdc.decimals();

  let nonce = await deployer.getNonce();

  for (let i = 0; i < WALLETS.length; i++) {
    const address = WALLETS[i];

    // Ensure 0.05 Base for gas
    const BaseBalance = await provider.getBalance(address);
    if (BaseBalance < ethers.parseEther("0.05")) {
      const amountNeeded = ethers.parseEther("0.05") - BaseBalance;
      console.log(`Funding ${address} with ${ethers.formatEther(amountNeeded)} Base (Nonce: ${nonce})...`);
      const BaseTx = await deployer.sendTransaction({
        to: address,
        value: amountNeeded,
        nonce: nonce++
      });
      await BaseTx.wait();
    } else {
      console.log(`${address} already has enough Base.`);
    }

    // Ensure 1000 pUSDC
    const usdcBalance = await usdc.balanceOf(address);
    if (usdcBalance < ethers.parseUnits("1000", decimals)) {
      const amountToTransfer = ethers.parseUnits("1000", decimals) - usdcBalance;
      console.log(`Funding ${address} with ${ethers.formatUnits(amountToTransfer, decimals)} pUSDC (Nonce: ${nonce})...`);
      const usdcTx = await usdc.transfer(address, amountToTransfer, { nonce: nonce++ });
      await usdcTx.wait();
    } else {
      console.log(`${address} already has enough pUSDC.`);
    }
  }

  console.log("Distribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
