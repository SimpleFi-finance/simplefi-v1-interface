//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./interfaces/CurveInterfaces.sol";
import "hardhat/console.sol";

/**
 */
contract CurveAdapter is IAdapter {
    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function invest(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {
        // address[4] memory stablecoins = ICurveFi_DepositY(to).underlying_coins();
        uint256[amounts.length] memory arr;

        console.log("Bout to approve");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).transferFrom(
                onBehalfOf,
                address(this),
                amounts[i]
            );
            IERC20(tokens[i]).approve(to, amounts[i]);
            arr[i] = amounts[i];
        }

        console.log("Approved everything");
        // deposit stablecoins and get Curve LP tokens
        // uint256[3] memory amms;
        // amms[0] = 100000000000000000000;
        // amms[1] = 100000000;
        // amms[2] = 100000000;

        // address x = ICurveDeposit(to).underlying_coins(0);
        // console.log(x);
        ICurveDeposit(to).add_liquidity(arr, 0, true); //0 to mint all Curve has to

        console.log("Stables deposited");
        // // stake Curve LP tokens into Gauge and get CRV rewards
        // uint256 curveLPBalance = IERC20(curveFi_LPToken).balanceOf(
        //     address(this)
        // );

        // IERC20(curveFi_LPToken).safeApprove(curveFi_LPGauge, curveLPBalance);
        // ICurveFi_Gauge(curveFi_LPGauge).deposit(curveLPBalance);

        // //Step 3 - get all the rewards (and make whatever you need with them)
        // crvTokenClaim();
        // uint256 crvAmount = IERC20(curveFi_CRVToken).balanceOf(address(this));
        // IERC20(curveFi_CRVToken).safeTransfer(_msgSender(), crvAmount);
    }

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    // Adapter needs to claim ither reward tokens as well
    function redeem(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {}

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function borrow(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external override returns (uint256[] memory amountsTransferred) {}

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function repay(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {}
}
