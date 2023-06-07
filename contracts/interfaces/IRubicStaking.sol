// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRubicStaking {
    function enterStaking(uint256 _amount, uint128 _lockTime) external;

    function enterStakingTo(uint256 _amount, uint128 _lockTime, address _to) external;

    event Enter(uint256 amount, uint128 lockTime, uint256 tokenId);
    event Unstake(uint256 amount, uint256 tokenId);
    event Migrate(uint256 amount, uint128 lockTime, uint256 tokenId);
    event Claim(uint256 amount, uint256 tokenId);
    event AddRewards(uint256 amount);
    event Rate(uint256 rate);
    event EmergencyStop(bool isStopped);
}