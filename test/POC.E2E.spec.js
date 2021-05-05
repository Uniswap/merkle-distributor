
// import {ethers} from "hardhat";
// import { BigNumber, Contract, ethers, providers } from "ethers";
// import { expect } from "chai";

const { ethers } = require("hardhat");
const { expect } = require('chai');

const currencySupply = 900000;
describe('End to end of staking contract', function () {
    before(async function () {
        this.StakingRewards = await ethers.getContractFactory("StakingRewards");
        this.Ticket = await ethers.getContractFactory("Ticket");
        this.Currency = await ethers.getContractFactory("Currency");
        const [owner] = await ethers.getSigners();
        // DEPLOYMENT: 
        this.ticket = await this.Ticket.deploy();
        await this.ticket.deployed();
        this.currency = await this.Currency.deploy(currencySupply);
        await this.currency.deployed();
        this.stakingRewards = await this.StakingRewards.deploy(owner.address, owner.address,  this.currency.address, this.currency.address);//Changed both to currency for testing
        await this.stakingRewards.deployed();
    });

    it('Single staker end to end', async function () {
        const [owner, staker] = await ethers.getSigners();
        expect((await this.ticket.balanceOf(owner.address)).toString()).to.equal("1000");
        expect((await this.currency.balanceOf(owner.address)).toString()).to.equal(currencySupply.toString());
        expect((await this.stakingRewards.balanceOf(staker.address)).toString()).to.equal("0");

        //Send the staking contract some currency
        await this.ticket.connect(owner).toggleAddress(staker.address);
        await this.currency.connect(staker).mint(currencySupply);
        await this.currency.connect(owner).transfer(this.stakingRewards.address, currencySupply);

        //Stake contracts
        await this.currency.connect(staker).approve(this.stakingRewards.address, currencySupply);
        await this.stakingRewards.connect(staker).stake(currencySupply);
        expect((await this.currency.balanceOf(staker.address)).toString()).to.equal("0");
        //set reward that users get from staking
        await this.stakingRewards.connect(owner).notifyRewardAmount(900); 
        //Simulate passage of time and end staking
        ethers.provider.send("evm_increaseTime", [100000]);
        await this.stakingRewards.connect(staker).exit();
        expect((await this.ticket.balanceOf(staker.address)).toNumber()).to.be.greaterThan(0);
    });
})
