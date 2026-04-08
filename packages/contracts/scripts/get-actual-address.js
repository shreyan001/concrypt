import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const wallet = new ethers.Wallet(DEPLOYER_KEY);
console.log(`Address: ${wallet.address}`);
