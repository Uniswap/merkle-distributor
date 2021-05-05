//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//import "hardhat/console.sol";

contract Currency is ERC20 {
    constructor(uint256 _initialSupply) ERC20("Gold", "GLD") {
        _mint(msg.sender, _initialSupply);
    }

    function mint(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }

    function redeem(uint256 _amount) external returns (uint256) {
        _mint(msg.sender, _amount);
        return _amount;
    }
}
