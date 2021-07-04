// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

interface ICurveDeposit {
    function add_liquidity(
        uint256[2] calldata _amounts,
        uint256 _min_mint_amount,
        bool _use_underlying
    ) external returns (uint256);

    function add_liquidity(
        uint256[3] calldata _amounts,
        uint256 _min_mint_amount,
        bool _use_underlying
    ) external returns (uint256);

    function add_liquidity(
        uint256[4] calldata _amounts,
        uint256 _min_mint_amount,
        bool _use_underlying
    ) external returns (uint256);

    function remove_liquidity(
        uint256 _amount,
        uint256[2] calldata _min_amounts,
        bool _use_underlying
    ) external returns (uint256[2] calldata);

    function remove_liquidity(
        uint256 _amount,
        uint256[3] calldata _min_amounts,
        bool _use_underlying
    ) external returns (uint256[3] calldata);

    function remove_liquidity(
        uint256 _amount,
        uint256[4] calldata _min_amounts,
        bool _use_underlying
    ) external returns (uint256[4] calldata);

    function remove_liquidity_imbalance(
        uint256[2] calldata _amounts,
        uint256 _max_burn_amount,
        bool _use_underlying
    ) external returns (uint256);

    function remove_liquidity_imbalance(
        uint256[3] calldata _amounts,
        uint256 _max_burn_amount,
        bool _use_underlying
    ) external returns (uint256);

    function remove_liquidity_imbalance(
        uint256[4] calldata _amounts,
        uint256 _max_burn_amount,
        bool _use_underlying
    ) external returns (uint256);

    function coins(uint256 i) external view returns (address);

    function underlying_coins(uint256 i) external view returns (address);
}

interface ICurveGauge {
    function balanceOf(address arg0) external view returns (uint256);

    function lp_token() external view returns (address);

    function approve(address _spender, uint256 _value) external returns (bool);

    function deposit(uint256 _value) external;

    function deposit(uint256 _value, address _addr) external;

    function withdraw(uint256 _value, bool _claim_rewards) external;

    function claim_rewards(address _addr) external;

    function claimable_reward(address _addr, address _token)
        external
        view
        returns (uint256);
}
