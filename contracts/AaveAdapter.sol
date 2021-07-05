//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./oz/token/ERC20/IERC20.sol";
import "./interfaces/AaveInterfaces.sol";
import "hardhat/console.sol";

contract AaveAdapter is IAdapter {
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
        (address market, , address wMATIC) = Controller(controllerAddress)
        .markets(to);

        if (msg.value != 0) {
            IWETH(wMATIC).deposit{value: msg.value}();
            IWETH(wMATIC).approve(market, msg.value);
            ILendingPool(market).deposit(
                address(wMATIC),
                msg.value,
                onBehalfOf,
                0
            );
        } else {
            require(
                amounts.length == 1,
                "Only single asset deposit is available."
            );
            address token = Controller(controllerAddress).getMarketInputTokens(
                to
            )[0];

            IERC20(token).transferFrom(pullFrom, address(this), amounts[0]);
            IERC20(token).approve(market, amounts[0]);
            ILendingPool(market).deposit(token, amounts[0], onBehalfOf, 0);
        }
        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {
        uint256[] memory amountsRedeemed = new uint256[](1);
        (address market, address tokenToBurn, address wMATIC) = Controller(
            controllerAddress
        ).markets(to);

        address token = Controller(controllerAddress).getMarketInputTokens(to)[
            0
        ];

        if (token == wMATIC) {
            IERC20(tokenToBurn).transferFrom(
                pullFrom,
                address(this),
                amounts[0]
            );
            IERC20(tokenToBurn).approve(market, amounts[0]);
            amountsRedeemed[0] = ILendingPool(market).withdraw(
                address(wMATIC),
                amounts[0],
                address(this)
            );
            IWETH(wMATIC).withdraw(amounts[0]);
            _safeTransferETH(onBehalfOf, amounts[0]);
        } else {
            require(
                amounts.length == 1,
                "Only single asset deposit is available."
            );

            IERC20(tokenToBurn).transferFrom(
                pullFrom,
                address(this),
                amounts[0]
            );
            IERC20(tokenToBurn).approve(market, amounts[0]);
            amountsRedeemed[0] = ILendingPool(market).withdraw(
                token,
                amounts[0],
                transferTo
            );
        }
        return amountsRedeemed;
    }

    function borrow(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {
        (address market, , address wMATIC) = Controller(controllerAddress)
        .markets(from);
        address token = Controller(controllerAddress).getMarketInputTokens(
            from
        )[0];

        if (token == wMATIC) {
            ILendingPool(market).borrow(
                address(wMATIC),
                amounts[0],
                2,
                0,
                onBehalfOf
            );
            IWETH(wMATIC).withdraw(amounts[0]);
            _safeTransferETH(transferTo, amounts[0]);
        } else {
            //TODO make it flexible to choose interest rate mode
            ILendingPool(market).borrow(token, amounts[0], 2, 0, onBehalfOf);
            IERC20(token).transfer(transferTo, amounts[0]);
        }
        return amounts;
    }

    function repay(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {
        uint256[] memory amountsRepayed = new uint256[](1);
        (address market, , address wMATIC) = Controller(controllerAddress)
        .markets(to);

        if (msg.value != 0) {
            IWETH(wMATIC).deposit{value: msg.value}();
            IWETH(wMATIC).approve(market, msg.value);
            ILendingPool(market).repay(
                address(wMATIC),
                msg.value,
                2,
                onBehalfOf
            );
        } else {
            address token = Controller(controllerAddress).getMarketInputTokens(
                to
            )[0];

            IERC20(token).transferFrom(pullFrom, address(this), amounts[0]);
            IERC20(token).approve(market, amounts[0]);
            amountsRepayed[0] = ILendingPool(market).repay(
                token,
                amounts[0],
                2,
                transferTo
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
