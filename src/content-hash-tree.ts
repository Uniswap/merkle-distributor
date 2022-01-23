import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

import { Item } from './types'

export class ContentHashTree {
  private readonly tree: MerkleTree
  constructor(contentHashes: Item[]) {
    this.tree = new MerkleTree(
      contentHashes.map(({ urn, contentHash }, index) => {
        return ContentHashTree.toNode(index, urn, contentHash)
      })
    )
  }

  public static verifyProof(
    index: number | BigNumber,
    urn: string,
    contentHash: string,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = ContentHashTree.toNode(index, urn, contentHash)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, contentHash))
  public static toNode(
    index: number | BigNumber,
    urn: string,
    contentHash: string
  ): Buffer {
    return Buffer.from(
      utils
        .solidityKeccak256(
          ['uint256', 'string', 'string'],
          [index, urn, contentHash]
        )
        .substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(
    index: number | BigNumber,
    urn: string,
    contentHash: string
  ): string[] {
    return this.tree.getHexProof(
      ContentHashTree.toNode(index, urn, contentHash)
    )
  }
}
