import { ethers } from "hardhat"
import chai, { expect } from "chai"
import { solidity } from "ethereum-waffle"
import { Contract, ContractFactory, BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import BalanceTree from '../src/balance-tree'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe("MerkleDistributor tests", () => {

  let token: Contract
  let distributorFactory: ContractFactory
  let wallet0: SignerWithAddress
  let wallet1: SignerWithAddress

  beforeEach(async () => {
    [wallet0, wallet1] = await ethers.getSigners()
    const tokenFactory = await ethers.getContractFactory("TestERC20", wallet0)
    token = await tokenFactory.deploy('Token', 'TKN', 0, overrides)
    distributorFactory = await ethers.getContractFactory("MerkleDistributor", wallet0)
  })

  describe('#token', () => {
    it("returns the token address", async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32, overrides)
      expect(await distributor.token()).to.eq(token.address)
    })
  })

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32, overrides)
      expect(await distributor.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32, overrides)
      await expect(distributor.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'MerkleDistributor: Invalid proof.'
      )
    })

    it('fails for invalid index', async () => {
      const distributor = await distributorFactory.deploy(token.address, ZERO_BYTES32, overrides)
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
        distributor = await distributorFactory.deploy(token.address, tree.getHexRoot(), overrides)
        await token.setBalance(distributor.address, 201)
      })

      it('successful claim', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(0, wallet0.address, 100)
        const proof1 = tree.getProof(1, wallet1.address, BigNumber.from(101))
        await expect(distributor.claim(1, wallet1.address, 101, proof1, overrides))
          .to.emit(distributor, 'Claimed')
          .withArgs(1, wallet1.address, 101)
      })

      it('transfers the token', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await token.balanceOf(wallet0.address)).to.eq(0)
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await token.balanceOf(wallet0.address)).to.eq(100)
      })

      it('must have enough to transfer', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await token.setBalance(distributor.address, 99)
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance'
        )
      })

      it('sets #isClaimed', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await distributor.isClaimed(0)).to.eq(false)
        expect(await distributor.isClaimed(1)).to.eq(false)
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await distributor.isClaimed(0)).to.eq(true)
        expect(await distributor.isClaimed(1)).to.eq(false)
      })

      it('cannot allow two claims', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await distributor.claim(0, wallet0.address, 100, proof0, overrides)
        await expect(distributor.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Drop already claimed.'
        )
      })

      it('cannot claim more than once: 0 and then 1', async () => {
        await distributor.claim(
          0,
          wallet0.address,
          100,
          tree.getProof(0, wallet0.address, BigNumber.from(100)),
          overrides
        )
        await distributor.claim(
          1,
          wallet1.address,
          101,
          tree.getProof(1, wallet1.address, BigNumber.from(101)),
          overrides
        )

        await expect(
          distributor.claim(0, wallet0.address, 100, tree.getProof(0, wallet0.address, BigNumber.from(100)), overrides)
        ).to.be.revertedWith('MerkleDistributor: Drop already claimed.')
      })

      it('cannot claim more than once: 1 and then 0', async () => {
        await distributor.claim(
          1,
          wallet1.address,
          101,
          tree.getProof(1, wallet1.address, BigNumber.from(101)),
          overrides
        )
        await distributor.claim(
          0,
          wallet0.address,
          100,
          tree.getProof(0, wallet0.address, BigNumber.from(100)),
          overrides
        )

        await expect(
          distributor.claim(1, wallet1.address, 101, tree.getProof(1, wallet1.address, BigNumber.from(101)), overrides)
        ).to.be.revertedWith('MerkleDistributor: Drop already claimed.')
      })

      it('cannot claim for address other than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(1, wallet1.address, 101, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Invalid proof.'
        )
      })

      it('cannot claim more than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(distributor.claim(0, wallet0.address, 101, proof0, overrides)).to.be.revertedWith(
          'MerkleDistributor: Invalid proof.'
        )
      })

      it('gas', async () => {
        const proof = tree.getProof(0, wallet0.address, BigNumber.from(100))
        const tx = await distributor.claim(0, wallet0.address, 100, proof, overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(81091)
      })
    })
  })
})
