const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let dai, aDai, usdc, awMatic;
let aavePool, aaveAdapter, aaveProvider;
let testAccount, testSigner;

let DAI_CONTRACT = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
let ADAI_CONTRACT = "0x27F8D03b3a2196956ED754baDc28D73be8830A6e";
let wMATIC_CONTRACT = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
let awMATIC_CONTRACT = "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4";
let LENDING_POOL = "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf";
let USDC_CONTRACT = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

describe("AaveAdapter", function () {
  before(async () => {
    // account used for all the tests
    [testSigner] = await ethers.getSigners();
    testAccount = testSigner.address;

    // get contracts
    dai = await ethers.getContractAt("IERC20", DAI_CONTRACT, testSigner);
    aDai = await ethers.getContractAt("IERC20", ADAI_CONTRACT, testSigner);
    usdc = await ethers.getContractAt("IERC20", USDC_CONTRACT, testSigner);
    awMatic = await ethers.getContractAt("IERC20", awMATIC_CONTRACT, testSigner);
    aavePool = await ethers.getContractAt("ILendingPool", LENDING_POOL, testSigner);
    aaveProvider = await ethers.getContractAt(
      "IProtocolDataProvider",
      "0x7551b5D2763519d4e37e8B81929D336De671d46d",
      testSigner
    );

    // deploy Aave adapter
    const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
    aaveAdapter = await AaveAdapter.deploy();
    await aaveAdapter.deployed();

    // get some funds to test account
    await initBalances(testAccount);
  });

  it("should deposit DAI to Aave pool", async function () {
    expect(await dai.balanceOf(testAccount)).to.equal(toWei("1000"));

    // deposit 1000 DAI
    await dai.approve(aaveAdapter.address, toWei("1000"));
    await aaveAdapter.invest(testAccount, [DAI_CONTRACT], [toWei("1000")], LENDING_POOL, 255);

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
      ADAI_CONTRACT,
      [DAI_CONTRACT],
      [daiAmountToWithdraw],
      LENDING_POOL,
      255
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
    await aaveAdapter.borrow(testAccount, [USDC_CONTRACT], [usdcAmount], LENDING_POOL, 255);

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
    await aaveAdapter.repay(testAccount, [USDC_CONTRACT], [usdcAmountToRepay], LENDING_POOL, 255);

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
      ["0x0000000000000000000000000000000000000000"],
      [maticAmountToDeposit],
      LENDING_POOL,
      0,
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
      awMATIC_CONTRACT,
      ["0x0000000000000000000000000000000000000000"],
      [maticAmountToWithdraw],
      LENDING_POOL,
      0
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
    const tokenDetails = await aaveProvider.getReserveTokensAddresses(wMATIC_CONTRACT);
    const variableDebtContract = await ethers.getContractAt(
      "IStableDebtToken",
      tokenDetails.variableDebtTokenAddress,
      testSigner
    );
    await variableDebtContract.approveDelegation(aaveAdapter.address, maticAmountToBorrow);

    // borrow 20 MATIC
    await aaveAdapter.borrow(
      testAccount,
      ["0x0000000000000000000000000000000000000000"],
      [maticAmountToBorrow],
      LENDING_POOL,
      0
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
      ["0x0000000000000000000000000000000000000000"],
      [maticAmountToRepay],
      LENDING_POOL,
      0,
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
