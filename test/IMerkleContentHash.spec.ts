import chai, { expect } from 'chai'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { ContentHashTree } from '../src/content-hash-tree'

import Distributor from '../build/MerkleContentHash.json'
import { generateTree, verifyProof } from '../src/index'
import { Item } from '../src/types'

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
      const res = await distributor.isValid(0, wallet0.address, wallet0.address, [])
      await expect(res).to.be.false
    })

    describe('two account tree', () => {
      let distributor: Contract
      let tree: ContentHashTree
      beforeEach('deploy', async () => {
        tree = new ContentHashTree([
          {
            "urn": "urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0",
            "contentHash": "jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre"
          },
          {
            "urn": "urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1",
            "contentHash": "Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU"
          },
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
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0',
          'jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre'
        )
        let res = await distributor.isValid(
          0,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0',
          'jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre',
          proof0,
          overrides
        )
        await expect(res).to.be.true

        const proof1 = tree.getProof(
          1,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1',
          'Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU'
        )
        res = await distributor.isValid(
          1,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1',
          'Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU',
          proof1,
          overrides
        )
        await expect(res).to.be.true
      })

      it('cannot claim for content hash other than proof', async () => {
        const proof0 = tree.getProof(
          0,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0',
          'jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre'
        )
        const res = await distributor.isValid(
          1,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1',
          'Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU',
          proof0,
          overrides
        )
        await expect(res).to.be.false
      })

      it('cannot claim more than proof for index', async () => {
        const proof0 = tree.getProof(
          0,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0',
          'jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre'
        )
        const res = await distributor.isValid(
          1,
          'urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0',
          'jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre',
          proof0,
          overrides
        )
        await expect(res).to.be.false
      })
    })
    describe('larger tree', () => {
      const items = wallets.map((wallet) => {
        return { urn: wallet.address, contentHash: characters.charAt(Math.floor(Math.random() * charactersLength)) }
      })

      let distributor: Contract
      let tree: ContentHashTree
      beforeEach('deploy', async () => {
        tree = new ContentHashTree(items)
        distributor = await deployContract(
          wallet0,
          Distributor,
          [tree.getHexRoot()],
          overrides
        )
      })

      it('claim index 4', async () => {
        const proof = tree.getProof(4, items[4].urn, items[4].contentHash)
        const res = await distributor.isValid(
          4,
          items[4].urn,
          items[4].contentHash,
          proof,
          overrides
        )
        await expect(res).to.be.true
      })

      it('claim index 9', async () => {
        const proof = tree.getProof(9, items[9].urn, items[9].contentHash)
        const res = await distributor.isValid(
          9,
          items[9].urn,
          items[9].contentHash,
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

      const elements: Item[] = []
      for (let i = 0; i < NUM_LEAVES; i++) {
        elements.push(
          { urn: i.toString(), contentHash: characters.charAt(Math.floor(Math.random() * charactersLength)) }
        )
      }


      const tree = new ContentHashTree(elements)

      it('proof verification works', () => {
        const root = Buffer.from(tree.getHexRoot().slice(2), 'hex')
        for (let i = 0; i < NUM_LEAVES; i += NUM_LEAVES / NUM_SAMPLES) {
          const proof = tree
            .getProof(i, elements[i].urn, elements[i].contentHash)
            .map((el: string) => Buffer.from(el.slice(2), 'hex'))

          const validProof = verifyProof(i, elements[i].urn, elements[i].contentHash, proof, root)
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
        const proof = tree.getProof(50000, elements[50000].urn, elements[5000].contentHash)
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
      [urn: string]: {
        contentHash: string
        index: number
        proof: string[]
      }
    }

    const elements: Item[] = [
      {
        "urn": "urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0",
        "contentHash": "jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre"
      },
      {
        "urn": "urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1",
        "contentHash": "Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU"
      },
      {
        "urn": "urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:2",
        "contentHash": "26NQHpWzEZ2ntpLMPSPB7aDWYDme5Z5KsIfK02GEwN8r2U"
      },
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
        ['urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:0']: {
          index: 0,
          contentHash: "jJCrFHix2NJw9EqrdqQaV08iRRlnObxVP7LLAmufjc9Vre",
          proof: [
            '0xdfb8c5ec017455b241a3ff75ad08e74c4c4d8aef63aae7a29134a735e4a60fb0',
          ]
        },
        ['urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1']: {
          index: 1,
          contentHash: "Py3uD6Bw4bj6sSvJOchGs6becOjsB1PeRmVhdvCxZEALWU",
          proof: [
            '0xcda7554c7e2f51fc54f813c020169fbda39f975ab2b7a4a8a39e91b79a68cac7',
            '0xf3a232ba4106d2c425f0c5484fdb439359c98f3b05773c8d05246655c398f36b'
          ]
        },
        ['urn:decentraland:matic:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:2']: {
          index: 2,
          contentHash: "26NQHpWzEZ2ntpLMPSPB7aDWYDme5Z5KsIfK02GEwN8r2U",
          proof: [
            '0x4761ca7d6847c587c7af4b763be6df03501a53f6d42f3c51459c67aae21a9b5f',
            '0xf3a232ba4106d2c425f0c5484fdb439359c98f3b05773c8d05246655c398f36b'
          ]
        },
      })
    })

    it('all claims work exactly once', async () => {
      for (const urn in proofs) {
        const data = proofs[urn]
        const res = await distributor.isValid(
          data.index,
          urn,
          data.contentHash,
          data.proof,
          overrides
        )
        await expect(res).to.be.true
      }
    })
  })
})
