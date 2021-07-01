//SPDX-License-Identifier: GPLV3

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./IAdapter.sol";
import "./oz/access/Ownable.sol";
import "./oz/token/ERC20/utils/SafeERC20.sol";
import "./utils/IUniswapV2Router02.sol";
import "./utils/IWETH.sol";

contract Controller is Ownable {
    using SafeERC20 for IERC20;

    // uint256 constant ratioPrecision = 10000;
    uint256 private constant deadline = 0xf000000000000000000000000000000000000000000000000000000000000000;
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    IUniswapV2Router02 private swapRouter;
    IWETH private swapWETH;

    // Mapping of market address to protocol name
    mapping(address => bytes32) public marketProtocolName;

    // Mapping of protocol name to adapter address
    mapping(bytes32 => address) public protocolAdapterAddress;

    // Market parameters
    struct Market {
        address market;
        address outputToken;
        address weth;
        address[] inputTokens;
        address[] rewardTokens;
    }

    // Mapping of logical market address to Market struct
    // Actuall contract address to which the adapter needs to interact can be found in Marlet.market
    mapping(address => Market) public markets;

    constructor(address _swapRouter, address _weth) {
        swapRouter = IUniswapV2Router02(_swapRouter);
        swapWETH = IWETH(_weth);
    }

    // TODO add security check
    function addProtocolAdapter(bytes32 name, address adapter)
        external
        onlyOwner
    {
        require(
            protocolAdapterAddress[name] == address(0),
            "Adapter already added for this protocol"
        );
        protocolAdapterAddress[name] = adapter;
    }

    function updateProtocolAdapter(bytes32 name, address adapter)
        external
        onlyOwner
    {
        require(
            protocolAdapterAddress[name] != address(0),
            "Adapter for this protocol does not exist"
        );
        protocolAdapterAddress[name] = adapter;
    }

    function addMarket(
        bytes32 protocolName,
        address marketAddress,
        address contractAddress,
        address outputToken,
        address weth,
        address[] calldata inputTokens,
        address[] calldata rewardTokens
    ) external onlyOwner {
        require(
            protocolAdapterAddress[protocolName] != address(0),
            "Add adapter for the protocol before adding market"
        );
        require(
            marketProtocolName[marketAddress] == "",
            "Market already added"
        );
        marketProtocolName[marketAddress] = protocolName;
        Market storage market = markets[marketAddress];
        market.market = contractAddress;
        market.outputToken = outputToken;
        market.weth = weth;
        market.inputTokens = inputTokens;
        market.rewardTokens = rewardTokens;
    }

    function updateMarket(
        bytes32 protocolName,
        address marketAddress,
        address contractAddress,
        address outputToken,
        address weth,
        address[] calldata inputTokens,
        address[] calldata rewardTokens
    ) external onlyOwner {
        require(
            protocolAdapterAddress[protocolName] != address(0),
            "Add adapter for the protocol before adding market"
        );
        require(marketProtocolName[marketAddress] != "", "Market not added");
        marketProtocolName[marketAddress] = protocolName;
        Market storage market = markets[marketAddress];
        market.market = contractAddress;
        market.outputToken = outputToken;
        market.weth = weth;
        market.inputTokens = inputTokens;
        market.rewardTokens = rewardTokens;
    }

    function getMarketInputTokens(address _market)
        external
        view
        returns (address[] memory)
    {
        Market storage market = markets[_market];
        return market.inputTokens;
    }

    function getMarketRewardTokens(address _market)
        external
        view
        returns (address[] memory)
    {
        Market storage market = markets[_market];
        return market.rewardTokens;
    }

    function _getAdapterForMarket(address market)
        internal
        view
        returns (IAdapter adapter)
    {
        bytes32 name = marketProtocolName[market];
        require(name != "", "Market not added to any protocol");
        adapter = IAdapter(protocolAdapterAddress[name]);
    }

    // For UI
    function getAdapterAddressForMarket(address market)
        external
        view
        returns (address adapterAddress)
    {
        bytes32 name = marketProtocolName[market];
        require(name != "", "Market not added to any protocol");
        adapterAddress = protocolAdapterAddress[name];
    }

    function _withdraw(
        IAdapter adapter,
        address from,
        uint256[] memory amounts,
        bool borrow,
        address pullFrom,
        address transferTo
    ) internal returns (uint256[] memory amountsWithdrawn) {
        if (borrow) {
            amountsWithdrawn = adapter.borrow(
                msg.sender,
                amounts,
                from,
                pullFrom,
                transferTo
            );
        } else {
            amountsWithdrawn = adapter.redeem(
                msg.sender,
                amounts,
                from,
                pullFrom,
                transferTo
            );
        }
    }

    function _deposit(
        IAdapter adapter,
        address to,
        uint256[] memory amounts,
        bool repay,
        address pullFrom,
        address transferTo
    ) internal returns (uint256[] memory amountsDeposited) {
        if (repay) {
            amountsDeposited = adapter.repay{value: msg.value}(
                msg.sender,
                amounts,
                to,
                pullFrom,
                transferTo
            );
        } else {
            amountsDeposited = adapter.invest{value: msg.value}(
                msg.sender,
                amounts,
                to,
                pullFrom,
                transferTo
            );
        }
    }

    // TODO handle WETH to WETH swap for which a pair may not exist
    function _swap(
        address fromToken,
        address toToken,
        uint256 sellAmount
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;

        // Approve swapRouter to pull fromToken;
        IERC20(fromToken).safeIncreaseAllowance(address(swapRouter), sellAmount);

        uint256[] memory amountsOut = swapRouter.swapExactTokensForTokens(
            sellAmount,
            1,
            path,
            address(this),
            deadline
        );
        return amountsOut[1];
    }

    // TODO implement it
    // function getExchangeRate(address fromToken, address toToken)
    //     public
    //     view
    //     returns (uint256)
    // {
    //     return 1000;
    // }

    function _isIntermediateSwapRequired(
        address[] memory fromInputTokens,
        address[] memory toInputTokens
    )
        internal
        pure
        returns (
            bool result,
            bool[] memory sellFromTokens,
            uint256[] memory foundToTokens
        )
    {
        foundToTokens = new uint256[](toInputTokens.length);
        sellFromTokens = new bool[](fromInputTokens.length);
        for (uint256 i = 0; i < fromInputTokens.length; i++) {
            bool found = false;
            uint256 foundIndex;
            for (uint256 j = 0; j < toInputTokens.length; j++) {
                if (fromInputTokens[i] == toInputTokens[j]) {
                    found = true;
                    foundIndex = j;
                    break;
                }
            }
            if (found) {
                foundToTokens[foundIndex] = i + 1;
            } else {
                result = true;
                sellFromTokens[i] = true;
            }
        }
    }

    function _swapToIntermediateToken(
        address[] memory fromInputTokens,
        address[] memory toInputTokens,
        bool[] memory sellFromTokens,
        uint256[] memory foundToTokens,
        uint256[] memory amounts
    ) internal returns (address tokenToBuy, uint256 amountBought) {
        tokenToBuy = toInputTokens[0];
        // Buy token which is not already available to reduce number of swaps
        if (toInputTokens.length > 1) {
            for (uint256 j = 1; j < toInputTokens.length; j++) {
                if (foundToTokens[j - 1] > 0) {
                    tokenToBuy = toInputTokens[j];
                } else {
                    break;
                }
            }
        }

        for (uint256 i = 0; i < fromInputTokens.length; i++) {
            if (!sellFromTokens[i]) {
                continue;
            }
            amountBought += _swap(fromInputTokens[i], tokenToBuy, amounts[i]);
        }
    }

    function _swapTokens(
        address[] memory fromInputTokens,
        address[] memory toInputTokens,
        uint256[] memory amounts
    ) internal returns (uint256[] memory toInputTokenAmounts) {
        (
            bool isSwapRequired,
            bool[] memory sellFromTokens,
            uint256[] memory foundToTokens
        ) = _isIntermediateSwapRequired(fromInputTokens, toInputTokens);
        address tokenBought;
        uint256 amountBought;
        if (isSwapRequired) {
            (tokenBought, amountBought) = _swapToIntermediateToken(
                fromInputTokens,
                toInputTokens,
                sellFromTokens,
                foundToTokens,
                amounts
            );
        }

        toInputTokenAmounts = new uint256[](toInputTokens.length);
        for (uint256 j = 0; j < toInputTokens.length; j++) {
            if (foundToTokens[j] > 0) {
                toInputTokenAmounts[j] = amounts[foundToTokens[j] - 1];
            }
            if (toInputTokens[j] == tokenBought) {
                toInputTokenAmounts[j] = amountBought;
            }
        }
    }

    // function _swapToRatio(
    //     address[] memory tokens,
    //     uint256[] memory amounts,
    //     uint256[] memory ratio
    // ) internal returns (uint256[] memory finalAmounts) {
    //     if (tokens.length == 1) {
    //         finalAmounts[0] = amounts[0];
    //         return finalAmounts;
    //     }

    //     uint256 totalAmount = amounts[0];
    //     address firstToken = tokens[0];
    //     for (uint256 j = 1; j < tokens.length; j++) {
    //         if (amounts[j] > 0) {
    //             totalAmount += amounts[j] * getExchangeRate(tokens[j], firstToken);
    //         }
    //     }

    //     uint256[] memory buyAmounts = new uint256[](tokens.length);
    //     uint256[] memory sellAmounts = new uint256[](tokens.length);
    //     for (uint256 j = 0; j < tokens.length; j++) {
    //         uint256 finalAmount = ratio[j] * totalAmount / ratioPrecision;
    //         if (finalAmount > amounts[j]) {
    //             buyAmounts[j] = finalAmount - amounts[j];
    //         }
    //         if (finalAmount < amounts[j]) {
    //             sellAmounts[j] = amounts[j] - finalAmount;
    //         }
    //     }

    //     for (uint256 j = 0; j < tokens.length; j++) {
    //         if (buyAmounts[j] > 0) {
    //             for (uint256 k = j+1; j < tokens.length; k++) {
    //                 if (sellAmounts[k] > 0) {
    //                     uint256 rate = getExchangeRate(tokens[k], tokens[j]);
    //                     uint256 maxBuy = rate * sellAmounts[k];
    //                     uint256 amountToSell = sellAmounts[k];
    //                     if (maxBuy > buyAmounts[j]) {
    //                         amountToSell = buyAmounts[j] / rate;
    //                     }
    //                     uint256 amountBought = _swap(tokens[k], tokens[j], amountToSell);
    //                     buyAmounts[j] = buyAmounts[j] - amountBought;
    //                     sellAmounts[k] = sellAmounts[k] - amountToSell;
    //                     if (buyAmounts[j] == 0) {
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //         if (sellAmounts[j] > 0) {
    //             for (uint256 k = j+1; j < tokens.length; k++) {
    //                 if (buyAmounts[k] > 0) {
    //                     uint256 rate = getExchangeRate(tokens[j], tokens[k]);
    //                     uint256 maxBuy = rate * sellAmounts[j];
    //                     uint256 amountToSell = sellAmounts[j];
    //                     if (maxBuy > buyAmounts[k]) {
    //                         amountToSell = buyAmounts[k] / rate;
    //                     }
    //                     uint256 amountBought = _swap(tokens[j], tokens[k], amountToSell);
    //                     buyAmounts[k] = buyAmounts[k] - amountBought;
    //                     sellAmounts[j] = sellAmounts[j] - amountToSell;
    //                     if (sellAmounts[j] == 0) {
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    function withdraw(
        address from,
        uint256[] memory amounts,
        bool borrow
    ) external returns (uint256[] memory amountsWithdrawn) {
        IAdapter adapter = _getAdapterForMarket(from);
        return _withdraw(adapter, from, amounts, borrow, msg.sender, msg.sender);
    }

    function deposit(
        address to,
        uint256[] memory amounts,
        bool repay
    ) external returns (uint256[] memory amountsDeposited) {
        IAdapter adapter = _getAdapterForMarket(to);
        return _deposit(adapter, to, amounts, repay, msg.sender, msg.sender);
    }

    function depositOtherTokens(
        address to,
        address[] memory tokens,
        uint256[] memory amounts,
        bool repay
    ) external payable returns (uint256[] memory amountsDeposited) {
        // Check for ETH
        for (uint256 i; i < tokens.length; i++) {
            if (tokens[i] == ETH || tokens[i] == address(0)) {
                swapWETH.deposit{value: amounts[i]}();
                tokens[i] = address(swapWETH);
            }
        }

        // Swap tokens as required
        Market memory toMarket = markets[to];
        uint256[] memory toInputTokenAmounts = _swapTokens(
            tokens,
            toMarket.inputTokens,
            amounts
        );

        IAdapter adapter = _getAdapterForMarket(to);
        return _deposit(adapter, to, toInputTokenAmounts, repay, msg.sender, msg.sender);
    }

    function migrate(
        address from,
        address to,
        uint256[] calldata amounts,
        bool borrow,
        bool repay
    )
        external
        returns (
            uint256[] memory amountsWithdrawn,
            uint256[] memory amountsDeposited
        )
    {
        require(from != msg.sender, "Use deposit function instead of migrate");
        require(to != msg.sender, "Use withdraw funcion instead of migrate");

        IAdapter fromAdapter = _getAdapterForMarket(from);
        IAdapter toAdapter = _getAdapterForMarket(to);

        Market memory fromMarket = markets[from];
        Market memory toMarket = markets[to];

        // Withdraw from first market
        // fromAdapter is supposed to transfer withdrawan tokens to controller instead of user
        amountsWithdrawn = _withdraw(
            fromAdapter,
            from,
            amounts,
            borrow,
            msg.sender,
            address(this)
        );

        // Swap withdrawan tokens to the tokens that needs to be deposited in second market
        uint256[] memory toInputTokenAmounts = _swapTokens(
            fromMarket.inputTokens,
            toMarket.inputTokens,
            amountsWithdrawn
        );

        // Swap second market input tokens to correct ratio
        uint256[] memory amountsToDeposit = toInputTokenAmounts;
        // bool ratioCorrectionRequired = toAdapter.ratioCorrectionRequired();
        // if (ratioCorrectionRequired) {
        //     amountsToDeposit = _swapToRatio(toMarket.inputTokens, toInputTokenAmounts, toAdapter.getInputTokenRatio());
        // }

        // Transfer second protocol input tokens to toAdapter
        for (uint256 j = 0; j < toMarket.inputTokens.length; j++) {
            IERC20 token = IERC20(toMarket.inputTokens[j]);
            token.safeIncreaseAllowance(
                address(toAdapter),
                amountsToDeposit[j]
            );
        }

        // Deposit tokens to second protocol
        amountsDeposited = _deposit(
            toAdapter,
            to,
            amountsToDeposit,
            repay,
            address(this),
            msg.sender
        );

        // Return difference in amountsDeposited and amountsToDeposit to the user
        for (uint256 j = 0; j < toMarket.inputTokens.length; j++) {
            if (amountsDeposited[j] < amountsToDeposit[j]) {
                IERC20 token = IERC20(toMarket.inputTokens[j]);
                token.safeTransfer(
                    msg.sender,
                    amountsToDeposit[j] - amountsDeposited[j]
                );
            }
        }
    }
}
