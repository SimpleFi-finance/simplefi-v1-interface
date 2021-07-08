const hre = require("hardhat");
const { deployPolygon } = require("./deployFirst");
const { deployStakeDAO } = require("./deployStakeDAO");
const ethers = hre.ethers;


let accounts, account, controller;

async function approve(token, user, amount) {
    const erc20 = await ethers.getContractAt("IERC20", token);
    await erc20.approve(user, amount);
}

// Polygon mainnet addresses
const aDAI = "0x27F8D03b3a2196956ED754baDc28D73be8830A6e";

const CURVE_AAVE_POOL = "0x445FE580eF8d70FF569aB36e80c647af338db351";
const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";

const STAKE_DAO_LP = "0x7d60F21072b585351dFd5E8b17109458D97ec120";

async function depositETHToDAIAave() {
    console.log("-------------------------------------------------------------------------------------");
    console.log("Deposit ETH to Aave DAI pool");
    const aDaiContract = await ethers.getContractAt("IERC20", aDAI);
    console.log("Initial balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());

    const value = ethers.utils.parseEther("100");
    await controller.depositETH(
        aDAI,
        false,
        {
            value: value
        }
    );
    
    console.log("Final balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());
}

async function migrateDAIFromAaveToCurve() {
    console.log("-------------------------------------------------------------------------------------");
    console.log("Migrate DAI from Aave to Curve");
    const aDaiContract = await ethers.getContractAt("IERC20", aDAI);
    const curveLPTokenContract = await ethers.getContractAt("IERC20", CURVE_AAVE_LP_TOKEN);

    const amount = (await aDaiContract.balanceOf(account.address)).toString();

    console.log("Initial balance of aDAI: ", amount);
    console.log("Initial balance of curve LPToken: ", (await curveLPTokenContract.balanceOf(account.address)).toString());

    const adapter = await controller.getAdapterAddressForMarket(aDAI);
    await approve(aDAI, adapter, amount);

    const amounts = await controller.migrate(
        aDAI,
        CURVE_AAVE_POOL,
        [amount],
        false,
        false
    );

    console.log("Final balance of aDAI: ", (await aDaiContract.balanceOf(account.address)).toString());
    console.log("Final balance of curve LPToken: ", (await curveLPTokenContract.balanceOf(account.address)).toString());
}

async function depositETHToStakeDAO() {
    console.log("-------------------------------------------------------------------------------------");
    console.log("Deposit ETH to StakeDAO");
    const stakeDaoLPTokenContract = await ethers.getContractAt("IERC20", STAKE_DAO_LP);
    console.log("Initial balance of stakeDaoLPToken: ", (await stakeDaoLPTokenContract.balanceOf(account.address)).toString());

    const value = ethers.utils.parseEther("100");
    await controller.depositETH(
        STAKE_DAO_LP,
        false,
        {
            value: value
        }
    );
    
    console.log("Final balance of stakeDaoLPToken: ", (await stakeDaoLPTokenContract.balanceOf(account.address)).toString());
}

async function main() {
    accounts = await ethers.getSigners();
    account = accounts[0];
    console.log("Account address", account.address);

    controller = await deployPolygon();
    
    await depositETHToDAIAave();
    await migrateDAIFromAaveToCurve();
    console.log("-------------------------------------------------------------------------------------");
    await deployStakeDAO(controller);
    await depositETHToStakeDAO();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });