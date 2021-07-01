require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const INFURA_API_KEY = process.env.INFURA_API_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        blockNumber: 15937268,
      },
    },
  },
  solidity: {
    version: "0.8.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 600000,
  },
};
