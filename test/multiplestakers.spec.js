
// import {ethers} from "hardhat";
// import { BigNumber, Contract, ethers, providers } from "ethers";
// import { expect } from "chai";

const { ethers } = require("hardhat");
const { expect } = require('chai');
const BigNumber = require('bignumber.js');

const currencySupply = 1000;
const ticketSupply = 150000*1e18;
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
        const [owner, staker1] = await ethers.getSigners();
        // expect((await this.ticket.balanceOf(owner.address)).toString()).to.equal("10000000");
        expect((await this.currency.balanceOf(owner.address)).toString()).to.equal(currencySupply.toString());
        expect((await this.stakingRewards.balanceOf(staker1.address)).toString()).to.equal("0");
    }),

    it('Send the staking contract some tickets', async function () {
        const [owner, staker1, staker2] = await ethers.getSigners();
        await this.ticket.connect(owner).toggleAddress(staker1.address);
        await this.ticket.connect(owner).toggleAddress(staker2.address);
        await this.ticket.connect(owner).toggleAddress(this.stakingRewards.address);
        await this.ticket.connect(owner).approve(this.stakingRewards.address, ethers.utils.parseUnits('150000', 18));
        await this.ticket.connect(owner).transfer(this.stakingRewards.address, ethers.utils.parseUnits('150000', 18));
    }),

    it('Allow staking contract to spend staker currency', async function () {
        const [owner, staker1, staker2] = await ethers.getSigners();
        await this.currency.connect(staker1).mint(currencySupply);
        await this.currency.connect(staker1).approve(this.stakingRewards.address, currencySupply);
        await this.currency.connect(staker2).mint(currencySupply);
        await this.currency.connect(staker2).approve(this.stakingRewards.address, currencySupply);
    }),

    it('Stake contracts', async function () {
        const [owner, staker1, staker2] = await ethers.getSigners();
        await this.stakingRewards.connect(staker1).stake(currencySupply);
        expect((await this.currency.balanceOf(staker1.address)).toString()).to.equal("0");
        await this.stakingRewards.connect(staker2).stake(currencySupply);
        expect((await this.currency.balanceOf(staker2.address)).toString()).to.equal("0");
    }),

    it('set reward that users get from staking', async function () {
        const [owner, staker1] = await ethers.getSigners();
        await this.stakingRewards.connect(owner).notifyRewardAmount(ethers.utils.parseUnits('150000', 18)); 
    }),

    it('Simulate passage of time and end staking', async function () {
        const [owner, staker1, staker2] = await ethers.getSigners();
        ethers.provider.send("evm_increaseTime", [195120]);//30 days
        await this.stakingRewards.connect(staker1).exit();
        console.log("Expected ", (await this.ticket.balanceOf(staker1.address)).toString(), "to be greater than 0");
        await this.stakingRewards.connect(staker2).exit();
        console.log("Expected ", (await this.ticket.balanceOf(staker2.address)).toString(), "to be greater than 0");
    });
})
