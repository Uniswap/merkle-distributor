
// import {ethers} from "hardhat";
// import { BigNumber, Contract, ethers, providers } from "ethers";
// import { expect } from "chai";

const { ethers } = require("hardhat");
const { expect } = require('chai');

const currencySupply = 1000;
const ticketSupply = 10000000;
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
        this.stakingRewards = await this.StakingRewards.deploy(owner.address, owner.address,  this.ticket.address, this.currency.address);//Changed both to currency for testing
        await this.stakingRewards.deployed();
    });

    it('Check initial params of staking contracts', async function () {
        const [owner, staker] = await ethers.getSigners();
        expect((await this.ticket.balanceOf(owner.address)).toString()).to.equal("10000000");
        expect((await this.currency.balanceOf(owner.address)).toString()).to.equal(currencySupply.toString());
        expect((await this.stakingRewards.balanceOf(staker.address)).toString()).to.equal("0");
    }),

    it('Send the staking contract some tickets', async function () {
        const [owner, staker] = await ethers.getSigners();
        await this.ticket.connect(owner).toggleAddress(staker.address);
        await this.ticket.connect(owner).toggleAddress(this.stakingRewards.address);
        await this.ticket.connect(owner).approve(this.stakingRewards.address, ticketSupply);
        await this.ticket.connect(owner).transfer(this.stakingRewards.address, ticketSupply);
    }),

    it('Allow staking contract to spend staker currency', async function () {
        const [owner, staker] = await ethers.getSigners();
        await this.currency.connect(staker).mint(currencySupply);
        await this.currency.connect(staker).approve(this.stakingRewards.address, currencySupply);
    }),

    it('Stake contracts', async function () {
        const [owner, staker] = await ethers.getSigners();
        await this.stakingRewards.connect(staker).stake(currencySupply);
        expect((await this.currency.balanceOf(staker.address)).toString()).to.equal("0");
    }),

    it('set reward that users get from staking', async function () {
        const [owner, staker] = await ethers.getSigners();
        await this.stakingRewards.connect(owner).notifyRewardAmount(ticketSupply); 
    }),

    it('Simulate passage of time and end staking', async function () {
        const [owner, staker] = await ethers.getSigners();
        ethers.provider.send("evm_increaseTime", [45528]);//1 week
        await this.stakingRewards.connect(staker).exit();
        console.log((await this.ticket.balanceOf(staker.address)).toNumber());
        expect((await this.ticket.balanceOf(staker.address)).toNumber()).to.be.greaterThan(0);
    });
})
