import { ethers } from "hardhat";
import { expect } from "chai";

const hre = require("hardhat");

describe("MerkleDistributor tests", () => {

  it("should sanity check", async () => {
    const [wallet0, wallet1] = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("TestERC20", wallet0);
    const token = await tokenFactory.deploy('Token', 'TKN', 0);
    console.log(token);
  });
});
