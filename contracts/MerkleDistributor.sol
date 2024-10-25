// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.17;

import {MerkleProof} from '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

import {ITrust} from './interfaces/ITrust.sol';
import {IMerkleDistributor} from './interfaces/IMerkleDistributor.sol';

/// @notice Errors thrown by the MerkleDistributor
error AlreadyClaimed();
error InvalidProof();
error InvalidSender();
error EndTimeInPast();
error ClaimWindowFinished();

/**
 * @notice A MerkleDistributor is responsible for distributing tokens to accounts
 *         based on a merkle tree
 */
contract MerkleDistributor is IMerkleDistributor, Ownable {
    /// @notice The coordinator of the MerkleDistributor
    address public coordinator;

    /// @notice The deadline for claiming
    uint256 public immutable endTime;

    /// @notice The token to distribute
    address public immutable override token;

    /// @notice The merkle root of the merkle tree
    bytes32 public immutable override merkleRoot;

    /// @notice A packed array of booleans to track claimed indexes
    mapping(uint256 => uint256) private claimedBitMap;

    /**
     * @notice Deploy a new MerkleDistributor
     * @param _coordinator The address of the coordinator
     * @param _token The address of the token to distribute
     * @param _merkleRoot The merkle root of the merkle tree
     * @param _endTime The deadline for claiming
     */
    constructor(address _coordinator, address _token, bytes32 _merkleRoot, uint256 _endTime) {
        if (_endTime <= block.timestamp) revert EndTimeInPast();

        coordinator = _coordinator;
        token = _token;
        merkleRoot = _merkleRoot;
        endTime = _endTime;
    }

    /**
     * @notice Check if an index has been claimed
     * @param index The index to check
     * @return True if the index has been claimed, false otherwise
     */
    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /**
     * @notice Set an index as claimed
     * @param index The index to set as claimed
     */
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    /**
     * @notice Claim tokens for an account
     * @param index The index of the account in the merkle tree
     * @param account The address of the account
     * @param amount The amount of tokens to claim
     * @param merkleProof The merkle proof of the account
     */
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) public virtual override {
        if (block.timestamp > endTime) {
            revert ClaimWindowFinished();
        }
        if (msg.sender != coordinator && msg.sender != account) {
            revert InvalidSender();
        }
        if (isClaimed(index)) {
            revert AlreadyClaimed();
        }

        /// @notice The node to verify
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();

        /// @notice Mark the index as claimed
        _setClaimed(index);

        /// @notice Mint the tokens to the account. The coordinator should be a minter
        ITrust(token).mint(account, amount);

        emit Claimed(index, account, amount);
    }
}
