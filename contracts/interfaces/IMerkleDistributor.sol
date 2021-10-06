// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

// Allows anyone to claim a token if they exist in a merkle root.
interface IMerkleDistributor {
    // Returns the address of the token distributed by this contract.
    function token() external view returns (address);
    // Returns the merkle root of the merkle tree containing account balances available to claim.
    function merkleRoot() external view returns (bytes32);
    // Returns the number of blocks the airdrop will operate.
    function maxBlocks() external view returns (uint256);
    // Returns the starting block of the drop.
    function startingBlock() external view returns (uint256);
    // Returns the address of the collector contract.
    function collector() external view returns (address);

    // Returns true if the index has been marked claimed.
    function isClaimed(uint256 index) external view returns (bool);
    // Claim the given amount of the token to the given address. Reverts if the inputs are invalid.
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external;
    // Claim the given amount of the token to the given address and then delegates the votes. Reverts if the inputs are invalid.
    function delegateToClaim(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s, uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external;

    // Sweeps all the funds to the collector address
    function sweep() external;

    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, address account, uint256 amount);
}