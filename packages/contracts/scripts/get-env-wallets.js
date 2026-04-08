import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const keys = [
  process.env.WALLET_1_PRIVATE_KEY,
  process.env.WALLET_2_PRIVATE_KEY,
  process.env.WALLET_3_PRIVATE_KEY,
];

keys.forEach((key, i) => {
  if (key) {
    const wallet = new ethers.Wallet(key);
    console.log(`Wallet ${i+1}: ${wallet.address}`);
  } else {
    console.log(`Wallet ${i+1} NOT FOUND`);
  }
});
