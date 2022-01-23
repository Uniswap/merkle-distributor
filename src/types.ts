// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
export type MerkleDistributorInfo = {
  merkleRoot: string
  total: number
  proofs: {
    [urn: string]: {
      contentHash: string
      index: number
      proof: string[]
    }
  }
}

export type Item = {
  urn: string
  contentHash: string
}
