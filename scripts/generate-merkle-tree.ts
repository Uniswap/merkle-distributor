import { program } from 'commander'
import fs from 'fs'
import path from 'path'
import { MerkleDistributorInfo } from '../src/parse-balances'
import { treeFromJSON, treeFromCSV, saveClaimsToDatabase } from '../src/io'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input CVS/JSON file location containing account addresses and string balances'
  )

program.parse(process.argv)

async function main(file: string) {
  let tree: MerkleDistributorInfo;
  if (path.extname(file) == ".json") {
    tree = await treeFromJSON(file)
  } else if (path.extname(file) == ".csv") {
    tree = await treeFromCSV(file)
  } else {
    console.error("Input must be either a JSON or CSV file. ")
    process.exit(1)
  }

  const treeInfoOut = path.join(
    path.dirname(file),
    path.basename(file).replace(path.extname(file), '.tree.json'),
  )
  const claimsOut = path.join(
    path.dirname(file),
    path.basename(file).replace(path.extname(file), '.claims.sqlite'),
  )

  console.log("Writing output")

  fs.writeFileSync(treeInfoOut, JSON.stringify({
    root: tree.merkleRoot,
    tokenTotal: tree.tokenTotal,
    recipientsCount: tree.claims.length
  }))

  await saveClaimsToDatabase(claimsOut, tree.claims)

  return {
    treeInfoOut,
    claimsOut,
    root: tree.merkleRoot
  }
}


main(program.input).catch((e) => {
  console.error(e);
  process.exit(1)
}).then(({ treeInfoOut, claimsOut, root }) => {
  console.log(`Claims saved to: ${claimsOut}`)
  console.log(`Tree info saved to: ${treeInfoOut}`)
  console.log(`Tree Root: ${root}`)
  console.log("Done!")
})
