// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// Allows anyone to claim a token if they exist in a merkle root.
interface IMerkleDistributor {
    function token() external view returns (address);
    function merkleRoot() external view returns (bytes32);
    function isWhitelisted(address _address) external view returns (bool);
    function toggleAddress(address _addr) external;
    function toggleAddresses(address[] memory addrs) external;
    function pullOutFunds() external;

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external;

    event Claimed(uint256 index, address account, uint256 amount);
}