// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.17;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 amountToMint) ERC20(name_, symbol_) {}
    function mint(address to, uint256 amount) public {}
}
