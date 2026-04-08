import { ethers } from "ethers";

const RPC_URL = "https://sepolia.base.org/";
const USDC_ADDRESS = "0x128Fb6c5229Cad52c2Bf3E8B245aC47EA5d9DB0D";
const WALLETS = {
  "Deployer": "0x55BAd697E56aC772846a98d49b287fC1b324620E",
  "Wallet 1 (Proposer)": "0x7083d904291D855Eaf10B707F4238dFF9f017051",
  "Wallet 2 (Client)": "0x7781d1F167cCA6a37272eead437f0d876d3059E2",
  "Wallet 3 (Evaluator)": "0x08c3e48c9e7bc28b9e4258e282c43618EF7D50E5"
};

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const usdc = new ethers.Contract(USDC_ADDRESS, abi, provider);
  const decimals = await usdc.decimals();

  for (const [name, addr] of Object.entries(WALLETS)) {
    const BaseBal = await provider.getBalance(addr);
    const usdcBal = await usdc.balanceOf(addr);
    console.log(`${name} (${addr}):`);
    console.log(`  Base: ${ethers.formatEther(BaseBal)}`);
    console.log(`  pUSDC: ${ethers.formatUnits(usdcBal, decimals)}`);
  }
}

main().catch(console.error);
