// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

interface ITrust {
    /// @notice Mint new energy tokens to an address
    ///
    /// @param to Address to mint to
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external;
}
