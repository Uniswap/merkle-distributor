import chai, { expect } from 'chai'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { Contract, BigNumber, constants } from 'ethers'
import BalanceTree from '../src/balance-tree'

import Airdrop from '../build/AirdropTokenDistributor.json'
import TestERC20 from '../build/TestERC20.json'
import { parseBalanceMap } from '../src/parse-balance-map'

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

  const wallets = provider.getWallets()
  const [wallet0, wallet1] = wallets

  let token: Contract
  beforeEach('deploy token', async () => {
    token = await deployContract(wallet0, TestERC20, ['Token', 'TKN', 0], overrides)
  })

  describe('#token', () => {
    it('returns the token address', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32, 0], overrides)
      expect(await airdrop.token()).to.eq(token.address)
    })
  })

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32, 0], overrides)
      expect(await airdrop.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32, 1], overrides)
      await expect(airdrop.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'AirdropTokenDistributor: Invalid proof.'
      )
    })

    it('fails for invalid index', async () => {
      const airdrop = await deployContract(wallet0, Airdrop, [token.address, ZERO_BYTES32, 0], overrides)
      await expect(airdrop.claim(0, wallet0.address, 10, [])).to.be.revertedWith(
        'AirdropTokenDistributor: Invalid index.'
      )
    })

    describe('two account tree', () => {
      let airdrop: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree([
          { account: wallet0.address, amount: BigNumber.from(100) },
          { account: wallet1.address, amount: BigNumber.from(101) },
        ])
        airdrop = await deployContract(wallet0, Airdrop, [token.address, tree.getHexRoot(), 2], overrides)
        await token.setBalance(airdrop.address, 201)
      })

      it('successful claim', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(0, wallet0.address, 100, proof0, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(0, wallet0.address, 100)
        const proof1 = tree.getProof(1, wallet1.address, BigNumber.from(101))
        await expect(airdrop.claim(1, wallet1.address, 101, proof1, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(1, wallet1.address, 101)
      })

      it('transfers the token', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await token.balanceOf(wallet0.address)).to.eq(0)
        await airdrop.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await token.balanceOf(wallet0.address)).to.eq(100)
      })

      it('must have enough to transfer', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await token.setBalance(airdrop.address, 99)
        await expect(airdrop.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance'
        )
      })

      it('sets #isClaimed', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        expect(await airdrop.isClaimed(0)).to.eq(false)
        expect(await airdrop.isClaimed(1)).to.eq(false)
        await airdrop.claim(0, wallet0.address, 100, proof0, overrides)
        expect(await airdrop.isClaimed(0)).to.eq(true)
        expect(await airdrop.isClaimed(1)).to.eq(false)
      })

      it('cannot allow two claims', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await airdrop.claim(0, wallet0.address, 100, proof0, overrides)
        await expect(airdrop.claim(0, wallet0.address, 100, proof0, overrides)).to.be.revertedWith(
          'AirdropTokenDistributor: Drop already claimed.'
        )
      })

      it('cannot claim for address other than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(1, wallet1.address, 101, proof0, overrides)).to.be.revertedWith(
          'AirdropTokenDistributor: Invalid proof.'
        )
      })

      it('cannot claim more than proof', async () => {
        const proof0 = tree.getProof(0, wallet0.address, BigNumber.from(100))
        await expect(airdrop.claim(0, wallet0.address, 101, proof0, overrides)).to.be.revertedWith(
          'AirdropTokenDistributor: Invalid proof.'
        )
      })

      it('gas', async () => {
        const proof = tree.getProof(0, wallet0.address, BigNumber.from(100))
        const tx = await airdrop.claim(0, wallet0.address, 100, proof, overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(78480)
      })
    })
    describe('larger tree', () => {
      let airdrop: Contract
      let tree: BalanceTree
      beforeEach('deploy', async () => {
        tree = new BalanceTree(
          wallets.map((wallet, ix) => {
            return { account: wallet.address, amount: BigNumber.from(ix + 1) }
          })
        )
        airdrop = await deployContract(wallet0, Airdrop, [token.address, tree.getHexRoot(), wallets.length], overrides)
        await token.setBalance(airdrop.address, 201)
      })

      it('claim index 4', async () => {
        const proof = tree.getProof(4, wallets[4].address, BigNumber.from(5))
        await expect(airdrop.claim(4, wallets[4].address, 5, proof, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(4, wallets[4].address, 5)
      })

      it('claim index 9', async () => {
        const proof = tree.getProof(9, wallets[9].address, BigNumber.from(10))
        await expect(airdrop.claim(9, wallets[9].address, 10, proof, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(9, wallets[9].address, 10)
      })

      it('gas', async () => {
        const proof = tree.getProof(9, wallets[9].address, BigNumber.from(10))
        const tx = await airdrop.claim(9, wallets[9].address, 10, proof, overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(80974)
      })
    })

    describe('realistic size tree', () => {
      let airdrop: Contract
      let tree: BalanceTree
      const NUM_LEAVES = 100_000
      const NUM_SAMPLES = 25
      const elements: { account: string; amount: BigNumber }[] = []
      for (let i = 0; i < NUM_LEAVES; i++) {
        const node = { account: wallet0.address, amount: BigNumber.from(100) }
        elements.push(node)
      }
      tree = new BalanceTree(elements)

      beforeEach('deploy', async () => {
        airdrop = await deployContract(wallet0, Airdrop, [token.address, tree.getHexRoot(), NUM_LEAVES], overrides)
        await token.setBalance(airdrop.address, constants.MaxUint256)
      })

      it('gas', async () => {
        const proof = tree.getProof(50000, wallet0.address, BigNumber.from(100))
        const tx = await airdrop.claim(50000, wallet0.address, 100, proof, overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(91664)
      })
      it('gas deeper node', async () => {
        const proof = tree.getProof(90000, wallet0.address, BigNumber.from(100))
        const tx = await airdrop.claim(90000, wallet0.address, 100, proof, overrides)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(91600)
      })
      it('gas average random distribution', async () => {
        let total: BigNumber = BigNumber.from(0)
        let count: number = 0
        for (let i = 0; i < NUM_LEAVES; i += NUM_LEAVES / NUM_SAMPLES) {
          const proof = tree.getProof(i, wallet0.address, BigNumber.from(100))
          const tx = await airdrop.claim(i, wallet0.address, 100, proof, overrides)
          const receipt = await tx.wait()
          total = total.add(receipt.gasUsed)
          count++
        }
        const average = total.div(count)
        expect(average).to.eq(77089)
      })
      // this is what we gas golfed by packing the bitmap
      it('gas average first 25', async () => {
        let total: BigNumber = BigNumber.from(0)
        let count: number = 0
        for (let i = 0; i < 25; i++) {
          const proof = tree.getProof(i, wallet0.address, BigNumber.from(100))
          const tx = await airdrop.claim(i, wallet0.address, 100, proof, overrides)
          const receipt = await tx.wait()
          total = total.add(receipt.gasUsed)
          count++
        }
        const average = total.div(count)
        expect(average).to.eq(62838)
      })
    })
  })

  describe('parseBalanceMap', () => {
    let airdrop: Contract
    let claims: {
      [account: string]: {
        index: number
        amount: string
        proof: string[]
      }
    }
    beforeEach('deploy', async () => {
      const { claims: innerClaims, merkleRoot, numDrops, tokenTotal } = parseBalanceMap({
        [wallet0.address]: '200',
        [wallet1.address]: '300',
        [wallets[2].address]: '250',
      })
      expect(numDrops).to.eq(3)
      expect(tokenTotal).to.eq('0x02ee') // 750
      claims = innerClaims
      airdrop = await deployContract(wallet0, Airdrop, [token.address, merkleRoot, numDrops], overrides)
      await token.setBalance(airdrop.address, tokenTotal)
    })

    it('check the proofs is as expected', () => {
      expect(claims).to.deep.eq({
        [wallet0.address]: {
          index: 0,
          amount: '0xc8',
          proof: ['0x2a411ed78501edb696adca9e41e78d8256b61cfac45612fa0434d7cf87d916c6'],
        },
        [wallet1.address]: {
          index: 1,
          amount: '0x012c',
          proof: [
            '0xbfeb956a3b705056020a3b64c540bff700c0f6c96c55c0a5fcab57124cb36f7b',
            '0xd31de46890d4a77baeebddbd77bf73b5c626397b73ee8c69b51efe4c9a5a72fa',
          ],
        },
        [wallets[2].address]: {
          index: 2,
          amount: '0xfa',
          proof: [
            '0xceaacce7533111e902cc548e961d77b23a4d8cd073c6b68ccf55c62bd47fc36b',
            '0xd31de46890d4a77baeebddbd77bf73b5c626397b73ee8c69b51efe4c9a5a72fa',
          ],
        },
      })
    })

    it('all proofs work', async () => {
      for (let account in claims) {
        const proof = claims[account]
        await expect(airdrop.claim(proof.index, account, proof.amount, proof.proof, overrides))
          .to.emit(airdrop, 'Claimed')
          .withArgs(proof.index, account, proof.amount)
      }
      expect(await token.balanceOf(airdrop.address)).to.eq(0)
    })
  })
})
