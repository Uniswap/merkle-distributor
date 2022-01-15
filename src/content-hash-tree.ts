import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export class ContentHashTree {
  private readonly tree: MerkleTree
  constructor(contentHashes: string[]) {
    this.tree = new MerkleTree(
      contentHashes.map((contentHash, index) => {
        return ContentHashTree.toNode(index, contentHash)
      })
    )
  }

  public static verifyProof(
    index: number | BigNumber,
    contentHash: string,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = ContentHashTree.toNode(index, contentHash)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, contentHash))
  public static toNode(index: number | BigNumber, contentHash: string): Buffer {
    return Buffer.from(
      utils
        .solidityKeccak256(['uint256', 'string'], [index, contentHash])
        .substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(index: number | BigNumber, contentHash: string): string[] {
    return this.tree.getHexProof(ContentHashTree.toNode(index, contentHash))
  }
}
