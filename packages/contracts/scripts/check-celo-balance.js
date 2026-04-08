import { ethers } from "ethers";

const RPC_URL = "https://alfajores-forno.Base-testnet.org";
const DEPLOYER_ADDRESS = "0x55BAd697E56aC772846a98d49b287fC1b324620E";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const balance = await provider.getBalance(DEPLOYER_ADDRESS);
  console.log(`Base Balance on Alfajores: ${ethers.formatEther(balance)} Base`);
}

main().catch(console.error);
