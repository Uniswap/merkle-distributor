// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interfaces/IMerkleDistributor.sol";

contract MerkleDistributor is IMerkleDistributor {
    address public immutable override token;
    bytes32 public immutable override merkleRoot;
    uint256 public immutable override maxBlocks;
    uint256 public immutable override startingBlock;
    address public immutable override collector;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    constructor(address token_, bytes32 merkleRoot_, uint256 maxBlocks_, address collector_)  {
        token = token_;
        merkleRoot = merkleRoot_;
        maxBlocks = maxBlocks_;
        collector = collector_;
        startingBlock = block.number;
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

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external override {
        require(!isClaimed(index), 'MerkleDistributor: Drop already claimed.');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'MerkleDistributor: Invalid proof.');

        // Mark it claimed and send the token.
        _setClaimed(index);
        require(IERC20(token).transfer(account, amount), 'MerkleDistributor: Transfer failed.');

        emit Claimed(index, account, amount);
    }

    function delegateToClaim(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s, uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external override {

        // Claim
        this.claim(index, account, amount, merkleProof);

        // Delegate
        ERC20Votes(token).delegateBySig(delegatee, nonce, expiry, v, r, s);
    }

    // Cleanup function anyone can call it after 1,000,000 blocks to send all remaining tokens to the collector
    // All claims will fail after that since the contract will not have tokens left.
    // Not using selfdestruct as it is considered harmful
    function sweep() external override {
        require(block.number > startingBlock + maxBlocks, "Drop has not ended yet");
        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(collector, amount);
    }
}
