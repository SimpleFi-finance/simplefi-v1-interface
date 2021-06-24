//SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./IAdapter.sol";

contract Controller {
    // Mapping of market address to protocol name
    mapping(address => bytes32) public marketProtocolName;

    // Mapping of protocol name to adapter address
    mapping(bytes32 => address) public protocolAdapterAddress;

    // Mapping of market address to tokens that the market accepts, mints or transfers
    mapping(address => address[]) public marketInputTokens;
    mapping(address => address) public marketOutputToken;
    mapping(address => address[]) public marketRewardTokens;
    mapping(address => address) public marketWETH;

    function migrate(
        address from,
        address to,
        uint256[] calldata amounts,
        bool borrow,
        bool repay,
        Swap[] calldata swaps
    ) external returns (uint256[] memory amountsMoved) {
        // Find adapter to be used to withdraw tokens
        bytes32 fromName = marketProtocolName[from];
        // Check for non zero value
        address fromAdapterAddress = protocolAdapterAddress[fromName];
        // Check for zero address

        IAdapter fromAdapter = IAdapter(fromAdapterAddress);
        uint256[] memory amountsWithdrawn;
        if (borrow) {
            amountsWithdrawn = fromAdapter.borrow(msg.sender, amounts, from);
        } else {
            amountsWithdrawn = fromAdapter.redeem(msg.sender, amounts, from);
        }

        // Optmization done by checking if toName and fromName are same
        // Find adapter to be used to deposit tokens
        bytes32 toName = marketProtocolName[to];
        // Check for non zero value
        address toAdapterAddress = protocolAdapterAddress[toName];
        // Check for zero address
        IAdapter toAdapter = IAdapter(toAdapterAddress);

        // Logic to swap tokens if required
        // Swap[] memory swaps = getSwapAmounts(
        //     from,
        //     to,
        //     toAdapter,
        //     amountsWithdrawn
        // );
        uint256[] memory amountsSwapped = executeSwaps(swaps);

        if (repay) {
            amountsMoved = toAdapter.repay(msg.sender, amountsSwapped, to);
        } else {
            amountsMoved = toAdapter.invest(msg.sender, amountsSwapped, to);
        }

        // Return remaining from amounts and amountsSwapped
    }

    struct Swap {
        address from;
        address to;
        uint256 fromAmount;
        uint256 toAmount;
        bool fromFixed;
    }

    // Can develop a public verison in which we don't have adapter instances
    function getSwapAmounts(
        address from,
        address to,
        IAdapter toAdapter,
        uint256[] memory amounts
    ) internal returns (Swap[] memory swaps) {
        uint256 ratioPrecision = 10000;
        address[] memory fromInputTokens = marketInputTokens[from];
        address[] memory toInputTokens = marketInputTokens[to];
        uint256[] memory toRatio = toAdapter.getInputTokenRatio();

        // Calculate tokens to buy and sell
        uint256 totalAmount = 0;
        uint256[] memory availableToAmounts = new uint256[](toInputTokens.length);
        uint256[] memory sellableFromAmounts = new uint256[](fromInputTokens.length);
        uint256[] memory fromTokenRates = new uint256[](fromInputTokens.length);
        for (uint256 i = 0; i < fromInputTokens.length; i++) {
            fromTokenRates[i] = getExchangeRateToETH(fromInputTokens[i]);
            uint256 amount = amounts[i] * fromTokenRates[i];
            totalAmount += amount;

            bool found = false;
            uint256 foundIndex;
            for (uint256 j; j < toInputTokens.length; j++) {
                if (fromInputTokens[i] == toInputTokens[j]) {
                    found = true;
                    foundIndex = j;
                    break;
                }
            }
            if (found) {
                availableToAmounts[foundIndex] = amount;
            } else {
                sellableFromAmounts[i] = amount;
            }
        }

        // Assumption - ratio is in terms of value of tokens. It not ratio of count of tokens
        // For example if we need to deposit 1 ETH and 2000 DAI in a pool then ratio will be
        // assuming 1 ETH = 2000 DAI
        // ratio[0] = 50, ratio[1] = 50
        uint256[] memory buyTokenAmounts = new uint256[](toInputTokens.length);
        uint256[] memory sellTokenAmounts = new uint256[](toInputTokens.length);
        uint256[] memory toTokenRates = new uint256[](fromInputTokens.length);
        for (uint256 i = 0; i < toInputTokens.length; i++) {
            toTokenRates[i] = getExchangeRateToETH(toInputTokens[i]);
            uint256 amount = (toRatio[i] / ratioPrecision) * totalAmount;
            if (amount > availableToAmounts[i]) {
                buyTokenAmounts[i] = amount - availableToAmounts[i];
            } else {
                sellTokenAmounts[i] = availableToAmounts[i] - amount;
            }
        }

        // Swap is done in two way to simply calculations
        // From token to ETH and then ETH to to token
        address fromWETH = marketWETH[from];
        address toWETH = marketWETH[to];
        swaps = new Swap[](fromInputTokens.length + toInputTokens.length);
        for (uint256 i = 0; i < fromInputTokens.length; i++) {
            if (sellableFromAmounts[i] > 0) {
                swaps[i] = Swap(fromInputTokens[i], fromWETH, amounts[i], sellableFromAmounts[i], true);
            }
        }
        for (uint256 i = 0; i < toInputTokens.length; i++) {
            uint256 swapIndex = fromInputTokens.length + i;
            if (sellTokenAmounts[i] > 0) {
                // we can use toTokenRates here
                uint256 amountToSell = (availableToAmounts[i] - sellTokenAmounts[i])/toTokenRates[i];
                swaps[swapIndex] = Swap(toInputTokens[i], toWETH, amountToSell, sellTokenAmounts[i], true);
            } else if (buyTokenAmounts[i] > 0) {
                uint256 amountToBuy = buyTokenAmounts[i]/toTokenRates[i];
                swaps[swapIndex] = Swap(toWETH, toInputTokens[i], buyTokenAmounts[i], amountToBuy, false);
            }
        }

        // 
    }

    // TODO implement with chainlink oracle price feeds
    function getExchangeRateToETH(address from) public view returns (uint256) {
        return 1357;
    }

    // TODO implement with shushiswap or quickswap
    function executeSwaps(Swap[] memory swaps) public returns (uint256[] memory amounts) {
        amounts = new uint256[](swaps.length);
        for (uint256 i; i < swaps.length; i++) {
            amounts[i] = swaps[i].toAmount;
        }
    }
}
