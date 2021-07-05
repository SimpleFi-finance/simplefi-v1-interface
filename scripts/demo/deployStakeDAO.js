const hre = require("hardhat");
const ethers = hre.ethers;

async function setupStakeDAOMarkets(controller) {
    const STAKE_DAO_LP = "0x7d60F21072b585351dFd5E8b17109458D97ec120";
    const STAKE_DAO_TOKEN = "0x361a5a4993493ce00f61c32d4ecca5512b82ce90";
    const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
    const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

    const StakeDaoAdapter = await ethers.getContractFactory("StakeDaoAdapter");
    const stakeDaoAdapter = await StakeDaoAdapter.deploy(controller.address);
    await stakeDaoAdapter.deployed();
    console.log("StakeDAO adapter deployed to: ", stakeDaoAdapter.address);

    const stakeDaoProtocolName = ethers.utils.formatBytes32String("Stake Dao pool");
    await controller.addProtocolAdapter(stakeDaoProtocolName,stakeDaoAdapter.address);

    await controller.addMarket(
        stakeDaoProtocolName,
        STAKE_DAO_LP,
        STAKE_DAO_LP,
        STAKE_DAO_LP,
        wMATIC,
        [CURVE_AAVE_LP_TOKEN],
        [STAKE_DAO_TOKEN]
    );
}

async function deployPolygon() {
    controller = await ethers.getContractAt("Controller", "0x4f42528B7bF8Da96516bECb22c1c6f53a8Ac7312");

    await setupStakeDAOMarkets(controller);

    return controller;
}

async function main() {
    await deployPolygon();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });