//SPDX-License-Identifier: GPLV3
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "./IAdapter.sol";

contract Controller {
    // Mapping of market address to protocol name
    mapping(address => bytes32) public marketProtocolName;

    // Mapping of protocol name to adapter address
    mapping(bytes32 => address) public protocolAdapterAddress;

    function move(
        address from,
        address to,
        address[] calldata fromTokens,
        address[] calldata toTokens,
        uint256[] calldata amounts,
        bool borrow,
        bool repay,
        uint8 ethIndex
    ) external returns (uint256[] memory amountsMoved) {
        // Should be adapter
        if (ethIndex < 255) {
            // Convert ETH to WETH
        }

        // Find adapter to be used to withdraw tokens
        bytes32 fromName = marketProtocolName[from];
        // Check for non zero value
        address fromAdapterAddress = protocolAdapterAddress[fromName];
        // Check for zero address

        IAdapter fromAdapter = IAdapter(fromAdapterAddress);
        uint256[] memory amountsWithdrawan;
        if (borrow) {
            amountsWithdrawan = fromAdapter.borrow(
                msg.sender,
                fromTokens,
                amounts,
                from,
                ethIndex
            );
        } else {
            amountsWithdrawan = fromAdapter.redeem(
                msg.sender,
                fromTokens,
                amounts,
                from,
                ethIndex
            );
        }

        // Logic to swap tokens if required
        uint256[] memory amountsSwapped = amountsWithdrawan;

        // Optmization done by checking if toName and fromName are same

        // Find adapter to be used to withdraw tokens
        bytes32 toName = marketProtocolName[to];
        // Check for non zero value
        address toAdapterAddress = protocolAdapterAddress[toName];
        // Check for zero address

        IAdapter toAdapter = IAdapter(toAdapterAddress);
        if (repay) {
            amountsMoved = toAdapter.repay(
                msg.sender,
                toTokens,
                amountsSwapped,
                from,
                ethIndex
            );
        } else {
            amountsMoved = toAdapter.invest(
                msg.sender,
                toTokens,
                amountsSwapped,
                from,
                ethIndex
            );
        }

        // Return remaining from amounts and amountsSwapped
    }
}
