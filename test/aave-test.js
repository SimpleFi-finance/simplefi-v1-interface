const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let dai, aDai, usdc;
let aavePool, aaveAdapter, aaveProvider;
let testAccount, testSigner;

const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const awMATIC = "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4";
const LENDING_POOL = "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf";
const DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
const aDAI = "0x27F8D03b3a2196956ED754baDc28D73be8830A6e";
const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const aUSDC = "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F";
const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const aUSDT = "0x60D55F02A771d515e077c9C2403a1ef324885CeC";
const wETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const awETH = "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390";
const wBTC = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6";
const awBTC = "0x5c2ed810328349100A66B82b78a1791B101C9D61";
const AAVE = "0xD6DF932A45C0f255f85145f286eA0b292B21C90B";
const aAAVE = "0x1d2a0E5EC8E5bBDCA5CB219e649B565d8e5c3360";

describe("AaveAdapter", function () {
  before(async () => {
    // account used for all the tests
    [testSigner] = await ethers.getSigners();
    testAccount = testSigner.address;

    // get contracts
    dai = await ethers.getContractAt("IERC20", DAI, testSigner);
    aDai = await ethers.getContractAt("IERC20", aDAI, testSigner);
    usdc = await ethers.getContractAt("IERC20", USDC, testSigner);
    awMatic = await ethers.getContractAt("IERC20", awMATIC, testSigner);
    aavePool = await ethers.getContractAt("ILendingPool", LENDING_POOL, testSigner);
    aaveProvider = await ethers.getContractAt(
      "IProtocolDataProvider",
      "0x7551b5D2763519d4e37e8B81929D336De671d46d",
      testSigner
    );

    // deploy controller
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy(quickswapRuter, wMATIC);
    await controller.deployed();

    // deploy Aave adapter
    const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
    tempAdapter = await AaveAdapter.deploy(controller.address);
    await tempAdapter.deployed();
    aaveAdapter = await ethers.getContractAt("IAdapter", tempAdapter.address, testSigner);

    // register pool data to controller
    await addAaveMarkets();

    // get some funds to test account
    await initBalances(testAccount);
  });

  it("should deposit DAI to Aave pool", async function () {
    const daiBalanceBefore = await dai.balanceOf(testAccount);

    // deposit 1000 DAI
    const daiAmountToInvest = toWei("1000");
    await dai.approve(aaveAdapter.address, daiAmountToInvest);
    await aaveAdapter.invest(testAccount, [daiAmountToInvest], aDAI, testAccount, testAccount);

    // check balance and position data
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceBefore.sub(daiBalanceAfter)).to.equal(daiAmountToInvest);

    const positionData = await aavePool.getUserAccountData(testAccount);
    assert(positionData.totalCollateralETH > 0);
  });

  it("should withdraw DAI from Aave pool", async function () {
    const daiBalanceBefore = await dai.balanceOf(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // withdraw 100 DAI
    const daiAmountToWithdraw = toWei("100");
    await aDai.approve(aaveAdapter.address, daiAmountToWithdraw);
    await aaveAdapter.redeem(testAccount, [daiAmountToWithdraw], aDAI, testAccount, testAccount);

    // check balance and position data
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceAfter.sub(daiBalanceBefore)).to.equal(daiAmountToWithdraw);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.totalCollateralETH > positionDataAfter.totalCollateralETH);
  });

  it("should borrow USDC from Aave pool", async function () {
    const usdcBalanceBefore = await usdc.balanceOf(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // delegate credit to adapter contract
    const tokenDetails = await aaveProvider.getReserveTokensAddresses(USDC);
    const variableDebtContract = await ethers.getContractAt(
      "IStableDebtToken",
      tokenDetails.variableDebtTokenAddress,
      testSigner
    );
    const usdcAmount = ethers.utils.parseUnits("200", 6);
    await variableDebtContract.approveDelegation(aaveAdapter.address, usdcAmount);

    // borrow 200 USDC
    await aaveAdapter.borrow(testAccount, [usdcAmount], aUSDC, testAccount, testAccount);

    // check balance and position data
    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceAfter.sub(usdcBalanceBefore)).to.equal(usdcAmount);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.availableBorrowsETH > positionDataAfter.availableBorrowsETH);
  });

  it("should repay USDC to Aave pool", async function () {
    const usdcBalanceBefore = await usdc.balanceOf(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // repay 50 USDC
    const usdcAmountToRepay = ethers.utils.parseUnits("50", 6);
    await usdc.approve(aaveAdapter.address, usdcAmountToRepay);
    await aaveAdapter.repay(testAccount, [usdcAmountToRepay], aUSDC, testAccount, testAccount);

    // check balance and position data
    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceBefore.sub(usdcBalanceAfter)).to.equal(usdcAmountToRepay);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor < positionDataAfter.healthFactor);
  });

  it("should deposit ETH/Matic to Aave pool", async function () {
    const maticBalanceBefore = await ethers.provider.getBalance(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // deposit 100 ETH/Matic
    const maticAmountToDeposit = toWei("100");
    await aaveAdapter.invest(testAccount, [], awMATIC, testAccount, testAccount, {
      value: maticAmountToDeposit,
    });

    // check balance and position data
    const maticBalanceAfter = await ethers.provider.getBalance(testAccount);
    assert(maticBalanceBefore > maticBalanceAfter);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor < positionDataAfter.healthFactor);
    assert(positionDataBefore.totalCollateralETH < positionDataAfter.totalCollateralETH);
  });

  it("should withdraw ETH/Matic from Aave pool", async function () {
    const maticBalanceBefore = await ethers.provider.getBalance(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // withdraw 30 ETH/Matic
    const maticAmountToWithdraw = toWei("30");
    await awMatic.approve(aaveAdapter.address, maticAmountToWithdraw);
    await aaveAdapter.redeem(
      testAccount,
      [maticAmountToWithdraw],
      awMATIC,
      testAccount,
      testAccount
    );

    // check balance and position data
    const maticBalanceAfter = await ethers.provider.getBalance(testAccount);
    assert(maticBalanceBefore < maticBalanceAfter);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor > positionDataAfter.healthFactor);
    assert(positionDataBefore.totalCollateralETH > positionDataAfter.totalCollateralETH);
  });

  it("should borrow ETH/Matic from Aave pool", async function () {
    const maticBalanceBefore = await ethers.provider.getBalance(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // delegate credit to adapter contract
    const maticAmountToBorrow = toWei("20");
    const tokenDetails = await aaveProvider.getReserveTokensAddresses(wMATIC);
    const variableDebtContract = await ethers.getContractAt(
      "IStableDebtToken",
      tokenDetails.variableDebtTokenAddress,
      testSigner
    );
    await variableDebtContract.approveDelegation(aaveAdapter.address, maticAmountToBorrow);

    // borrow 20 MATIC
    await aaveAdapter.borrow(testAccount, [maticAmountToBorrow], awMATIC, testAccount, testAccount);

    // check balance and position data
    const maticBalanceAfter = await ethers.provider.getBalance(testAccount);
    assert(maticBalanceBefore < maticBalanceAfter);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor > positionDataAfter.healthFactor);
    assert(positionDataBefore.availableBorrowsETH > positionDataAfter.availableBorrowsETH);
  });

  it("should repay ETH/Matic to Aave pool", async function () {
    const maticBalanceBefore = await ethers.provider.getBalance(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // repay 15 ETH/Matic
    const maticAmountToRepay = toWei("15");
    await aaveAdapter.repay(testAccount, [maticAmountToRepay], awMATIC, testAccount, testAccount, {
      value: maticAmountToRepay,
    });

    // check balance and position data
    const maticBalanceAfter = await ethers.provider.getBalance(testAccount);
    assert(maticBalanceBefore > maticBalanceAfter);

    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor < positionDataAfter.healthFactor);
    assert(positionDataBefore.availableBorrowsETH < positionDataAfter.availableBorrowsETH);
  });
});

/**
 * Transfer some DAI to test account
 */
async function initBalances(testAccount) {
  const accountWithFunds = "0xE2E26BAc2ff37A7aE219EcEF74C5A1Bf95d5f854";

  // move 1000 DAI from impersonated account to test account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [accountWithFunds],
  });
  const signer = await ethers.provider.getSigner(accountWithFunds);
  await dai.connect(signer).transfer(testAccount, toWei("1000"));

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [accountWithFunds],
  });
}

/**
 * Add adapter and pool data
 */
async function addAaveMarkets() {
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    aaveAdapter.address
  );

  // dai
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    aDAI,
    LENDING_POOL,
    aDAI,
    wMATIC,
    [DAI],
    [wMATIC]
  );

  // usdc
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    aUSDC,
    LENDING_POOL,
    aUSDC,
    wMATIC,
    [USDC],
    [wMATIC]
  );

  // usdt
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    aUSDT,
    LENDING_POOL,
    aUSDT,
    wMATIC,
    [USDT],
    [wMATIC]
  );

  // weth
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    awETH,
    LENDING_POOL,
    awETH,
    wMATIC,
    [wETH],
    [wMATIC]
  );

  // wbtc
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    awBTC,
    LENDING_POOL,
    awBTC,
    wMATIC,
    [wBTC],
    [wMATIC]
  );

  // aave
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    aAAVE,
    LENDING_POOL,
    aAAVE,
    wMATIC,
    [AAVE],
    [wMATIC]
  );

  // wmatic
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon pool"),
    awMATIC,
    LENDING_POOL,
    awMATIC,
    wMATIC,
    [wMATIC],
    [wMATIC]
  );
}

/**
 * Aave position overview
 */
async function printAavePosition(address) {
  const positionData = await aavePool.getUserAccountData(testAccount);

  console.log("Aave position of " + address);
  console.log("totalCollateralETH: ", toEther(positionData.totalCollateralETH));
  console.log("availableBorrowsETH: ", toEther(positionData.availableBorrowsETH));
  console.log("currentLiquidationThreshold: ", toEther(positionData.currentLiquidationThreshold));
  console.log("ltv:", toEther(positionData.ltv));
  if (
    positionData.healthFactor._hex ==
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  ) {
    console.log("healthFactor: NA ");
  } else {
    console.log("healthFactor:", toEther(positionData.healthFactor));
  }
  console.log("");
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
