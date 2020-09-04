import { program } from 'commander'
import fs from 'fs'
import { BigNumber, utils } from 'ethers'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing the merkle proofs for each account and the merkle root'
  )

program.parse(process.argv)
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

const verifyProof = (
  index: number | BigNumber,
  account: string,
  amount: BigNumber,
  proof: Buffer[],
  root: Buffer
): boolean => {
  const pairHex = utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount])
  let pair = Buffer.from(pairHex.slice(2), 'hex')

  for (const item of proof) {
    pair = combinedHash(pair, item)
  }

  return pair.equals(root)
}

if (typeof json !== 'object') throw new Error('Invalid JSON')

const merkleRootHex = json.merkleRoot
const merkleRoot = Buffer.from(merkleRootHex.slice(2), 'hex')

for (const address in json.claims) {
  const claim = json.claims[address]
  if (verifyProof(claim.index, address, claim.amount, claim.proof, merkleRoot)) {
    console.log('Verified proof for', address)
  } else {
    console.log('Verification for', address, 'failed')
  }
}
console.log('Done!')
