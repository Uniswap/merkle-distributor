// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IRubicStaking.sol';

contract TestStaking is IRubicStaking, ERC721Enumerable {
    struct Stake {
        uint128 lockTime;
        uint128 lockStartTime;
        uint256 amount;
        uint256 lastRewardGrowth;
    }

    IERC20 public immutable RBC;
    uint256 constant PRECISION = 10**29;

    mapping(uint256 => Stake) public stakes;
    uint256 public rewardRate;
    uint256 public rewardReserve;
    uint128 public prevTimestamp;

    uint256 public virtualRBCBalance;
    uint256 public rewardGrowth = 1;
    bool public emergencyStop;

    uint256 private _tokenId = 1;

    constructor(address _RBC) ERC721('Rubic Staking NFT', 'RBC-STAKE') {
        RBC = IERC20(_RBC);
        prevTimestamp = uint128(block.timestamp);
    }

    modifier isAuthorizedForToken(uint256 tokenId) {
        require(_isApprovedOrOwner(msg.sender, tokenId), 'Not authorized');
        _;
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ownedTokens = new uint256[](balance);

        for (uint256 i; i < balance; i++) {
            ownedTokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return ownedTokens;
    }

    function enterStaking(uint256 _amount, uint128 _lockTime) external override {
        require(_amount > 0, 'stake amount should be correct');
        require(!emergencyStop, 'staking is stopped');

        RBC.transferFrom(msg.sender, address(this), _amount);
        uint256 tokenId = _stake(_amount, _lockTime, msg.sender);
        emit Enter(_amount, _lockTime, tokenId);
    }

    function enterStakingTo(uint256 _amount, uint128 _lockTime, address _to) external override {
        require(_amount > 0, 'stake amount should be correct');
        require(_to != address(0), 'to is zero');
        require(!emergencyStop, 'staking is stopped');

        RBC.transferFrom(msg.sender, address(this), _amount);
        uint256 tokenId = _stake(_amount, _lockTime, _to);
        emit Enter(_amount, _lockTime, tokenId);
    }

    function _stake(uint256 _amount, uint128 _lockTime, address _to) private returns (uint256 tokenId) {
        virtualRBCBalance += getAmountWithMultiplier(_amount, _lockTime);
        tokenId = _tokenId++;
        stakes[tokenId] = Stake({
            lockTime: _lockTime,
            lockStartTime: uint128(block.timestamp),
            amount: _amount,
            lastRewardGrowth: rewardGrowth
        });

        _mint(_to, tokenId);
    }

    function getAmountWithMultiplier(uint256 amount, uint128 lockTime) private pure returns (uint256) {
        if (lockTime == 30 days) return (10 * amount) / 10;
        if (lockTime == 90 days) return (10 * amount) / 10;
        if (lockTime == 180 days) return (12 * amount) / 10;
        if (lockTime == 270 days) return (15 * amount) / 10;
        if (lockTime == 360 days) return (20 * amount) / 10;
        revert('incorrect lock');
    }
}