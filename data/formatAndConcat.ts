//@ts-check
import { ethers } from 'ethers'
import { rewards } from './rewards'
import { whitelist } from './whitelist'

let map = new Map<string, string>()
// Normalize addresses esp from Ethersca
whitelist.forEach(function (x) {
  map.set(ethers.utils.getAddress(x), '0')
})

rewards.forEach(function (x) {
  map.set(ethers.utils.getAddress(x), '32')
})
/*
rewards.forEach(function (value) {
    finalList[0][ethers.utils.getAddress(value)] = "32";
}); */
//finalList.push(0);
console.log(strMapToObj(map))
function strMapToObj(strMap: Map<string, string>) {
  let obj = Object.create(null)
  for (let [k, v] of strMap) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v
  }
  return obj
}
