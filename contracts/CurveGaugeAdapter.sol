//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./interfaces/CurveInterfaces.sol";
import "./oz/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract CurveGaugeAdapter is IAdapter {
    address private controllerAddress;

    constructor(address _controllerAddress) {
        controllerAddress = _controllerAddress;
    }

    function invest(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {
        address inputToken = Controller(controllerAddress).getMarketInputTokens(
            to
        )[0];

        // transfer LP tokens to adapter
        IERC20(inputToken).transferFrom(pullFrom, address(this), amounts[0]);
        IERC20(inputToken).approve(to, amounts[0]);

        // stake LP tokens into Gauge to get rewards
        ICurveGauge(to).deposit(amounts[0], onBehalfOf);

        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {
        // transfer gauge tokens to adapter
        (, address gaugeToken, ) = Controller(controllerAddress).markets(from);
        IERC20(gaugeToken).transferFrom(pullFrom, address(this), amounts[0]);

        // Unstake LP tokens from Gauge (claims rewards automatically)
        ICurveGauge(from).withdraw(amounts[0], true);

        // transfer LP tokens to user
        address lpToken = Controller(controllerAddress).getMarketInputTokens(
            from
        )[0];
        uint256 lpTokenBalance = IERC20(lpToken).balanceOf(address(this));
        IERC20(lpToken).transfer(transferTo, lpTokenBalance);

        // send reward tokens to user
        address[] memory rewardTokens = Controller(controllerAddress)
        .getMarketRewardTokens(from);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            uint256 amount = IERC20(rewardTokens[i]).balanceOf(address(this));
            IERC20(rewardTokens[i]).transfer(onBehalfOf, amount);
        }

        return amounts;
    }

    function borrow(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {}

    function repay(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {}
}
