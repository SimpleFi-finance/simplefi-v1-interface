const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let controller, curveAdapter, curve_aave_gauge;
let dai, usdc, usdt, wMatic, crv;
let testAccount, testSigner;

const CURVE_aPOOL_CONTRACT = "0x445FE580eF8d70FF569aB36e80c647af338db351";
const DAI_CONTRACT = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
const USDC_CONTRACT = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const USDT_CONTRACT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
const AAVE_GAUGE = "0xe381C25de995d62b453aF8B931aAc84fcCaa7A62";
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
    curve_aave_gauge = await ethers.getContractAt("ICurveGauge", AAVE_GAUGE, testSigner);

    // deploy controller
    const Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy();
    await controller.deployed();

    // deploy Curve adapter
    const IAdapter = await ethers.getContractFactory("CurveAdapter");
    curveAdapter = await IAdapter.deploy(controller.address);
    await curveAdapter.deployed();

    // add adapter and market data
    await controller.addProtocolAdapter(
      ethers.utils.formatBytes32String("Curve AAVE pool"),
      curveAdapter.address
    );
    await controller.addMarket(
      ethers.utils.formatBytes32String("Curve AAVE pool"),
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
    const gaugeTokensBefore = await curve_aave_gauge.balanceOf(testAccount);

    // deposit 100 DAI+USDC+USDT
    await dai.approve(curveAdapter.address, toWei("100"));
    await usdc.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));
    await usdt.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));

    await curve_aave_gauge.set_approve_deposit(curveAdapter.address, true);
    await curveAdapter
      .connect(testSigner)
      .invest(
        testAccount,
        [toWei("100"), ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("100", 6)],
        CURVE_aPOOL_CONTRACT,
        testAccount,
        AAVE_GAUGE
      );

    // check balances are correctly updated
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceBefore.sub(daiBalanceAfter)).to.equal(toWei("100"));

    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceBefore.sub(usdcBalanceAfter)).to.equal(ethers.utils.parseUnits("100", 6));

    const usdtBalanceAfter = await usdt.balanceOf(testAccount);
    expect(usdtBalanceBefore.sub(usdtBalanceAfter)).to.equal(ethers.utils.parseUnits("100", 6));

    // user now has some staked gaug tokens
    const gaugeTokensAfter = await curve_aave_gauge.balanceOf(testAccount);
    assert(gaugeTokensAfter > gaugeTokensBefore);
  });

  it("should remove part of liquidity from Curve's Aave pool", async function () {
    const daiBalanceBefore = await dai.balanceOf(testAccount);
    const usdcBalanceBefore = await usdc.balanceOf(testAccount);
    const usdtBalanceBefore = await usdt.balanceOf(testAccount);
    const gaugeTokensBefore = await curve_aave_gauge.balanceOf(testAccount);

    // reward tokens
    const wMaticBalanceBefore = await wMatic.balanceOf(testAccount);
    const crvBalanceBefore = await crv.balanceOf(testAccount);

    // time travel to compund rewards
    await network.provider.send("evm_increaseTime", [3600 * 24 * 100]);
    await network.provider.send("evm_mine");

    // remove 70 DAI, 60 USDC and 55 USDT from pool
    await curve_aave_gauge.approve(curveAdapter.address, gaugeTokensBefore);
    await curveAdapter
      .connect(testSigner)
      .redeem(
        testAccount,
        [toWei("70"), ethers.utils.parseUnits("60", 6), ethers.utils.parseUnits("55", 6)],
        CURVE_aPOOL_CONTRACT,
        AAVE_GAUGE,
        controller.address
      );

    // check balances are correctly updated
    const daiBalanceAfter = await dai.balanceOf(testAccount);
    expect(daiBalanceAfter.sub(daiBalanceBefore)).to.equal(toWei("70"));

    const usdcBalanceAfter = await usdc.balanceOf(testAccount);
    expect(usdcBalanceAfter.sub(usdcBalanceBefore)).to.equal(ethers.utils.parseUnits("60", 6));

    const usdtBalanceAfter = await usdt.balanceOf(testAccount);
    expect(usdtBalanceAfter.sub(usdtBalanceBefore)).to.equal(ethers.utils.parseUnits("55", 6));

    // check reward tokens are claimed
    const wMaticBalanceAfter = await wMatic.balanceOf(testAccount);
    assert(wMaticBalanceAfter > wMaticBalanceBefore);

    const crvBalanceafter = await crv.balanceOf(testAccount);
    assert(crvBalanceafter > crvBalanceBefore);
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
