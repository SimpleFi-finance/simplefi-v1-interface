const hre = require("hardhat");
const { deployPolygon } = require("./deployPolygon");
const ethers = hre.ethers;

// Polygon mainnet addresses
const aaveProtocolName = ethers.utils.formatBytes32String("Aave V2");
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
const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const quickswapWETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

let accounts, account, controller;

async function approve(token, user, amount) {
    const erc20 = await ethers.getContractAt("IERC20", token);
    await erc20.approve(user, amount);
}

async function buy(token, amount) {
    const value = ethers.utils.parseEther("100");
    const swap = await ethers.getContractAt("IUniswapV2Router02", quickswapRuter);
    const now = Math.round(new Date().getTime()/1000);
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

async function main() {
    accounts = await ethers.getSigners();
    account = accounts[0];
    console.log("Account address", account.address);

    controller = await deployPolygon();

    //await depositETHToAave();
    //await depositETHToDAIAave();
    //await depositDAItoAave();
    await migrateFromETHAaveToDAIAave();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });