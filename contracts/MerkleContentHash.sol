// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.11;

import '@openzeppelin/contracts/cryptography/MerkleProof.sol';
import './interfaces/IMerkleContentHash.sol';

contract MerkleContentHash is IMerkleContentHash {
    bytes32 public immutable override merkleRoot;

    constructor(bytes32 merkleRoot_) public {
        merkleRoot = merkleRoot_;
    }

    function isValid(
        uint256 index,
        string memory urn,
        string memory contentHash,
        bytes32[] calldata merkleProof
    ) external view override returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(index, urn, contentHash));

        return MerkleProof.verify(merkleProof, merkleRoot, node);
    }
}
