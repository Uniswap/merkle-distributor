// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.17;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IMerkleDistributorToStaking, IRubicStaking} from "./interfaces/IMerkleDistributorToStaking.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

error AlreadyClaimed();
error InvalidProof();

contract MerkleDistributorToStaking is IMerkleDistributorToStaking, Ownable, Pausable {
    using SafeERC20 for IERC20;

    event SweepTokens(address token, uint256 amount, address recipient);

    address public immutable override token;
    bytes32 public immutable override merkleRoot;

    IRubicStaking public immutable override staking;
    uint128 public immutable stakingLockTime;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    constructor(address token_, bytes32 merkleRoot_, IRubicStaking _staking, uint128 _stakingLockTime) {
        token = token_;
        merkleRoot = merkleRoot_;

        staking = _staking;
        stakingLockTime = _stakingLockTime;

        // Approve max to the staking
        IERC20(token).approve(address(staking), type(uint256).max);
    }

    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
        public
        virtual
        override
        whenNotPaused
    {
        if (isClaimed(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();

        // Mark it claimed and send the token.
        _setClaimed(index);
        // IERC20(token).safeTransfer(account, amount);
        staking.enterStakingTo(amount, stakingLockTime, account);

        emit Claimed(index, account, amount);
    }

    function sendToken(
        address _token,
        uint256 _amount,
        address _receiver
    ) internal virtual {
        if (_token == address(0)) {
            Address.sendValue(
                payable(_receiver),
                _amount
            );
        } else {
            IERC20(_token).safeTransfer(
                _receiver,
                _amount
            );
        }
    }

    // ADMIN FUNCTIONS //

    function pauseExecution() external onlyOwner {
        _pause();
    }

    function unpauseExecution() external onlyOwner {
        _unpause();
    }

    /**
     * @dev A function to rescue stuck tokens from the contract
     * @param _token The token to sweep
     * @param _amount The amount of tokens
     * @param _recipient The recipient
     */
    function sweepTokens(
        address _token,
        uint256 _amount,
        address _recipient
    ) external onlyOwner {
        sendToken(_token, _amount, _recipient);

        emit SweepTokens(_token, _amount, _recipient);
    }
}
