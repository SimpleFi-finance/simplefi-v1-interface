const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let curveAdapter, aaveCurvePolygonPool;
let dai, usdc, usdt;

let DAI_CONTRACT = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
let USDC_CONTRACT = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
let USDT_CONTRACT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";

let testAccount, testSigner;

const CURVE_aPOOL_CONTRACT = "0x445FE580eF8d70FF569aB36e80c647af338db351";
// const N_COINS = 3;

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

    // deploy Aave adapter
    const CurveAdapter = await ethers.getContractFactory("CurveAdapter");
    curveAdapter = await CurveAdapter.deploy();
    await curveAdapter.deployed();

    // get some funds to test account
    await initBalances(testAccount);
  });

  it("should deposit stablecoins to Curve's Aave pool", async function () {
    // const x = await aaveCurvePolygonPool.balances(0);
    // console.log(toEther(x.toString()));

    const coin0 = await aaveCurvePolygonPool.coins(0);
    console.log(coin0);

    const coin1 = await aaveCurvePolygonPool.coins(1);
    console.log(coin1);

    const coin2 = await aaveCurvePolygonPool.coins(2);
    console.log(coin2);

    const uc0 = await aaveCurvePolygonPool.underlying_coins(0);
    console.log(uc0);

    const uc1 = await aaveCurvePolygonPool.underlying_coins(1);
    console.log(uc1);

    const uc2 = await aaveCurvePolygonPool.underlying_coins(2);
    console.log(uc2);

    let bDai = await dai.balanceOf(testAccount);
    console.log("DAI: " + toEther(bDai));

    let bUsdc = await usdc.balanceOf(testAccount);
    console.log("USDC: " + ethers.utils.formatUnits(bUsdc, 6));

    let bUsdt = await usdt.balanceOf(testAccount);
    console.log("USDT: " + ethers.utils.formatUnits(bUsdt, 6));

    // await dai.approve(aaveCurvePolygonPool.address, toWei("100"));
    // await usdc.approve(aaveCurvePolygonPool.address, ethers.utils.parseUnits("100", 6));
    // await usdt.approve(aaveCurvePolygonPool.address, ethers.utils.parseUnits("100", 6));

    // let amounts = new Array(3);
    // amounts[0] = toWei("50");
    // amounts[1] = ethers.utils.parseUnits("50", 6);
    // amounts[2] = ethers.utils.parseUnits("50", 6);

    // await aaveCurvePolygonPool.add_liquidity(amounts, 0, true);

    // deposit 100 DAI+USDC+USDT
    await dai.approve(curveAdapter.address, toWei("100"));
    await usdc.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));
    await usdt.approve(curveAdapter.address, ethers.utils.parseUnits("100", 6));

    await curveAdapter
      .connect(testSigner)
      .invest(
        testAccount,
        [DAI_CONTRACT, USDC_CONTRACT, USDT_CONTRACT],
        [toWei("100"), ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("100", 6)],
        CURVE_aPOOL_CONTRACT,
        255
      );

    bDai = await dai.balanceOf(testAccount);
    console.log("DAI: " + toEther(bDai));

    bUsdc = await usdc.balanceOf(testAccount);
    console.log("USDC: " + ethers.utils.formatUnits(bUsdc, 6));

    bUsdt = await usdt.balanceOf(testAccount);
    console.log("USDT: " + ethers.utils.formatUnits(bUsdt, 6));

    // const coins = await aaveCurvePolygonPool.underlying_coins();
    // console.log(coins);
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
