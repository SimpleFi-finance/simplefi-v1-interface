const hre = require("hardhat");
const ethers = hre.ethers;

let accounts, account, controller;

const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const quickswapWETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

async function approve(token, user, amount) {
    const erc20 = await ethers.getContractAt("IERC20", token);
    await erc20.approve(user, amount);
}

async function buy(token, amount) {
    const value = ethers.utils.parseEther("100");
    const swap = await ethers.getContractAt("IUniswapV2Router02", quickswapRuter);
    const now = Math.round(new Date().getTime() / 1000);
    await swap.swapETHForExactTokens(
        amount,
        [quickswapWETH, token],
        account.address,
        now + 3600,
        {
            value: value
        }
    )
}

// Polygon mainnet addresses
const DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

const awMATIC = "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4";
const aDAI = "0x27F8D03b3a2196956ED754baDc28D73be8830A6e";

const CURVE_AAVE_POOL = "0x445FE580eF8d70FF569aB36e80c647af338db351";
const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
const CURVE_AAVE_GAUGE = "0x19793B454D3AfC7b454F206Ffe95aDE26cA6912c";
const CRV = "0x172370d5cd63279efa6d502dab29171933a610af";

const STAKE_DAO_LP = "0x7d60F21072b585351dFd5E8b17109458D97ec120";

async function depositETHToAave() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        awMATIC,
        false,
        {
            value: value
        }
    );

    const awMaticContract = await ethers.getContractAt("IERC20", awMATIC);
    console.log("Balance of awMatic: ", (await awMaticContract.balanceOf(account.address)).toString());
}

async function depositETHToDAIAave() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        aDAI,
        false,
        {
            value: value
        }
    );

    const aDaiContract = await ethers.getContractAt("IERC20", aDAI);
    console.log("Balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());
}

async function depositDAItoAave() {
    const amount = ethers.utils.parseEther("100");
    await buy(DAI, amount);
    const DaiContract = await ethers.getContractAt("IERC20", DAI);
    console.log("Balance of DAI: ", (await DaiContract.balanceOf(account.address)).toString());

    const adapter = await controller.getAdapterAddressForMarket(aDAI);
    await approve(DAI, adapter, amount);

    await controller.deposit(
        aDAI,
        [amount],
        false
    );

    const aDaiContract = await ethers.getContractAt("IERC20", aDAI);
    console.log("Balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());
}

async function migrateFromETHAaveToDAIAave() {
    const aDaiContract = await ethers.getContractAt("IERC20", aDAI);
    const awMaticContract = await ethers.getContractAt("IERC20", awMATIC);

    const amount = (await aDaiContract.balanceOf(account.address)).toString();

    console.log("Initial balance of aDAI: ", amount);
    console.log("Initial balance of awMatic: ", (await awMaticContract.balanceOf(account.address)).toString());

    const adapter = await controller.getAdapterAddressForMarket(aDAI);
    await approve(aDAI, adapter, amount);

    const amounts = await controller.migrate(
        aDAI,
        awMATIC,
        [amount],
        false,
        false
    );

    console.log("Final balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());
    console.log("Final balance of awMatic: ", (await awMaticContract.balanceOf(account.address)).toString());
}

async function depositETHToCurveAavePool(){
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        CURVE_AAVE_POOL,
        false,
        {
            value: value
        }
    );

    const curveLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN);
    console.log("Balance of curveLPToken: ", (await curveLPTokenContract.balanceOf(account.address)).toString());
}

async function depositCurveLPTokenToStakeDAO() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        CURVE_AAVE_POOL,
        false,
        {
            value: value
        }
    );

    const curveLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN);
    const curveLPTokenBalance = await curveLPTokenContract.balanceOf(account.address);
    console.log("Depositing to StakeDAO curveLPToken: ", (await curveLPTokenContract.balanceOf(account.address)).toString());

    const stakeDaoAdapter = await controller.getAdapterAddressForMarket(STAKE_DAO_LP);
    await approve(CURVE_AAVE_LP_TOKEN, stakeDaoAdapter, curveLPTokenBalance);

    await controller.deposit(
        STAKE_DAO_LP,
        [curveLPTokenBalance],
        false
    );

    const stakeDaoLPTokenContract = await ethers.getContractAt("IERC20", STAKE_DAO_LP);
    console.log("Balance of stakeDaoLPToken: ", (await stakeDaoLPTokenContract.balanceOf(account.address)).toString());
}

async function depositETHToStakeDAO() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        STAKE_DAO_LP,
        false,
        {
            value: value
        }
    );

    const stakeDaoLPTokenContract = await ethers.getContractAt("IERC20", STAKE_DAO_LP);
    console.log("Balance of stakeDaoLPToken: ", (await stakeDaoLPTokenContract.balanceOf(account.address)).toString());
}

async function depositETHToCurveGuage() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        CURVE_AAVE_GAUGE,
        false,
        {
            value: value
        }
    );

    const curveGuageLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_GAUGE);
    console.log("Balance of Curve Guage Token LP Token: ", (await curveGuageLPTokenContract.balanceOf(account.address)).toString());
}

async function depositCurveLPTokenToCurveGuage() {
    const value = ethers.utils.parseEther("10");
    await controller.depositETH(
        CURVE_AAVE_POOL,
        false,
        {
            value: value
        }
    );

    const curveLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN);
    const curveLPTokenBalance = await curveLPTokenContract.balanceOf(account.address);
    console.log("Depositing CurveLPToken to Curve Guage: ", (await curveLPTokenContract.balanceOf(account.address)).toString());

    const curveGuageAdapter = await controller.getAdapterAddressForMarket(CURVE_AAVE_GAUGE);
    await approve(CURVE_AAVE_LP_TOKEN, curveGuageAdapter, curveLPTokenBalance);

    await controller.deposit(
        CURVE_AAVE_GAUGE,
        [curveLPTokenBalance],
        false
    );

    const curveGuageLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_GAUGE);
    console.log("Balance of Curve Guage Token LP Token: ", (await curveGuageLPTokenContract.balanceOf(account.address)).toString());
}

async function main() {
    accounts = await ethers.getSigners();
    account = accounts[0];
    console.log("Account address", account.address);

    controller = await ethers.getContractAt("Controller", "0x124dDf9BdD2DdaD012ef1D5bBd77c00F05C610DA");

    //await depositETHToAave();
    //await depositETHToDAIAave();
    //await depositDAItoAave();
    //await migrateFromETHAaveToDAIAave();
    //await depositETHToCurveAavePool();
    //await depositCurveLPTokenToStakeDAO();
    //await depositETHToStakeDAO();
    //await depositCurveLPTokenToCurveGuage();
    await depositETHToCurveGuage();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });