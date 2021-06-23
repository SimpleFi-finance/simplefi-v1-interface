//SPDX-License-Identifier: GPLV3
pragma solidity ^0.7.0;

import "./IAdapter.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/AaveInterfaces.sol";
import "hardhat/console.sol";

contract AaveAdapter is IAdapter {
    // polygon specific
    address private wMATIC = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function invest(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {
        require(
            tokens.length == 1 && amounts.length == 1,
            "Aave supports only single token action at a time"
        );

        if (ethIndex < 255) {
            IWETH(wMATIC).approve(to, amounts[0]);
            IWETH(wMATIC).deposit{value: amounts[0]}();
            ILendingPool(to).deposit(
                address(wMATIC),
                amounts[0],
                onBehalfOf,
                0
            );

            // refund remaining dust eth/matic
            if (msg.value > amounts[0]) {
                _safeTransferETH(onBehalfOf, msg.value - amounts[0]);
            }
        } else {
            IERC20(tokens[0]).transferFrom(
                msg.sender,
                address(this),
                amounts[0]
            );
            IERC20(tokens[0]).approve(to, amounts[0]);
            ILendingPool(to).deposit(tokens[0], amounts[0], onBehalfOf, 0);
        }
        return amounts;
    }

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    // Adapter needs to claim ither reward tokens as well
    // tokens are underlying assets which we want to redeem
    function redeem(
        address onBehalfOf,
        address tokenToBurn,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {
        require(
            tokens.length == 1 && amounts.length == 1,
            "Aave supports only single token action at a time"
        );

        uint256[] memory amountsRedeemed = new uint256[](1);
        if (ethIndex < 255) {
            IERC20(tokenToBurn).transferFrom(
                onBehalfOf,
                address(this),
                amounts[0]
            );
            IERC20(tokenToBurn).approve(to, amounts[0]);
            amountsRedeemed[0] = ILendingPool(to).withdraw(
                address(wMATIC),
                amounts[0],
                address(this)
            );
            IWETH(wMATIC).withdraw(amounts[0]);
            (bool success, ) = onBehalfOf.call{value: amounts[0]}(new bytes(0));
            require(success, "ETH_TRANSFER_FAILED");
        } else {
            IERC20(tokenToBurn).transferFrom(
                onBehalfOf,
                address(this),
                amounts[0]
            );
            IERC20(tokenToBurn).approve(to, amounts[0]);
            amountsRedeemed[0] = ILendingPool(to).withdraw(
                tokens[0],
                amounts[0],
                onBehalfOf
            );
        }
        return amountsRedeemed;
    }

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function borrow(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external override returns (uint256[] memory amountsTransferred) {
        require(
            tokens.length == 1 && amounts.length == 1,
            "Aave supports only single token action at a time"
        );

        if (ethIndex < 255) {
            ILendingPool(to).borrow(
                address(wMATIC),
                amounts[0],
                2,
                0,
                onBehalfOf
            );
            IWETH(wMATIC).withdraw(amounts[0]);
            _safeTransferETH(onBehalfOf, amounts[0]);
        } else {
            //TODO make it flexible to choose interest rate mode
            ILendingPool(to).borrow(tokens[0], amounts[0], 2, 0, onBehalfOf);
            IERC20(tokens[0]).transfer(onBehalfOf, amounts[0]);
        }
        return amounts;
    }

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function repay(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable override returns (uint256[] memory amountsTransferred) {
        require(
            tokens.length == 1 && amounts.length == 1,
            "Aave supports only single token action at a time"
        );

        uint256[] memory amountsRepayed = new uint256[](1);
        if (ethIndex < 255) {
            IWETH(wMATIC).approve(to, amounts[0]);
            IWETH(wMATIC).deposit{value: amounts[0]}();
            ILendingPool(to).repay(address(wMATIC), amounts[0], 2, onBehalfOf);

            // refund remaining dust eth/matic
            if (msg.value > amounts[0]) {
                _safeTransferETH(onBehalfOf, msg.value - amounts[0]);
            }
        } else {
            IERC20(tokens[0]).transferFrom(
                onBehalfOf,
                address(this),
                amounts[0]
            );
            IERC20(tokens[0]).approve(to, amounts[0]);
            amountsRepayed[0] = ILendingPool(to).repay(
                tokens[0],
                amounts[0],
                2,
                onBehalfOf
            );
        }
        return amountsTransferred;
    }

    /**
     * @dev transfer ETH/Matic to an address, revert if it fails.
     * @param to recipient of the transfer
     * @param value the amount to send
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    receive() external payable {}
}
