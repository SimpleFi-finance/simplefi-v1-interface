const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let controller, curveAdapter, curveLpToken;
let curveGaugeToken, curveGaugeAdapter;
let dai, usdc, usdt;
let testAccount, testSigner;

const CURVE_aPOOL_CONTRACT = "0x445FE580eF8d70FF569aB36e80c647af338db351";
const DAI_CONTRACT = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
const USDC_CONTRACT = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const USDT_CONTRACT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
const CURVE_GAUGE = "0x19793B454D3AfC7b454F206Ffe95aDE26cA6912c";
const wMATIC_CONTRACT = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const CRV_CONTRACT = "0x172370d5cd63279efa6d502dab29171933a610af";

describe("CurveAdapter", function () {
  before(async () => {
    // account used for all the tests
    [testSigner] = await ethers.getSigners();
    testAccount = testSigner.address;

    // get contracts
    aaveCurvePolygonPool = await ethers.getContractAt(
      "ICurveDeposit",
      CURVE_aPOOL_CONTRACT,
      testSigner
    );
    dai = await ethers.getContractAt("IERC20", DAI_CONTRACT, testSigner);
    usdc = await ethers.getContractAt("IERC20", USDC_CONTRACT, testSigner);
    usdt = await ethers.getContractAt("IERC20", USDT_CONTRACT, testSigner);
    wMatic = await ethers.getContractAt("IERC20", wMATIC_CONTRACT, testSigner);
    crv = await ethers.getContractAt("IERC20", CRV_CONTRACT, testSigner);
    curveLpToken = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN, testSigner);
    curveGaugeToken = await ethers.getContractAt("ICurveGauge", CURVE_GAUGE, testSigner);

    // deploy controller
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy(quickswapRuter, wMATIC_CONTRACT);
    await controller.deployed();

    // deploy Curve adapter
    const CurveAdapter = await ethers.getContractFactory("CurveAdapter");
    tempAdapter = await CurveAdapter.deploy(controller.address);
    await tempAdapter.deployed();
    curveAdapter = await ethers.getContractAt("IAdapter", tempAdapter.address, testSigner);

    // add adapter and market data
    await controller.addProtocolAdapter(
      ethers.utils.formatBytes32String("Curve AAVE pool"),
      curveAdapter.address
    );
    await controller.addMarket(
      ethers.utils.formatBytes32String("Curve AAVE pool"),
      CURVE_aPOOL_CONTRACT,
      CURVE_aPOOL_CONTRACT,
      CURVE_AAVE_LP_TOKEN,
      wMATIC_CONTRACT,
      [DAI_CONTRACT, USDC_CONTRACT, USDT_CONTRACT],
      [wMATIC_CONTRACT, CRV_CONTRACT]
    );

    // get some funds to test account
    await initBalances(testAccount);
  });

  it("should deposit stablecoins to Curve's Aave pool", async function () {
    const daiBalanceBefore = await dai.balanceOf(testAccount);
    const usdcBalanceBefore = await usdc.balanceOf(testAccount);
    const usdtBalanceBefore = await usdt.balanceOf(testAccount);
    const lpTokensBefore = await curveLpToken.balanceOf(testAccount);

    // deposit 100 DAI+USDC+USDT
    await dai.approve(curveAdapter.address, toWei("100"));
    await usdc.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));
    await usdt.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));

    await curveAdapter
      .connect(testSigner)
      .invest(
        testAccount,
        [toWei("100"), ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("100", 6)],
        CURVE_aPOOL_CONTRACT,
        testAccount,
        testAccount
      );

    // check balances are correctly updated
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceBefore.sub(daiBalanceAfter)).to.equal(toWei("100"));

    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceBefore.sub(usdcBalanceAfter)).to.equal(ethers.utils.parseUnits("100", 6));

    const usdtBalanceAfter = await usdt.balanceOf(testAccount);
    expect(usdtBalanceBefore.sub(usdtBalanceAfter)).to.equal(ethers.utils.parseUnits("100", 6));

    const lpTokensAfter = await curveLpToken.balanceOf(testAccount);
    assert(lpTokensBefore < lpTokensAfter);
  });

  it("should remove part of liquidity from Curve's Aave pool", async function () {
    const daiBalanceBefore = await dai.balanceOf(testAccount);
    const usdcBalanceBefore = await usdc.balanceOf(testAccount);
    const usdtBalanceBefore = await usdt.balanceOf(testAccount);
    const lpTokensBefore = await curveLpToken.balanceOf(testAccount);

    // time travel to compund rewards
    await network.provider.send("evm_increaseTime", [3600 * 24 * 100]);
    await network.provider.send("evm_mine");

    // remove 70 DAI, 60 USDC and 55 USDT from pool
    await curveLpToken.approve(curveAdapter.address, lpTokensBefore);
    await curveAdapter
      .connect(testSigner)
      .redeem(
        testAccount,
        [toWei("70"), ethers.utils.parseUnits("60", 6), ethers.utils.parseUnits("55", 6)],
        CURVE_aPOOL_CONTRACT,
        testAccount,
        testAccount
      );

    // check balances are correctly updated
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceAfter.sub(daiBalanceBefore)).to.equal(toWei("70"));

    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceAfter.sub(usdcBalanceBefore)).to.equal(ethers.utils.parseUnits("60", 6));

    const usdtBalanceAfter = await usdt.balanceOf(testAccount);
    expect(usdtBalanceAfter.sub(usdtBalanceBefore)).to.equal(ethers.utils.parseUnits("55", 6));

    const lpTokensAfter = await curveLpToken.balanceOf(testAccount);
    assert(lpTokensBefore > lpTokensAfter);
  });

  it("should stake LP tokens to Curve Gauge", async function () {
    await initCurveGauge();

    const lpTokenBalanceBefore = await curveLpToken.balanceOf(testAccount);
    const gaugeTokenBalanceBefore = await curveGaugeToken.balanceOf(testAccount);

    // approve LP token to be moved to adapter
    await curveLpToken.approve(curveGaugeAdapter.address, lpTokenBalanceBefore);

    // deposit to gauge
    await curveGaugeAdapter.invest(
      testAccount,
      [lpTokenBalanceBefore],
      CURVE_GAUGE,
      testAccount,
      testAccount
    );

    // check balances
    const lpTokenBalanceAfter = await curveLpToken.balanceOf(testAccount);
    const gaugeTokenBalanceAfter = await curveGaugeToken.balanceOf(testAccount);

    assert(lpTokenBalanceBefore > lpTokenBalanceAfter);
    assert(gaugeTokenBalanceBefore < gaugeTokenBalanceAfter);
  });

  it("should unstake LP tokens from Curve Gauge", async function () {
    const lpTokenBalanceBefore = await curveLpToken.balanceOf(testAccount);
    const gaugeTokenBalanceBefore = await curveGaugeToken.balanceOf(testAccount);

    // reward tokens
    const wMaticBalanceBefore = await wMatic.balanceOf(testAccount);
    const crvBalanceBefore = await crv.balanceOf(testAccount);

    // time travel to compund rewards
    await network.provider.send("evm_increaseTime", [3600 * 24 * 5]);
    await network.provider.send("evm_mine");

    // approve LP token to be moved to adapter
    await curveGaugeToken.approve(curveGaugeAdapter.address, gaugeTokenBalanceBefore);

    // withdraw from gauge
    await curveGaugeAdapter.redeem(
      testAccount,
      [gaugeTokenBalanceBefore],
      CURVE_GAUGE,
      testAccount,
      testAccount
    );

    // check balances
    const lpTokenBalanceAfter = await curveLpToken.balanceOf(testAccount);
    const gaugeTokenBalanceAfter = await curveGaugeToken.balanceOf(testAccount);

    assert(lpTokenBalanceBefore < lpTokenBalanceAfter);
    assert(gaugeTokenBalanceBefore > gaugeTokenBalanceAfter);

    // reward tokens
    // so far couldn't simulate accrual of rewards in local polygon fork
    const wMaticBalanceAfter = await wMatic.balanceOf(testAccount);
    const crvBalanceAfter = await crv.balanceOf(testAccount);
    // assert(wMaticBalanceBefore < wMaticBalanceAfter);
    // assert(crvBalanceBefore < crvBalanceAfter);
  });
});

/**
 * Transfer some stablecoins to test account
 */
async function initBalances(testAccount) {
  const accountWithFunds = "0xE2E26BAc2ff37A7aE219EcEF74C5A1Bf95d5f854";

  // move 1000 DAI+USDC+USDT from impersonated account to test account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [accountWithFunds],
  });
  const signer = await ethers.provider.getSigner(accountWithFunds);

  dai = await ethers.getContractAt("IERC20", DAI_CONTRACT, testSigner);
  await dai.connect(signer).transfer(testAccount, toWei("1000"));

  usdc = await ethers.getContractAt("IERC20", USDC_CONTRACT, testSigner);
  await usdc.connect(signer).transfer(testAccount, ethers.utils.parseUnits("1000", 6));

  usdt = await ethers.getContractAt("IERC20", USDT_CONTRACT, testSigner);
  await usdt.connect(signer).transfer(testAccount, ethers.utils.parseUnits("1000", 6));

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [accountWithFunds],
  });
}

/**
 * Deploy and register Curve Gauge adapter
 */
async function initCurveGauge() {
  // deploy Curve Gauge adapter
  const CurveGaugeAdapter = await ethers.getContractFactory("CurveGaugeAdapter");
  tempAdapter = await CurveGaugeAdapter.deploy(controller.address);
  await tempAdapter.deployed();
  curveGaugeAdapter = await ethers.getContractAt("IAdapter", tempAdapter.address, testSigner);

  // add adapter and market data
  await controller.addProtocolAdapter(
    ethers.utils.formatBytes32String("Curve Gauge"),
    curveAdapter.address
  );
  await controller.addMarket(
    ethers.utils.formatBytes32String("Curve Gauge"),
    CURVE_GAUGE,
    CURVE_GAUGE,
    CURVE_GAUGE,
    wMATIC_CONTRACT,
    [CURVE_AAVE_LP_TOKEN],
    [wMATIC_CONTRACT, CRV_CONTRACT]
  );
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
