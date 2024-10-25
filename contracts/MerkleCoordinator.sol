// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.17;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

import {MerkleDistributor} from './MerkleDistributor.sol';

/**
 * @notice The coordinator is responsible for deploying new MerkleDistributors,
 *         setting the latest MerkleDistributor,
 *         and centralize the claiming of tokens for accounts
 */
contract MerkleCoordinator is Ownable {
    /// @notice The latest active MerkleDistributor
    MerkleDistributor public latestMerkleDistributor;

    constructor() {}

    /**
     * @notice Deploy a new MerkleDistributor
     * @param token The address of the token to distribute (TRUST)
     * @param merkleRoot The merkle root of the merkle tree
     * @param endTime The deadline for claiming
     * @return The address of the new MerkleDistributor
     */
    function deployMerkleDistributor(
        address token,
        bytes32 merkleRoot,
        uint256 endTime
    ) external onlyOwner returns (address) {
        latestMerkleDistributor = new MerkleDistributor(owner(), token, merkleRoot, endTime);
        return address(latestMerkleDistributor);
    }

    /**
     * @notice Set the latest MerkleDistributor
     * @param merkleDistributor The address of the new MerkleDistributor
     */
    function setLatestMerkleDistributor(address merkleDistributor) external onlyOwner {
        latestMerkleDistributor = MerkleDistributor(merkleDistributor);
    }

    /**
     * @notice Get the latest MerkleDistributor
     * @return The address of the latest MerkleDistributor
     */
    function getLatestMerkleDistributor() external view returns (address) {
        return address(latestMerkleDistributor);
    }

    /**
     * @notice Check if an index has been claimed
     * @param index The index to check
     * @return True if the index has been claimed, false otherwise
     */
    function isClaimed(uint256 index) public view returns (bool) {
        return latestMerkleDistributor.isClaimed(index);
    }

    /**
     * @notice Claim tokens for an account
     *         It'll call the claim function for the last active MerkleDistributor
     * @param index The index of the account in the merkle tree
     * @param account The address of the account
     * @param amount The amount of tokens to claim
     * @param merkleProof The merkle proof of the account
     */
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external {
        latestMerkleDistributor.claim(index, account, amount, merkleProof);
    }
}
