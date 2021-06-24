//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

// TODO data argument to specify any protocol specific parameters

interface IAdapter {
    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function invest(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to
    ) external returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    // Adapter needs to claim ither reward tokens as well
    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from
    ) external returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function borrow(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from
    ) external returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function repay(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to
    ) external returns (uint256[] memory amountsTransferred);

    function getInputTokenRatio() external returns (uint256[] memory);
}