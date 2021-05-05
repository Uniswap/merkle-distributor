
// import {ethers} from "hardhat";
// import { BigNumber, Contract, ethers, providers } from "ethers";
// import { expect } from "chai";

const { ethers } = require("hardhat");
const { expect } = require('chai');

describe('Alpha and Omega Tokens (mostly) Unit Test', function () {
    before(async function () {
        this.StakingRewards = await ethers.getContractFactory("StakingRewards");
        this.Ticket = await ethers.getContractFactory("Ticket");
        this.Currency = await ethers.getContractFactory("Currency");
        const [owner] = await ethers.getSigners();
        // DEPLOYMENT: 
        this.ticket = await this.Ticket.deploy();
        await this.ticket.deployed();
        this.currency = await this.Currency.deploy(100);
        await this.currency.deployed();
        this.stakingRewards = await this.StakingRewards.deploy(owner.address, owner.address, this.currency.address, this.ticket.address);
        await this.stakingRewards.deployed();
    });

    it('Test payout before expiration', async function () {
        const [klade_address1, klade_address2, non_klade1, non_klade2] = await ethers.getSigners();

        expect((await this.stakingRewards.balanceOf(klade_address1.address)).toString()).to.equal("0");
    });
})
