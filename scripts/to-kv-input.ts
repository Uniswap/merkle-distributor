import { program } from 'commander'
import fs from 'fs'
import json from "big-json"
import axios from 'axios'
import { getClaimsCount, forEachClaim } from '../src/io'

const BATCH_SIZE = 10_000

program
  .version('0.0.0')
  .requiredOption('-c, --claims <path>', 'input sqlite db location containing the claims')
  .requiredOption('-t, --token <string>', 'Cloudflare API token')
  .requiredOption('-a, --account-identifier <string>', 'Cloudflare account identifier')
  .requiredOption('-n, --namespace-identifier <string>', 'Cloudflare KV namespace identifier')

program.parse(process.argv)

async function main() {
  // const claimsCount = await getClaimsCount(program.claims)
  const KV = Array(await getClaimsCount(program.claims))
  await forEachClaim(program.claims, (claim, index) => {
    KV[index] = {
      key: `${claim.address}`,
      value: JSON.stringify(claim),
    }
  })

  console.log(`Uploading ${KV.length} records to Cloudflare KV`)

  let i = 0
  while (i < KV.length) {
    await axios
      .put(
        `https://api.cloudflare.com/client/v4/accounts/${program.accountIdentifier}/storage/kv/namespaces/${program.namespaceIdentifier}/bulk`,
        JSON.stringify(KV.slice(i, (i += BATCH_SIZE))),
        {
          maxBodyLength: Infinity,
          headers: { Authorization: `Bearer ${program.token}`, 'Content-Type': 'application/json' },
        }
      )
      .then((response) => {
        if (!response.data.success) {
          throw Error(response.data.errors)
        }
      })

    console.log(`Uploaded ${Math.max(i, KV.length)} records in total`)
  }
}

main().then(() => {
  console.log('Done')
}).catch((e) => {
  console.error(e);
  process.exit(1)
})
