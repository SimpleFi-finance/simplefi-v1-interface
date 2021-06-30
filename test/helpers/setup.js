const { ethers } = require("hardhat");

const deployController = async () => {
    const Controller = await ethers.getContractFactory("Controller");
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const quickswapWETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    const controller = await Controller.deploy(quickswapRuter, quickswapWETH);

    await controller.deployed();

    return controller;
}

module.exports = {
    deployController
};