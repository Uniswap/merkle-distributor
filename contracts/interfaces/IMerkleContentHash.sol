// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;

interface IMerkleContentHash {
    // Returns the merkle root of the merkle tree containing account balances available to claim.
    function merkleRoot() external view returns (bytes32);

    // Returns whether a given content hash is valid or not.
    function isValid(
        uint256 index,
        string memory urn,
        string memory contentHash,
        bytes32[] calldata merkleProof
    ) external view returns (bool);
}
