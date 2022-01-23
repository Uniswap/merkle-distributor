import { BigNumber } from 'ethers'

import { ContentHashTree } from './content-hash-tree'
import { MerkleDistributorInfo, Item } from './types'

export function generateTree(items: Item[]): MerkleDistributorInfo {
  const sortedItems = items.sort()

  // construct a tree
  const tree = new ContentHashTree(sortedItems)

  // generate proofs
  const proofs = sortedItems.reduce<{
    [urn: string]: { index: number; contentHash: string; proof: string[] }
  }>((memo, { urn, contentHash }, index) => {
    memo[urn] = {
      index,
      contentHash,
      proof: tree.getProof(index, urn, contentHash)
    }
    return memo
  }, {})

  return {
    merkleRoot: tree.getHexRoot(),
    total: items.length,
    proofs
  }
}

export function verifyProof(
  index: BigNumber | number,
  urn: string,
  contentHash: string,
  proof: Buffer[],
  root: Buffer
): boolean {
  return ContentHashTree.verifyProof(index, urn, contentHash, proof, root)
}
