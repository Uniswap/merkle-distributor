import { ethers } from "hardhat"
import chai, { expect } from "chai"
import { waffle } from "hardhat"
import { solidity } from "ethereum-waffle"
import { Contract, ContractFactory, BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import BalanceTree from '../src/balance-tree'
const hre = require("hardhat")

chai.use(solidity)

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe("MerkleDistributor tests", () => {

  let token: Contract
  let distributorFactory: ContractFactory
  let wallet0: SignerWithAddress
  let wallet1: SignerWithAddress

  beforeEach(async () => {
    [wallet0, wallet1] = await ethers.getSigners()
    const tokenFactory = await ethers.getContractFactory("TestERC20", wallet0)
    token = await tokenFactory.deploy('Token', 'TKN', 0)
    distributorFactory = await ethers.getContractFactory("MerkleDistributor", wallet0)
  })

  describe('#token', () => {
    it("returns the token address", async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32)
      expect(await distributor.token()).to.eq(token.address)
    })
  })

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32)
      expect(await distributor.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32)
      await expect(distributor.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'MerkleDistributor: Invalid proof.'
      )
    })

    it('fails for invalid index', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32)
      await expect(distributor.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'MerkleDistributor: Invalid proof.'
      )
    })

    describe('two account tree', () => {
      let distributor: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree([
          { account: wallet0.address, amount: BigNumber.from(100) },
          { account: wallet1.address, amount: BigNumber.from(101) },
        ])
        distributor = await distributorFactory.deploy(token.address, tree.getHexRoot())
        await token.setBalance(distributor.address, 201)
      })

      it('successful claim', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(0, wallet0.address, 100, proof0))
          .to.emit(distributor, 'Claimed')
          .withArgs(0, wallet0.address, 100)
        const proof1 = tree.getProof(1, wallet1.address, BigNumber.from(101))
        await expect(distributor.claim(1, wallet1.address, 101, proof1))
          .to.emit(distributor, 'Claimed')
          .withArgs(1, wallet1.address, 101)
      })
    })
  })
})
