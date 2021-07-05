//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./interfaces/StakeDaoInterfaces.sol";
import "./oz/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract StakeDaoAdapter is IAdapter {
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
        (, address outputToken, ) = Controller(controllerAddress).markets(to);
        address inputToken = Controller(controllerAddress).getMarketInputTokens(
            to
        )[0];

        // transfer am3Crv to contract
        IERC20(inputToken).transferFrom(pullFrom, address(this), amounts[0]);
        IERC20(inputToken).approve(to, amounts[0]);

        // stake and transfer LP tokens to user
        IStakeDaoLpPool(to).deposit(amounts[0]);
        uint256 amount = IERC20(outputToken).balanceOf(address(this));
        IERC20(outputToken).transfer(transferTo, amount);

        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {
        (, address outputToken, ) = Controller(controllerAddress).markets(from);
        address inputToken = Controller(controllerAddress).getMarketInputTokens(
            from
        )[0];

        // transfer LP tokens to contract
        IERC20(outputToken).transferFrom(pullFrom, address(this), amounts[0]);

        // burn LP tokens and get am3Crv
        IStakeDaoLpPool(from).withdraw(amounts[0]);

        // tranfer am3Crv to user
        uint256[] memory amountsRedeemed = new uint256[](1);
        amountsRedeemed[0] = IERC20(inputToken).balanceOf(address(this));
        IERC20(inputToken).transfer(transferTo, amountsRedeemed[0]);

        return amountsRedeemed;
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
