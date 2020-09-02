// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "./interfaces/IAirdropTokenDistributor.sol";

contract AirdropTokenDistributor is IAirdropTokenDistributor {
    address public immutable override token;
    bytes32 public immutable override merkleRoot;
    mapping(address => mapping(uint => bool)) public override isClaimed;

    constructor(address token_, bytes32 merkleRoot_) public {
        token = token_;
        merkleRoot = merkleRoot_;
    }

    function claim(address account, uint amount, bytes32[] calldata merkleProof) external override {
        require(!isClaimed[account][amount], 'AirdropTokenDistributor: Drop already claimed.');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'AirdropTokenDistributor: Invalid proof.');

        // Mark it claimed and send the token.
        isClaimed[account][amount] = true;
        require(IERC20(token).transfer(account, amount), 'AirdropTokenDistributor: Transfer failed.');

        emit Claimed(account, amount);
    }
}
