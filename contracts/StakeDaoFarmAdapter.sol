//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "./IAdapter.sol";
import "./Controller.sol";
import "./interfaces/StakeDaoInterfaces.sol";
import "./oz/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract StakeDaoFarmAdapter is IAdapter {
    address private controllerAddress;

    constructor(address _controllerAddress) {
        controllerAddress = _controllerAddress;
    }

    mapping(address => uint256) public userToStakedLpTokens;

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

        (address market, , ) = Controller(controllerAddress).markets(to);

        // transfer LP tokens to adapter
        IERC20(inputToken).transferFrom(pullFrom, address(this), amounts[0]);
        IERC20(inputToken).approve(market, amounts[0]);

        // stake LP tokens into farm to get rewards
        userToStakedLpTokens[onBehalfOf] += amounts[0];
        IStakeDaoYieldFarm(market).deposit(0, amounts[0]);

        return amounts;
    }

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external override returns (uint256[] memory amountsTransferred) {
        (address market, , ) = Controller(controllerAddress).markets(from);

        // unstake LP tokens from farm
        require(userToStakedLpTokens[onBehalfOf] >= amounts[0]);
        userToStakedLpTokens[onBehalfOf] -= amounts[0];
        IStakeDaoYieldFarm(market).withdraw(0, amounts[0]);

        // transfer LP tokens back to user
        address inputToken = Controller(controllerAddress).getMarketInputTokens(
            from
        )[0];
        IERC20(inputToken).transfer(transferTo, amounts[0]);

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
