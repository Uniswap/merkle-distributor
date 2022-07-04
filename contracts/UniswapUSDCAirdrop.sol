// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.15;

import "./MerkleDistributor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapUSDCAirdrop is MerkleDistributor, Ownable {
    uint256 public immutable endTime;

    constructor (address token_, bytes32 merkleRoot_, uint256 endTime_) MerkleDistributor (token_, merkleRoot_) {
        endTime = endTime_;
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) public override {
        require(block.timestamp < endTime, "Claim window is finished");
        super.claim(index, account, amount, merkleProof);
    }

    function withdraw() external onlyOwner {
        require(block.timestamp >= endTime, "Cannot withdraw during claim window");
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}