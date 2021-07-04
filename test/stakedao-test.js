const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let controller, stakeDaoAdapter, stakeDaoLpPool;
let testAccount, testSigner;

const STAKE_DAO_LP = "0x7d60F21072b585351dFd5E8b17109458D97ec120";
const STAKE_DAO_YIELD_FARM = "0x68456B298c230415E2DE7aD4897A79Ee3f1A965a";
const STAKE_DAO_TOKEN = "0x361a5a4993493ce00f61c32d4ecca5512b82ce90";

const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

describe("StakeDaoAdapter", function () {
  before(async () => {
    // account used for all the tests
    [testSigner] = await ethers.getSigners();
    testAccount = testSigner.address;

    // get contracts
    stakeDaoLpPool = await ethers.getContractAt("IStakeDaoLpPool", STAKE_DAO_LP, testSigner);
    curveLpToken = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN, testSigner);

    // deploy controller
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy(quickswapRuter, wMATIC);
    await controller.deployed();

    // deploy Stake Dao adapter
    const StakeDaoAdapter = await ethers.getContractFactory("StakeDaoAdapter");
    tempAdapter = await StakeDaoAdapter.deploy(controller.address);
    await tempAdapter.deployed();
    stakeDaoAdapter = await ethers.getContractAt("IAdapter", tempAdapter.address, testSigner);

    // add adapter and market data
    await controller.addProtocolAdapter(
      ethers.utils.formatBytes32String("Stake Dao pool"),
      stakeDaoAdapter.address
    );
    await controller.addMarket(
      ethers.utils.formatBytes32String("Stake Dao pool"),
      STAKE_DAO_LP,
      STAKE_DAO_LP,
      STAKE_DAO_LP,
      wMATIC,
      [CURVE_AAVE_LP_TOKEN],
      [STAKE_DAO_TOKEN]
    );

    // // get some funds to test account
    await initBalances(testAccount);
  });

  it("should stake am3Crv to Stake Dao Polygon pool", async function () {
    const tokenAddress = await stakeDaoLpPool.token();
    const am3Crv = await ethers.getContractAt("IERC20", tokenAddress, testSigner);
    const sdam3Crv = await ethers.getContractAt("IERC20", stakeDaoLpPool.address, testSigner);

    const am3CrvBalanceBefore = await am3Crv.balanceOf(testAccount);
    const sdam3CrvBalanceBefore = await sdam3Crv.balanceOf(testAccount);

    // approve am3Crv and stake
    await am3Crv.approve(stakeDaoAdapter.address, am3CrvBalanceBefore);
    await stakeDaoAdapter.invest(
      testAccount,
      [am3CrvBalanceBefore],
      STAKE_DAO_LP,
      testAccount,
      testAccount
    );

    // check am3Crv is gone from balance, and LP token is aquired
    const am3CrvBalanceAfter = await am3Crv.balanceOf(testAccount);
    const sdam3CrvBalanceAfter = await sdam3Crv.balanceOf(testAccount);

    assert(am3CrvBalanceBefore > am3CrvBalanceAfter);
    assert(sdam3CrvBalanceBefore < sdam3CrvBalanceAfter);
  });

  it("should unstake am3Crv from Stake Dao Polygon pool", async function () {
    const tokenAddress = await stakeDaoLpPool.token();
    const am3Crv = await ethers.getContractAt("IERC20", tokenAddress, testSigner);
    const sdam3Crv = await ethers.getContractAt("IERC20", stakeDaoLpPool.address, testSigner);

    const am3CrvBalanceBefore = await am3Crv.balanceOf(testAccount);
    const sdam3CrvBalanceBefore = await sdam3Crv.balanceOf(testAccount);

    // approve LP token for burning and unstake
    const sdam3CrvToUnstake = sdam3CrvBalanceBefore / 2;
    await sdam3Crv.approve(stakeDaoAdapter.address, sdam3CrvToUnstake);
    await stakeDaoAdapter.redeem(
      testAccount,
      [sdam3CrvToUnstake],
      STAKE_DAO_LP,
      testAccount,
      testAccount
    );

    // approve LP token for burning and unstake
    const am3CrvBalanceAfter = await am3Crv.balanceOf(testAccount);
    const sdam3CrvBalanceAfter = await sdam3Crv.balanceOf(testAccount);

    assert(am3CrvBalanceBefore < am3CrvBalanceAfter);
    assert(sdam3CrvBalanceBefore > sdam3CrvBalanceAfter);
  });
});

/**
 * Transfer some stablecoins to test account
 */
async function initBalances(testAccount) {
  const accountWithFunds = "0x0172e05392aba65366c4dbbb70d958bbf43304e4";

  // move 1000 am3CRV from impersonated account to test account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [accountWithFunds],
  });

  const signer = await ethers.provider.getSigner(accountWithFunds);
  await curveLpToken.connect(signer).transfer(testAccount, toWei("500"));

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [accountWithFunds],
  });
}

/**
 * Format to ETH
 */
function toEther(amountInWei) {
  return ethers.utils.formatEther(amountInWei.toString());
}

/**
 * Format to WEI
 */
function toWei(amountInEth) {
  return ethers.utils.parseEther(amountInEth);
}
