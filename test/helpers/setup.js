const { ethers } = require("hardhat");

const deployController = async () => {
    const Controller = await ethers.getContractFactory("Controller");
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const controller = await Controller.deploy(quickswapRuter);

    await controller.deployed();

    return controller;
}

module.exports = {
    deployController
};