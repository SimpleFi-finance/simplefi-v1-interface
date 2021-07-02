//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./interfaces/CurveInterfaces.sol";
import "./oz/token/ERC20/IERC20.sol";
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
        .getMarketInputTokens(to);
        for (uint256 i = 0; i < inputTokens.length; i++) {
            IERC20(inputTokens[i]).transferFrom(
                pullFrom,
                address(this),
                amounts[i]
            );
            IERC20(inputTokens[i]).approve(to, amounts[i]);
        }

        uint256 lpTokensReceived = 0;
        if (amounts.length == 2) {
            // convert dynamic size array to fixed size array
            uint256[3] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }
            // deposit stablecoins and get Curve LP tokens
            lpTokensReceived = ICurveDeposit(to).add_liquidity(
                amountsFixedSize,
                0,
                true
            );
        } else if (amounts.length == 3) {
            // convert dynamic size array to fixed size array
            uint256[3] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }
            // deposit stablecoins and get Curve LP tokens
            lpTokensReceived = ICurveDeposit(to).add_liquidity(
                amountsFixedSize,
                0,
                true
            );
        } else if (amounts.length == 4) {
            // convert dynamic size array to fixed size array
            uint256[4] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }
            // deposit stablecoins and get Curve LP tokens
            lpTokensReceived = ICurveDeposit(to).add_liquidity(
                amountsFixedSize,
                0,
                true
            );
        } else {
            revert("Only pools of 2, 3 or 4 tokens are supported");
        }

        // transfer LP tokens to user
        (, address lpToken, ) = Controller(controllerAddress).markets(to);
        IERC20(lpToken).transfer(transferTo, lpTokensReceived);

        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {
        // transfer LP token to contract
        (, address lpToken, ) = Controller(controllerAddress).markets(from);
        uint256 lpBalance = IERC20(lpToken).balanceOf(pullFrom);
        IERC20(lpToken).transferFrom(pullFrom, address(this), lpBalance);
        IERC20(lpToken).approve(from, lpBalance);

        uint256 lpTokensBurned = 0;
        if (amounts.length == 2) {
            // convert dynamic size array to fixed size array
            uint256[2] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }

            // withdraw stablecoins from CurveDeposit
            lpTokensBurned = ICurveDeposit(from).remove_liquidity_imbalance(
                amountsFixedSize,
                lpBalance,
                true
            );
        } else if (amounts.length == 3) {
            // convert dynamic size array to fixed size array
            uint256[3] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }

            // withdraw stablecoins from CurveDeposit
            lpTokensBurned = ICurveDeposit(from).remove_liquidity_imbalance(
                amountsFixedSize,
                lpBalance,
                true
            );
        } else if (amounts.length == 4) {
            // convert dynamic size array to fixed size array
            uint256[4] memory amountsFixedSize;
            for (uint256 i = 0; i < amounts.length; i++) {
                amountsFixedSize[i] = amounts[i];
            }

            // withdraw stablecoins from CurveDeposit
            lpTokensBurned = ICurveDeposit(from).remove_liquidity_imbalance(
                amountsFixedSize,
                lpBalance,
                true
            );
        } else {
            revert("Only pools of 2, 3 or 4 tokens are supported");
        }

        // send tokens to user
        address[] memory inputTokens = Controller(controllerAddress)
        .getMarketInputTokens(from);
        for (uint256 i = 0; i < inputTokens.length; i++) {
            IERC20(inputTokens[i]).transfer(transferTo, amounts[i]);
        }

        // send remaining lp tokens back to user
        IERC20(lpToken).transfer(transferTo, lpBalance - lpTokensBurned);

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
}
