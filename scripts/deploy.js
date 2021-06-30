// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Controller = await hre.ethers.getContractFactory("Controller");
  const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const quickswapWETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  const controller = await Controller.deploy(quickswapRuter, quickswapWETH);

  await controller.deployed();

  console.log("Controller deployed to:", controller.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });