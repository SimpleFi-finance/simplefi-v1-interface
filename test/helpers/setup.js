const { ethers } = require("hardhat");

const deployController = async () => {
    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    await controller.deployed();

    return controller;
}

module.exports = {
    deployController
};