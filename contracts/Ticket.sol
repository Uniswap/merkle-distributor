//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Ticket is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public whitelist;  
    constructor() ERC20("Risk Harbor Ticket", "RxHT") {
        whitelist[msg.sender] = true;
        whitelist[address(0)] = true;
        whitelist[address(this)] = true;
        _mint(msg.sender, 1000);
    }

    function mint(uint256 _amount) onlyOwner external {
        _mint(msg.sender, _amount);
    }

    function toggleAddress(address _addr) onlyOwner external {
        whitelist[_addr] = !whitelist[_addr];
    }
    
    function toggleAddresses(address[] memory addrs) onlyOwner external{
        for(uint i = 0; i < addrs.length; i++){
            whitelist[addrs[i]] = !whitelist[addrs[i]];
        }
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal virtual override
    {
        super._beforeTokenTransfer(from, to, amount);

        require(_validRecipient(from), "ERC20WithSafeTransfer: invalid recipient");
    }

    function _validRecipient(address from) private view returns (bool) {
        return (whitelist[from]);
    }
}
