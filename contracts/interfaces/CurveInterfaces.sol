// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.7.0;

interface ICurveDeposit {
    function add_liquidity(
        uint256[3] calldata _amounts,
        uint256 _min_mint_amount,
        bool _use_underlying
    ) external returns (uint256);

    function remove_liquidity(uint256 _amount, uint256[3] calldata _min_amounts)
        external
        returns (uint256[3] calldata);

    function coins(uint256 i) external view returns (address);

    function underlying_coins(uint256 i) external view returns (address);
}

interface ICurveRegistry {
    function get_registry() external;

    function pool_count() external;

    function get_pool_from_lp_token(address lp_token) external;
}

interface ICurveFi_Gauge {
    function lp_token() external view returns (address);

    function crv_token() external view returns (address);

    function balanceOf(address addr) external view returns (uint256);

    function deposit(uint256 _value) external;

    function withdraw(uint256 _value) external;

    function claimable_tokens(address addr) external returns (uint256);

    function minter() external view returns (address); //use minter().mint(gauge_addr) to claim CRV

    function integrate_fraction(address _for) external view returns (uint256);

    function user_checkpoint(address _for) external returns (bool);
}

interface ICurveFi_Minter {
    function mint(address gauge_addr) external;

    function minted(address _for, address gauge_addr)
        external
        view
        returns (uint256);

    function toggle_approve_mint(address minting_user) external;

    function token() external view returns (address);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}
