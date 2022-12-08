// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.17;

import {MerkleDistributor} from "./MerkleDistributor.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

error EndTimeInPast();
error ClaimWindowFinished();
error NoWithdrawDuringClaim();

contract MerkleDistributorWithDeadline is MerkleDistributor {
    using SafeERC20 for IERC20;

    uint256 public endTime;

    constructor(address token_, bytes32 merkleRoot_, uint256 endTime_) MerkleDistributor(token_, merkleRoot_) {
        if (endTime_ <= block.timestamp) revert EndTimeInPast();
        endTime = endTime_;
    }

    // @notice Set next Airdrop cycle, addresses that were eligible for a claim in the previous cycle will be eligible for a claim until claimed
    // @dev Set new end period and new Merkle root
    function setNextCycle(bytes32 _merkleRoot, uint256 _endTime) public onlyOwner {
        super.setMerkleRoot(_merkleRoot);
        endTime = _endTime;
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) public override {
        if (block.timestamp > endTime) revert ClaimWindowFinished();
        super.claim(index, account, amount, merkleProof);
    }

    function withdraw() external onlyOwner {
        if (block.timestamp < endTime) revert NoWithdrawDuringClaim();
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}
