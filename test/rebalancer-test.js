const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let dai, aDai, usdc, awMatic;
let aavePool, aaveAdapter, aaveProvider;
let testAccount, testSigner;

let wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
let awMATIC = "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4";
let LENDING_POOL = "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf";
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
    awMatic = await ethers.getContractAt("IERC20", testSigner);
    aavePool = await ethers.getContractAt("ILendingPool", LENDING_POOL, testSigner);
    aaveProvider = await ethers.getContractAt(
      "IProtocolDataProvider",
      "0x7551b5D2763519d4e37e8B81929D336De671d46d",
      testSigner
    );

    // deploy controller
    const Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy();
    await controller.deployed();

    // deploy Aave adapter
    const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
    tempAdapter = await AaveAdapter.deploy(controller.address);
    await tempAdapter.deployed();
    aaveAdapter = await ethers.getContractAt("IAdapter", tempAdapter.address, testSigner);

    // register pool data to controller
    addAaveMarkets();

    // get some funds to test account
    await initBalances(testAccount);
  });

  it("should deposit DAI to Aave pool", async function () {
    expect(await dai.balanceOf(testAccount)).to.equal(toWei("1000"));

    // deposit 1000 DAI
    const daiAmountToInvest = toWei("100");
    await dai.approve(aaveAdapter.address, toWei("1000"));
    await aaveAdapter.invest(
      testAccount,
      [daiAmountToInvest],
      LENDING_POOL,
      testAccount,
      testAccount
    );

    // check balance and position data
    expect(await dai.balanceOf(testAccount)).to.equal(toWei("0"));
    const positionData = await aavePool.getUserAccountData(testAccount);
    assert(positionData.totalCollateralETH > 0);
  });

  it("should withdraw DAI from Aave pool", async function () {
    expect(await dai.balanceOf(testAccount)).to.equal(toWei("0"));
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // withdraw 100 DAI
    const daiAmountToWithdraw = toWei("100");
    await aDai.approve(aaveAdapter.address, daiAmountToWithdraw);
    await aaveAdapter.redeem(
      testAccount,
      [daiAmountToWithdraw, "0", "0", "0", "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount
    );

    expect(await dai.balanceOf(testAccount)).to.equal(daiAmountToWithdraw);
    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.totalCollateralETH > positionDataAfter.totalCollateralETH);
  });

  it("should borrow USDC from Aave pool", async function () {
    expect(await usdc.balanceOf(testAccount)).to.equal(toWei("0"));
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // delegate credit to adapter contract
    const tokenDetails = await aaveProvider.getReserveTokensAddresses(USDC_CONTRACT);
    const variableDebtContract = await ethers.getContractAt(
      "IStableDebtToken",
      tokenDetails.variableDebtTokenAddress,
      testSigner
    );
    const usdcAmount = ethers.utils.parseUnits("200", 6);
    await variableDebtContract.approveDelegation(aaveAdapter.address, usdcAmount);

    // borrow 200 USDC
    await aaveAdapter.borrow(
      testAccount,
      ["0", usdcAmount, "0", "0", "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount
    );

    expect(await usdc.balanceOf(testAccount)).to.equal(usdcAmount);
    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.availableBorrowsETH > positionDataAfter.availableBorrowsETH);
  });

  it("should repay USDC to Aave pool", async function () {
    expect(await usdc.balanceOf(testAccount)).to.equal(ethers.utils.parseUnits("200", 6));
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // repay 50 USDC
    const usdcAmountToRepay = ethers.utils.parseUnits("50", 6);
    await usdc.approve(aaveAdapter.address, usdcAmountToRepay);
    await aaveAdapter.repay(
      testAccount,
      ["0", usdcAmountToRepay, "0", "0", "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount
    );

    expect(await usdc.balanceOf(testAccount)).to.equal(ethers.utils.parseUnits("150", 6));
    const positionDataAfter = await aavePool.getUserAccountData(testAccount);
    assert(positionDataBefore.healthFactor < positionDataAfter.healthFactor);
  });

  it("should deposit ETH/Matic to Aave pool", async function () {
    const maticBalanceBefore = await ethers.provider.getBalance(testAccount);
    const positionDataBefore = await aavePool.getUserAccountData(testAccount);

    // deposit 100 ETH/Matic
    const maticAmountToDeposit = toWei("100");
    await aaveAdapter.invest(
      testAccount,
      ["0", "0", "0", "0", "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount,
      { value: maticAmountToDeposit }
    );

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
      ["0", "0", "0", maticAmountToWithdraw, "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount
    );

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
    await aaveAdapter.borrow(
      testAccount,
      ["0", "0", "0", maticAmountToBorrow, "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount
    );

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
    await aaveAdapter.repay(
      testAccount,
      ["0", "0", "0", maticAmountToRepay, "0", "0"],
      LENDING_POOL,
      testAccount,
      testAccount,
      { value: maticAmountToRepay }
    );

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
  // dai
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon DAI"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon DAI"),
    LENDING_POOL,
    aDAI,
    wMATIC,
    [DAI],
    [wMATIC]
  );

  // usdc
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon USDC"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon USDC"),
    LENDING_POOL,
    aUSDC,
    wMATIC,
    [USDC],
    [wMATIC]
  );

  //usdt
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon USDT"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon USDT"),
    LENDING_POOL,
    aUSDT,
    wMATIC,
    [USDT],
    [wMATIC]
  );

  // wETH
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon wETH"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon wETH"),
    LENDING_POOL,
    awETH,
    wMATIC,
    [wETH],
    [wMATIC]
  );

  // wBTC
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon DAI"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon DAI"),
    LENDING_POOL,
    awBTC,
    wMATIC,
    [wBTC],
    [wMATIC]
  );

  // aave
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Aave Polygon AAVE"),
    aaveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Aave Polygon AAVE"),
    LENDING_POOL,
    aAAVE,
    wMATIC,
    [AAVE],
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
