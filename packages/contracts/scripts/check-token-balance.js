import { ethers } from "ethers";

const RPC_URL = "https://sepolia.base.org/";
const DEPLOYER_ADDRESS = "0x55BAd697E56aC772846a98d49b287fC1b324620E";
const USDC_ADDRESS = "0xb48F841bC8a3B1E148373F2B6436e50A151ABbf7";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const contract = new ethers.Contract(USDC_ADDRESS, abi, provider);

  const balance = await contract.balanceOf(DEPLOYER_ADDRESS);
  const decimals = await contract.decimals();
  console.log(`Deployer Balance: ${ethers.formatUnits(balance, decimals)} units`);
}

main().catch(console.error);
