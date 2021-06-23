//SPDX-License-Identifier: GPLV3
pragma solidity ^0.7.0;

// TODO data argument to specify any protocol specific parameters

interface IAdapter {
    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function invest(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    // Adapter needs to claim ither reward tokens as well
    function redeem(
        address onBehalfOf,
        address tokenToBurn,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function borrow(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external returns (uint256[] memory amountsTransferred);

    // ethIndex is index of ETH amount in amounts array - 255 means no eth
    function repay(
        address onBehalfOf,
        address[] calldata tokens,
        uint256[] calldata amounts,
        address to,
        uint8 ethIndex
    ) external payable returns (uint256[] memory amountsTransferred);

    // ???
}
