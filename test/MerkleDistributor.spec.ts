import chai, { expect } from 'chai'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { ContentHashTree } from '../src/content-hash-tree'

import Distributor from '../build/MerkleDistributor.json'
import { generateTree, verifyProof } from '../src/index'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999
}

const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'
const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const charactersLength = characters.length

describe('MerkleDistributor', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999
    }
  })

  const wallets = provider.getWallets()
  const [wallet0] = wallets

  describe('#merkleRoot', () => {
    it('returns the zero merkle root', async () => {
      const distributor = await deployContract(
        wallet0,
        Distributor,
        [ZERO_BYTES32],
        overrides
      )
      expect(await distributor.merkleRoot()).to.eq(ZERO_BYTES32)
    })
  })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      const distributor = await deployContract(
        wallet0,
        Distributor,
        [ZERO_BYTES32],
        overrides
      )
      const res = await distributor.isValid(0, wallet0.address, [])
      await expect(res).to.be.false
    })

    it('fails for invalid index', async () => {
      const distributor = await deployContract(
        wallet0,
        Distributor,
        [ZERO_BYTES32],
        overrides
      )
      const res = await distributor.isValid(0, wallet0.address, [])
      await expect(res).to.be.false
    })

    describe('two account tree', () => {
      let distributor: Contract
      let tree: ContentHashTree
      beforeEach('deploy', async () => {
        tree = new ContentHashTree([
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8',
          'QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N'
        ])
        distributor = await deployContract(
          wallet0,
          Distributor,
          [tree.getHexRoot()],
          overrides
        )
      })

      it('successful verification', async () => {
        const proof0 = tree.getProof(
          0,
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8'
        )
        let res = await distributor.isValid(
          0,
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8',
          proof0,
          overrides
        )
        await expect(res).to.be.true

        const proof1 = tree.getProof(
          1,
          'QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N'
        )
        res = await distributor.isValid(
          1,
          'QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N',
          proof1,
          overrides
        )
        await expect(res).to.be.true
      })

      it('cannot claim for content hash other than proof', async () => {
        const proof0 = tree.getProof(
          0,
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8'
        )
        const res = await distributor.isValid(
          1,
          'QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N',
          proof0,
          overrides
        )
        await expect(res).to.be.false
      })

      it('cannot claim more than proof for index', async () => {
        const proof0 = tree.getProof(
          0,
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8'
        )
        const res = await distributor.isValid(
          1,
          'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8',
          proof0,
          overrides
        )
        await expect(res).to.be.false
      })
    })
    describe('larger tree', () => {
      const contentHashes = wallets.map(() => {
        return characters.charAt(Math.floor(Math.random() * charactersLength))
      })

      let distributor: Contract
      let tree: ContentHashTree
      beforeEach('deploy', async () => {
        tree = new ContentHashTree(contentHashes)
        distributor = await deployContract(
          wallet0,
          Distributor,
          [tree.getHexRoot()],
          overrides
        )
      })

      it('claim index 4', async () => {
        const proof = tree.getProof(4, contentHashes[4])
        const res = await distributor.isValid(
          4,
          contentHashes[4],
          proof,
          overrides
        )
        await expect(res).to.be.true
      })

      it('claim index 9', async () => {
        const proof = tree.getProof(9, contentHashes[9])
        const res = await distributor.isValid(
          9,
          contentHashes[9],
          proof,
          overrides
        )
        await expect(res).to.be.true
      })
    })

    describe('realistic size tree', () => {
      let distributor: Contract

      const NUM_LEAVES = 100_000
      const NUM_SAMPLES = 25

      const elements: string[] = []
      for (let i = 0; i < NUM_LEAVES; i++) {
        elements.push(
          characters.charAt(Math.floor(Math.random() * charactersLength))
        )
      }

      const tree = new ContentHashTree(elements)

      it('proof verification works', () => {
        const root = Buffer.from(tree.getHexRoot().slice(2), 'hex')
        for (let i = 0; i < NUM_LEAVES; i += NUM_LEAVES / NUM_SAMPLES) {
          const proof = tree
            .getProof(i, elements[i])
            .map((el: string) => Buffer.from(el.slice(2), 'hex'))

          const validProof = verifyProof(i, elements[i], proof, root)
          expect(validProof).to.be.true
        }
      })

      beforeEach('deploy', async () => {
        distributor = await deployContract(
          wallet0,
          Distributor,
          [tree.getHexRoot()],
          overrides
        )
      })

      it('gas', async () => {
        const proof = tree.getProof(50000, elements[50000])
        const res = await distributor.isValid(
          50000,
          elements[50000],
          proof,
          overrides
        )
        expect(res).to.be.true
      })
    })
  })

  describe('parseBalanceMap', () => {
    let distributor: Contract
    let proofs: {
      [contentHash: string]: {
        index: number
        proof: string[]
      }
    }

    const elements: string[] = [
      'QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8',
      'QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N',
      'QmTQZXMoieaUbTVmvoL1wgTfuxFMTCgrTfSoLD5sJQr1E4'
    ]

    beforeEach('deploy', async () => {
      const { proofs: innerProofs, merkleRoot, total } = generateTree(elements)
      proofs = innerProofs
      expect(total).to.eq(3) // 3
      distributor = await deployContract(
        wallet0,
        Distributor,
        [merkleRoot],
        overrides
      )
    })

    it('check the proofs is as expected', () => {
      expect(proofs).to.deep.eq({
        ['QmTQZXMoieaUbTVmvoL1wgTfuxFMTCgrTfSoLD5sJQr1E4']: {
          index: 0,
          proof: [
            '0x48c0ca76d7c07296b6ab47abc261e5ff457183e7e0267e62942b32e33c00ca0a',
            '0x884f61ae97ac3c79a2c8252e53e80fc4fdd0a12c4ca6c6b6aac6b9838b2bd5be'
          ]
        },
        ['QmTZzpvVdNbXXMrakkZvGnapuwJRAos9e4VnfCBcNva78N']: {
          index: 1,
          proof: [
            '0x796a113deaa9b91240bca898272af6c57fa81c48d7349336b19a1ca3bd9ef321'
          ]
        },
        ['QmVxw4Nvg4FMTcCwa7doiNZpshLJbCq8dokzgRTPGtqUy8']: {
          index: 2,
          proof: [
            '0x70718eb9ee724e904cfafa344172fd064aa8432ff88b313e1ecde6cb31e689f9',
            '0x884f61ae97ac3c79a2c8252e53e80fc4fdd0a12c4ca6c6b6aac6b9838b2bd5be'
          ]
        }
      })
    })

    it('all claims work exactly once', async () => {
      for (const contentHash in proofs) {
        const data = proofs[contentHash]
        const res = await distributor.isValid(
          data.index,
          contentHash,
          data.proof,
          overrides
        )
        await expect(res).to.be.true
      }
    })
  })
})
