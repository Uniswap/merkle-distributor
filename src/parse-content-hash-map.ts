import ContentHashTree from './content-hash-tree'

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
interface MerkleDistributorInfo {
  merkleRoot: string
  totalHashes: number
  claims: {
    [contentHash: string]: {
      index: number
      proof: string[]
    }
  }
}

export function parseContentHashesMap(contentHashes: string[]): MerkleDistributorInfo {
  const sortedContentHashes = contentHashes.sort()

  // construct a tree
  const tree = new ContentHashTree(sortedContentHashes)

  // generate claims
  const claims = sortedContentHashes.reduce<{
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
    totalHashes: contentHashes.length,
    claims,
  }
}
