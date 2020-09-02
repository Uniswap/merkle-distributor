import chai, { expect } from 'chai'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { Contract, BigNumber } from 'ethers'

import Airdrop from '../build/AirdropTokenDistributor.json'
import TestERC20 from '../build/TestERC20.json'
import BalanceTree from './balance-tree'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe('AirdropTokenDistributor', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet0, wallet1] = provider.getWallets()

  let token: Contract
  beforeEach('deploy token', async () => {
    token = await deployContract(wallet0, TestERC20, ['Token', 'TKN', 0], overrides)
  })

  describe('#token', () => {
    it('returns the token address', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32], overrides)
      expect(await airdrop.token()).to.eq(token.address)
    })
  })

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32], overrides)
      expect(await airdrop.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#toNode', () => {
    it('matches js implementation', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32], overrides)
      expect(await airdrop.toNode(wallet0.address, BigNumber.from(100))).to.eq(
        `0x${BalanceTree.toNode(wallet0.address, BigNumber.from(100)).toString('hex')}`
      )
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32], overrides)
      await expect(airdrop.claim(wallet0.address, 10, [])).to.be.revertedWith('AirdropTokenDistributor: Invalid proof.')
    })

    describe('success', () => {
      let airdrop: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree({
          [wallet0.address]: BigNumber.from(100),
          [wallet1.address]: BigNumber.from(101),
        })
        airdrop = await deployContract(wallet0, Airdrop, [token.address, tree.getHexRoot()], overrides)
        await token.setBalance(airdrop.address, 201)
      })

      it('successful claim', async () => {
        const proof0 = tree.getProof(wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(wallet0.address, 100, proof0, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(wallet0.address, 100)
        const proof1 = tree.getProof(wallet1.address, BigNumber.from(101))
        await expect(airdrop.claim(wallet1.address, 101, proof1, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(wallet1.address, 101)
      })

      it('wrong account fails', async () => {
        const proof0 = tree.getProof(wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(wallet1.address, 100, proof0, overrides)).to.be.revertedWith(
          'AirdropTokenDistributor: Invalid proof.'
        )
      })

      it('wrong amount fails', async () => {
        const proof0 = tree.getProof(wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(wallet0.address, 101, proof0, overrides)).to.be.revertedWith(
          'AirdropTokenDistributor: Invalid proof.'
        )
      })
    })
  })
})
