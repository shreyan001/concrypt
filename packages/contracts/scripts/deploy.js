import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RPC_URL = "https://sepolia.base.org/";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const USDC_ADDRESS = "0x128Fb6c5229Cad52c2Bf3E8B245aC47EA5d9DB0D";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Deploying AtomicHandover from: ${wallet.address}`);

  const artifactPath = "./artifacts/contracts/AtomicHandover.sol/AtomicHandover.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const contract = await factory.deploy(USDC_ADDRESS);

  console.log(`Waiting for deployment... Hash: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`AtomicHandover deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
