import { program } from 'commander'
import fs from 'fs'
import { BigNumber, utils } from 'ethers'

import { verifyProof } from '../src/index'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing the merkle proofs for each account and the merkle root'
  )

program.parse(process.argv)

console.time('validateHash')
const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

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

const toNode = (index: number | BigNumber, contentHash: string): Buffer => {
  const pairHex = utils.solidityKeccak256(['uint256', 'string'], [index, contentHash])
  return Buffer.from(pairHex.slice(2), 'hex')
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

const getRoot = (contentHashes: { contentHash: string; index: number }[]): Buffer => {
  let nodes = contentHashes
    .map(({ contentHash, index }) => toNode(index, contentHash))
    // sort by lexicographical order
    .sort(Buffer.compare)

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

if (typeof json !== 'object') throw new Error('Invalid JSON')

const merkleRootHex = json.merkleRoot
const merkleRoot = Buffer.from(merkleRootHex.slice(2), 'hex')

let contentHashes: { index: number; contentHash: string }[] = []
let valid = true

Object.keys(json.claims).forEach((contentHash) => {
  const claim = json.claims[contentHash]
  const proof = claim.proof.map((p: string) => Buffer.from(p.slice(2), 'hex'))
  contentHashes.push({ index: claim.index, contentHash: contentHash })
  if (verifyProof(claim.index, contentHash, proof, merkleRoot)) {
    console.log('Verified proof for', claim.index, contentHash)
  } else {
    console.log('Verification for', contentHash, 'failed')
    valid = false
  }
})

if (!valid) {
  console.error('Failed validation for 1 or more proofs')
  process.exit(1)
}
console.log('Done!')
console.timeEnd('validateHash')

// Root
const root = getRoot(contentHashes).toString('hex')
console.log('Reconstructed merkle root', root)
console.log('Root matches the one read from the JSON?', root === merkleRootHex.slice(2))