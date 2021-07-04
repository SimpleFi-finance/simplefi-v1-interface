// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

interface IStakeDaoLpPool {
    function balance() external view returns (uint256);

    function token() external view returns (address);

    function deposit(uint256 _amount) external;

    function withdraw(uint256 _shares) external;
}

interface IStakeDaoYieldFarm {
    function poolLength() external view returns (uint256);

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function userInfo(uint256 _pid, address _user)
        external
        returns (uint256, uint256);
}
