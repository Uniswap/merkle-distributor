import { program } from 'commander'
import fs from 'fs'
import { BigNumber, utils } from 'ethers'
import { forEachClaim } from '../src/io'

program
  .version('0.0.0')
  .requiredOption(
    '-r, --root <path>',
    'JSON with the merkle tree root'
  )
  .requiredOption(
    '-c, --claims <path>',
    'sqlite db with the claims'
  )

program.parse(process.argv)

const combinedHash = (first: Buffer, second: Buffer): Buffer => {
  if (!first) {
    return second
  }
  if (!second) {
    return first
  }

  return Buffer.from(
    utils.solidityKeccak256(['bytes32', 'bytes32'], [first, second].sort(Buffer.compare)).slice(2),
    'hex'
  )
}

const toNode = (index: number | BigNumber, account: string, amount: BigNumber): Buffer => {
  const pairHex = utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount])
  return Buffer.from(pairHex.slice(2), 'hex')
}

const verifyProof = (leaf: Leaf, root: Buffer): boolean => {
  let pair = leaf.nodeHash
  for (const item of leaf.proof) {
    pair = combinedHash(pair, item)
  }

  return pair.equals(root)
}

const getNextLayer = (elements: Buffer[]): Buffer[] => {
  return elements.reduce<Buffer[]>((layer, el, idx, arr) => {
    if (idx % 2 === 0) {
      // Hash the current element with its pair element
      layer.push(combinedHash(el, arr[idx + 1]))
    }

    return layer
  }, [])
}

const getRoot = (leaves: Leaf[]): Buffer => {
  let nodes = leaves.map(({ nodeHash }) => nodeHash).sort(Buffer.compare)
  // deduplicate any eleents
  nodes = nodes.filter((el, idx) => {
    return idx === 0 || !nodes[idx - 1].equals(el)
  })

  const layers = []
  layers.push(nodes)

  // Get next layer until we reach the root
  while (layers[layers.length - 1].length > 1) {
    layers.push(getNextLayer(layers[layers.length - 1]))
  }

  return layers[layers.length - 1][0]
}

interface Leaf {
  index: number,
  account: string,
  amount: BigNumber,
  proof: Buffer[],
  nodeHash: Buffer
}

async function main(rootFile: string, claimsDbFile: string) {
  const tree = JSON.parse(fs.readFileSync(rootFile, 'utf-8'));
  if (typeof tree !== 'object') throw new Error('Invalid tree JSON')

  const merkleRootHex = tree.root
  const merkleRoot = Buffer.from(merkleRootHex.slice(2), 'hex')

  let leaves: Leaf[] = []
  let valid = true

  await forEachClaim(claimsDbFile, (claim, index, total) => {
    const proof: Buffer[] = claim.proof.map((p: string) => Buffer.from(p.slice(2), 'hex'))
    const leaf = {
      index: claim.index,
      account: claim.address,
      amount: BigNumber.from(claim.amount),
      proof: proof,
      nodeHash: toNode(claim.index, claim.address, BigNumber.from(claim.amount))
    }
    leaves.push(leaf)
    if (verifyProof(leaf, merkleRoot)) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Verified Claims: ${index + 1}/${total} entries`)
    } else {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log('Verification for', claim.address, 'failed\n')
      valid = false
    }
  })

  if (!valid) {
    console.error('Failed validation for 1 or more proofs')
    process.exit(1)
  }
  console.log('Successfuly veririfed claims!')

  // Root
  console.log('Reconstructing root from leaves...')
  const root = getRoot(leaves).toString('hex')
  console.log('Reconstructed merkle root', root)
  console.log('Root matches the one read from the JSON?', root === merkleRootHex.slice(2))
}

main(program.root, program.claims).catch((e) => {
  console.error(e);
  process.exit(1)
})
