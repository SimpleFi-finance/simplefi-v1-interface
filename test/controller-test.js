const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployController } = require("./helpers/setup");

let controller, signer1, account1;

describe("Controller", function () {
  before(async () => {
    // account used for all the tests
    [signer1] = await ethers.getSigners();
    account1 = signer1.address;

    // setup
    controller = await deployController();
  });

  it("should add adapter", async function () {
    const name = ethers.utils.formatBytes32String("Sample Protocol");
    const adapter = ethers.utils.getAddress("0x5fbdb2315678afecb367f032d93f642f64180aa3");
    await controller.addProtocolAdapter(name, adapter);

    // Check for correct values
    const returnAdapter = await controller.protocolAdapterAddress(name);
    expect(returnAdapter).to.equal(adapter);
  });

  it("should add market", async function () {
    
  });
});