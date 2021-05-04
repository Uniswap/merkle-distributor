// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "./interfaces/IMerkleDistributor.sol";

contract MerkleDistributor is IMerkleDistributor, Ownable {
    address public immutable override token;
    bytes32 public immutable override merkleRoot;

    mapping(address => bool) private whitelist;

    constructor(address token_, bytes32 merkleRoot_) {
        token = token_;
        merkleRoot = merkleRoot_;
    }

    function isWhitelisted(address _address) public view override returns (bool) {
        return whitelist[_address];
    }

    function setWhitelisted(address _address) private {
        whitelist[_address] = true;
    }
    
    function toggleAddress(address _addr) onlyOwner external override {
        whitelist[_addr] = !whitelist[_addr];
    }
    
    function toggleAddresses(address[] memory addrs) onlyOwner external override {
        for(uint i = 0; i < addrs.length; i++){
            whitelist[addrs[i]] = !whitelist[addrs[i]];
        }
    }
    
    function pullOutFunds() onlyOwner external override {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(msg.sender, bal);
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external override {
        require(!isWhitelisted(account), 'MerkleDistributor: Drop already claimed.');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'MerkleDistributor: Invalid proof.');

        // Mark it claimed and send the token.
        setWhitelisted(account);
        require(IERC20(token).transfer(account, amount), 'MerkleDistributor: Transfer failed.');

        emit Claimed(index, account, amount);
    }
}
