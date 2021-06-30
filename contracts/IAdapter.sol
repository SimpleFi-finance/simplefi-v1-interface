//SPDX-License-Identifier: GPLV3

pragma solidity ^0.8.0;

// TODO data argument to specify any protocol specific parameters

interface IAdapter {
    function invest(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable returns (uint256[] memory amountsTransferred);

    function redeem(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external payable returns (uint256[] memory amountsTransferred);

    function borrow(
        address onBehalfOf,
        uint256[] calldata amounts,
        address from,
        address pullFrom,
        address transferTo
    ) external payable returns (uint256[] memory amountsTransferred);

    function repay(
        address onBehalfOf,
        uint256[] calldata amounts,
        address to,
        address pullFrom,
        address transferTo
    ) external payable returns (uint256[] memory amountsTransferred);

    // function ratioCorrectionRequired() external view returns (bool);

    // function getInputTokenRatio() external view returns (uint256[] memory);
}
