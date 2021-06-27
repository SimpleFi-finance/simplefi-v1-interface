//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./utils/IERC20.sol";
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
        if (msg.value != 0) {
            (, , address wMATIC) = Controller(controllerAddress).markets(
                controllerAddress
            );
            IWETH(wMATIC).approve(to, msg.value);
            IWETH(wMATIC).deposit{value: msg.value}();
            ILendingPool(to).deposit(address(wMATIC), msg.value, onBehalfOf, 0);
        } else {
            require(
                amounts.length == 1,
                "Only single asset deposit is available."
            );
            address token = Controller(controllerAddress).getInputTokens(to)[0];
            // address[] memory tokens = Controller(controllerAddress)
            // .getInputTokens(to);
            IERC20(token).transferFrom(pullFrom, address(this), amounts[0]);
            IERC20(token).approve(to, amounts[0]);
            ILendingPool(to).deposit(token, amounts[0], onBehalfOf, 0);
        }
        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable override returns (uint256[] memory amountsTransferred) {
        uint256[] memory amountsRedeemed = new uint256[](1);
        (, address tokenToBurn, address wMATIC) = Controller(controllerAddress)
        .markets(to);
        if (msg.value != 0) {
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
            _safeTransferETH(onBehalfOf, amounts[0]);
        } else {
            IERC20(tokenToBurn).transferFrom(
                onBehalfOf,
                address(this),
                amounts[0]
            );
            IERC20(tokenToBurn).approve(to, amounts[0]);

            address[] memory tokens = Controller(controllerAddress)
            .getInputTokens(to);
            amountsRedeemed[0] = ILendingPool(to).withdraw(
                tokens[0],
                amounts[0],
                onBehalfOf
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
    ) external payable override returns (uint256[] memory amountsTransferred) {
        if (msg.value != 0) {
            (, , address wMATIC) = Controller(controllerAddress).markets(from);
            ILendingPool(from).borrow(
                address(wMATIC),
                msg.value,
                2,
                0,
                onBehalfOf
            );
            IWETH(wMATIC).withdraw(msg.value);
            _safeTransferETH(transferTo, msg.value);
        } else {
            //TODO make it flexible to choose interest rate mode
            address[] memory tokens = Controller(controllerAddress)
            .getInputTokens(from);
            for (uint256 i = 0; i < amounts.length; i++) {
                if (amounts[i] == 0) continue;

                ILendingPool(from).borrow(
                    tokens[i],
                    amounts[i],
                    2,
                    0,
                    onBehalfOf
                );
                IERC20(tokens[i]).transfer(transferTo, amounts[i]);
            }
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
        if (msg.value != 0) {
            (, , address wMATIC) = Controller(controllerAddress).markets(to);
            IWETH(wMATIC).approve(to, msg.value);
            IWETH(wMATIC).deposit{value: msg.value}();
            ILendingPool(to).repay(address(wMATIC), msg.value, 2, onBehalfOf);
        } else {
            address[] memory tokens = Controller(controllerAddress)
            .getInputTokens(to);
            for (uint256 i = 0; i < amounts.length; i++) {
                if (amounts[i] == 0) continue;

                IERC20(tokens[i]).transferFrom(
                    pullFrom,
                    address(this),
                    amounts[i]
                );
                IERC20(tokens[i]).approve(to, amounts[i]);
                amountsRepayed[0] = ILendingPool(to).repay(
                    tokens[i],
                    amounts[i],
                    2,
                    transferTo
                );
            }
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

    function getInputTokenRatio()
        external
        view
        override
        returns (uint256[] memory)
    {}

    receive() external payable {}
}
