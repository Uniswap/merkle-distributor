import json from "big-json"
import fs from 'fs'
import { parse as parseCSV } from "csv-parse/sync";
import { parseBalances, MerkleDistributorInfo } from '../src/parse-balances'

export async function readAndParseBigJson(file: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(file);
    const parseStream = json.createParseStream();
    parseStream.on('data', resolve)
    parseStream.on('error', reject)
    readStream.pipe(parseStream)
  })
}

async function writeBigJson(file: string, data: any) {
  return new Promise((resolve, reject) => {
    const stringifyStream = json.createStringifyStream({
      body: data
    });

    stringifyStream.on('data', function(strChunk: string) {
      fs.appendFileSync(file, strChunk);
    });

    stringifyStream.on('end', function() {
      console.log("Writing tree is done")
      resolve()
    })

    stringifyStream.on('error', reject)
  })
}


export async function treeFromJSON(file: string) {
  console.log("Parsing JSON input")
  const data = await readAndParseBigJson(file)

  if (typeof data !== 'object') {
    console.error("Input should be a JSON map of address to balance.")
    console.error(`Check ${file} to ensure it matches the format`)
    process.exit(1)
  }

  console.log("Generating Tree")
  return parseBalances(data as any)
}

export async function treeFromCSV(file: string) {
  console.log("Parsing CSV input")
  const data = parseCSV(fs.readFileSync(file, { encoding: 'utf8' }))

  if (typeof data !== 'object' || data.length == undefined || data.length == 0) {
    console.error("Input should be a CSV with each row containing only address and balance.")
    console.error(`Check ${file} to ensure it matches the format`)
    process.exit(1)
  }

  console.log("Generating Tree")
  return parseBalances(data)
}

export async function saveClaimsToDatabase(file: string, claims: MerkleDistributorInfo["claims"]) {
  if (fs.existsSync(file)) {
    const backupFile = file + ".bk." + new Date().toISOString().replace(/:/g, "-")
    console.log(`Backing up existing database to ${backupFile}`)
    fs.renameSync(file, backupFile)
  }

  const sqlite3 = require('sqlite3');// .verbose();
  const db = new sqlite3.Database(file);
  let writtenClaims = 0;
  await new Promise((resolve, reject) => db.serialize(function() {
    db.run("CREATE TABLE claims (id INTEGER PRIMARY KEY, address TEXT, amount TEXT, proof TEXT)");
    db.run("PRAGMA synchronous = OFF");
    db.run("PRAGMA journal_mode = MEMORY");
    db.run("PRAGMA cache_size = 10000");
    db.run("PRAGMA locking_mode = EXCLUSIVE");
    db.run("PRAGMA temp_store = MEMORY");
    db.run("PRAGMA mmap_size = 30000000000");
    db.run("PRAGMA page_size = 4096");
    db.run("PRAGMA threads = 4");
    db.run("PRAGMA auto_vacuum = FULL");
    db.run("PRAGMA journal_size_limit = 1000000000");
    db.run("PRAGMA wal_autocheckpoint = 1000");
    db.run("PRAGMA wal_checkpoint(TRUNCATE)");
    db.parallelize(function() {
      for (let i = 0; i < claims.length; i++) {
        db.run(
          "INSERT INTO claims VALUES (?, ?, ?, ?)",
          [
            claims[i].index,
            claims[i].address,
            claims[i].amount,
            JSON.stringify(claims[i].proof)
          ],
          (err: any) => {
            if (err) {
              console.error(err)
              process.exit(1)
            } else {
              writtenClaims++;
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(`Writing Claims: ${writtenClaims}/${claims.length} entries`)
            }
          }
        )
      }
    })
  }, (err: any) => {
    console.log("\n Done writing claims.")
    if (err) reject(err)
    resolve()
  }))
}

export async function getClaimsCount(file: string): Promise<number> {
  const sqlite3 = require('sqlite3');// .verbose();
  const db = new sqlite3.Database(file);
  return new Promise((resolve, reject) => db.serialize(function() {
    db.get("SELECT COUNT(*) as count FROM claims", (err: any, row: any) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      resolve(row.count as number)
    })
  }, (err: any) => {
    if (err) reject(err)
  }))
}

export async function forEachClaim(file: string, cb: (claim: MerkleDistributorInfo["claims"][0], index: number, total: number) => void) {
  const sqlite3 = require('sqlite3');// .verbose();
  const db = new sqlite3.Database(file);
  const total: number = await getClaimsCount(file);
  return new Promise((resolve, reject) => {
    db.each("SELECT * FROM claims", (err: any, row: any) => {
      if (err) {
        reject(err)
      }
      cb({
        index: row.id,
        address: row.address,
        amount: row.amount,
        proof: JSON.parse(row.proof)
      }, row.id, total)
    }, (err: any) => {
      if (err) reject(err)
      resolve()
    })
  })
}
