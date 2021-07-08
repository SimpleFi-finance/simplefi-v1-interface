const hre = require("hardhat");
const ethers = hre.ethers;

async function setupAaveMarkets(controller) {
    // Polygon Mainnet contract addresses
    const LENDING_POOL = "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf";
    const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    const awMATIC = "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4";
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

    // Deploy Aave adapter
    const AaveAdapter = await ethers.getContractFactory("AaveAdapter");
    const aaveAdapter = await AaveAdapter.deploy(controller.address);
    await aaveAdapter.deployed();
    console.log("Aave adapter deployed to: ", aaveAdapter.address);

    // Add Aave adapter and markets
    const aaveProtocolName = ethers.utils.formatBytes32String("Aave V2");
    await controller.addProtocolAdapter(aaveProtocolName, aaveAdapter.address);

    // dai
    await controller.addMarket(
        aaveProtocolName,
        aDAI,
        LENDING_POOL,
        aDAI,
        wMATIC,
        [DAI],
        [wMATIC]
    );

    // usdc
    await controller.addMarket(
        aaveProtocolName,
        aUSDC,
        LENDING_POOL,
        aUSDC,
        wMATIC,
        [USDC],
        [wMATIC]
    );

    // usdt
    await controller.addMarket(
        aaveProtocolName,
        aUSDT,
        LENDING_POOL,
        aUSDT,
        wMATIC,
        [USDT],
        [wMATIC]
    );

    // wETH
    await controller.addMarket(
        aaveProtocolName,
        awETH,
        LENDING_POOL,
        awETH,
        wMATIC,
        [wETH],
        [wMATIC]
    );

    // wBTC
    await controller.addMarket(
        aaveProtocolName,
        awBTC,
        LENDING_POOL,
        awBTC,
        wMATIC,
        [wBTC],
        [wMATIC]
    );

    // aave
    await controller.addMarket(
        aaveProtocolName,
        aAAVE,
        LENDING_POOL,
        aAAVE,
        wMATIC,
        [AAVE],
        [wMATIC]
    );

    // wMatic
    await controller.addMarket(
        aaveProtocolName,
        awMATIC,
        LENDING_POOL,
        awMATIC,
        wMATIC,
        [wMATIC],
        [wMATIC]
    );
}

async function setupCurveMarkets(controller) {
    const CURVE_AAVE_POOL = "0x445FE580eF8d70FF569aB36e80c647af338db351";
    const CURVE_AAVE_GAUGE = "0x19793B454D3AfC7b454F206Ffe95aDE26cA6912c";
    const CURVE_AAVE_LP_TOKEN = "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171";
    const DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
    const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
    const USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
    const wMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    const CRV = "0x172370d5cd63279efa6d502dab29171933a610af";

    const CurveAdapter = await ethers.getContractFactory("CurveAdapter");
    const curveAdapter = await CurveAdapter.deploy(controller.address);
    await curveAdapter.deployed();
    console.log("Curve adapter deployed to: ", curveAdapter.address);

    const curveProtocolName = ethers.utils.formatBytes32String("Curve AAVE pool");
    await controller.addProtocolAdapter(curveProtocolName, curveAdapter.address);

    await controller.addMarket(
        curveProtocolName,
        CURVE_AAVE_POOL,
        CURVE_AAVE_POOL,
        CURVE_AAVE_LP_TOKEN,
        wMATIC,
        [DAI, USDC, USDT],
        [wMATIC, CRV]
    );

    const CurveGaugeAdapter = await ethers.getContractFactory("CurveGaugeAdapter");
    const curveGuageAdapter = await CurveGaugeAdapter.deploy(controller.address);
    await curveGuageAdapter.deployed();
    console.log("Curve guage adapter deployed to: ", curveGuageAdapter.address);

    const curveGuageProtocolName = ethers.utils.formatBytes32String("Curve AAVE Pool Guage");
    await controller.addProtocolAdapter(curveGuageProtocolName, curveGuageAdapter.address);

    await controller.addMarket(
        curveGuageProtocolName,
        CURVE_AAVE_GAUGE,
        CURVE_AAVE_GAUGE,
        CURVE_AAVE_GAUGE,
        wMATIC,
        [CURVE_AAVE_LP_TOKEN],
        [wMATIC, CRV]
    );
}

async function deployPolygon() {
    // Deploy Controller
    const Controller = await ethers.getContractFactory("Controller");
    const quickswapRuter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
    const quickswapWETH = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    const controller = await Controller.deploy(quickswapRuter, quickswapWETH);
    await controller.deployed();
    console.log("Controller deployed to: ", controller.address);

    await setupAaveMarkets(controller);
    await setupCurveMarkets(controller);

    return controller;
}

module.exports = {
    deployPolygon
}