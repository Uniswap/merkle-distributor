import { BigNumber } from 'ethers'

import { ContentHashTree } from './content-hash-tree'
import { MerkleDistributorInfo } from './types'

export function generateTree(contentHashes: string[]): MerkleDistributorInfo {
  const sortedContentHashes = contentHashes.sort()

  // construct a tree
  const tree = new ContentHashTree(sortedContentHashes)

  // generate proofs
  const proofs = sortedContentHashes.reduce<{
    [contentHash: string]: { index: number, proof: string[] }
  }>((memo, contentHash, index) => {
    memo[contentHash] = {
      index,
      proof: tree.getProof(index, contentHash),
    }
    return memo
  }, {})

  return {
    merkleRoot: tree.getHexRoot(),
    total: contentHashes.length,
    proofs,
  }
}

export function verifyProof(index: BigNumber | number, contentHash: string, proof: Buffer[], root: Buffer): boolean {
  return ContentHashTree.verifyProof(index, contentHash, proof, root)
}
