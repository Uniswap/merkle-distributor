// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "./interfaces/IAirdropTokenDistributor.sol";

contract AirdropTokenDistributor is IAirdropTokenDistributor {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

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
        // TODO(moodysalem): encode or encodePacked? Any ambiguity?
        bytes32 node = keccak256(abi.encode(account, amount));

        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'AirdropTokenDistributor: Invalid proof.');

        // Mark it claimed and send the token.
        isClaimed[account][amount] = true;
        IERC20(token).safeTransfer(account, amount);

        emit Claimed(account, amount);
    }
}
