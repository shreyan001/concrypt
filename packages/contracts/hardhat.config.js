require("@nomicfoundation/hardhat-toolbox-viem");
require("dotenv").config();
require("fhenix-hardhat-plugin");
require("fhenix-hardhat-network");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    BaseSepolia: {
      url: "https://sepolia.base.org/",
      chainId: 11142220,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
  },
};
