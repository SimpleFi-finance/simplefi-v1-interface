//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./interfaces/CurveInterfaces.sol";
import "./utils/IERC20.sol";
import "hardhat/console.sol";

contract CurveAdapter is IAdapter {
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
        // transfer tokens to this contract
        address[] memory inputTokens = Controller(controllerAddress)
        .getInputTokens(to);
        uint256[3] memory amountsFixedSize;
        for (uint256 i = 0; i < inputTokens.length; i++) {
            IERC20(inputTokens[i]).transferFrom(
                onBehalfOf,
                address(this),
                amounts[i]
            );
            IERC20(inputTokens[i]).approve(to, amounts[i]);
            amountsFixedSize[i] = amounts[i];
        }

        // deposit stablecoins and get Curve LP tokens
        uint256 lpTokensReceived = ICurveDeposit(to).add_liquidity(
            amountsFixedSize,
            0,
            true
        );

        // stake LP tokens into Gauge to get rewards
        (, address lpToken, ) = Controller(controllerAddress).markets(to);
        address curveAaveGauge = transferTo;
        IERC20(lpToken).approve(curveAaveGauge, lpTokensReceived);
        ICurveGauge(curveAaveGauge).deposit(lpTokensReceived, onBehalfOf);

        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {
        // Unstake LP tokens from Gauge
        uint256 gaugeBalance = IERC20(pullFrom).balanceOf(onBehalfOf);
        IERC20(pullFrom).transferFrom(onBehalfOf, address(this), gaugeBalance);
        ICurveGauge(pullFrom).withdraw(gaugeBalance);

        // convert dynamic size array to fixed size array
        uint256[3] memory amountsFixedSize;
        for (uint256 i = 0; i < amounts.length; i++) {
            amountsFixedSize[i] = amounts[i];
        }

        // withdraw stablecoins from CurveDeposit
        (, address lpToken, ) = Controller(controllerAddress).markets(from);
        uint256 lpBalance = IERC20(lpToken).balanceOf(address(this));
        IERC20(lpToken).approve(from, lpBalance);
        ICurveDeposit(from).remove_liquidity_imbalance(
            amountsFixedSize,
            lpBalance,
            true
        );

        // send tokens to user
        address[] memory inputTokens = Controller(controllerAddress)
        .getInputTokens(from);
        for (uint256 i = 0; i < inputTokens.length; i++) {
            IERC20(inputTokens[i]).transfer(onBehalfOf, amounts[i]);
        }

        // send reward tokens to user
        address[] memory rewardTokens = Controller(controllerAddress)
        .getInputTokens(from);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            IERC20(rewardTokens[i]).transfer(
                onBehalfOf,
                IERC20(rewardTokens[i]).balanceOf(address(this))
            );
        }

        return amounts;
    }

    function borrow(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {}

    function repay(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {}

    function getInputTokenRatio()
        external
        view
        override
        returns (uint256[] memory)
    {}
}
