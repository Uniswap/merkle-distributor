/*
* Utilization attempts to accomplish 2 things:
*   `Mechanic 1` is meant to ensure people are using their ENERGY to create data.
*    --> Criteria 1: ENERGY used to create atoms or triples
*    --> Criteria 2: ENERGY staked to atoms or triples
*   `Mechanic 2` is to incentivize people to create relevant data.
*   --> Criteria 3: ENERGY received as fees for activities on their atoms and triples
*/
const numberOfMechanics = 2
const mechanicPercentages = [40, 60] // % per mechanic
const numberOfCriteria = 3
const weightsForCriteria = [1, 2, 3] // weights for criteria
const criteriaForMechanic = [[0, 1], [2]] // criteria for each mechanic
const totalEnergy = [10000, 20000, 5000] // total energy for each criterion
const trustPerEpoch = 1000000
const epochLength = 7 // days
const penalty = 50 // % penalty for not claiming trust

// TODO: read from database
function getEnergyForUsers() {
  return {
    '0xF3c6F5F265F503f53EAD8aae90FC257A5aa49AC1': [ // wallet address
      [1000, 2000, 500], // [energy used, energy staked, energy received from fees]
      100, // total trust not claimed
    ],
    '0xB9CcDD7Bedb7157798e10Ff06C7F10e0F37C6BdD': [
      [5000, 4000, 2000],
      200,
    ]
  }
}

// TODO: read from database
function getDelegationsForUsers() {
  return {
    '0xF3c6F5F265F503f53EAD8aae90FC257A5aa49AC1': [
      [
        '0xB9CcDD7Bedb7157798e10Ff06C7F10e0F37C6BdD', // delegated to
        [1000, 500, 200], // delegated energy created, delegated energy staked, delegated energy received from fees
        50, // delegation split %
      ],
    ]
  }
}

function calculateDistributions() {
  const userData = getEnergyForUsers()

  let distributions = {}

  const users = Object.keys(userData)
  for (const user of users) {
    // array of [energy used, energy staked, energy received from fees]
    const energy = userData[user][0]

    // total trust not claimed from previous distributions
    const trustNotClaimed = userData[user][1]

    distributions[user] = { 
      total: 0,
      mechanics: [],
    }

    for (let i = 0; i < numberOfMechanics; i++) {
      // trust that will be distributed to the mechanic
      // it's a percentage of the total trust per epoch
      const trustForMechanic = (trustPerEpoch * mechanicPercentages[i]) / 100

      // total weighted energy for the mechanic
      let totalWeightedEnergy = 0

      // weighted energy for the user
      let userWeightedEnergy = 0

      for (const criteria of criteriaForMechanic[i]) {
        // weight for the criteria
        const weight = weightsForCriteria[criteria]

        // total weighted energy for the mechanic
        totalWeightedEnergy += totalEnergy[criteria] * weight;

        // weighted energy for the user
        userWeightedEnergy += energy[criteria] * weight;
      }

      // trust for the user for the mechanic
      const userTrustForMechanic = (totalWeightedEnergy == 0) ? 0 : (trustForMechanic * userWeightedEnergy) / totalWeightedEnergy

      distributions[user].mechanics[i] = userTrustForMechanic
      distributions[user].total += userTrustForMechanic
    }

    // add the trust not claimed from previous distributions, with a penalty
    distributions[user].total += trustNotClaimed * (100 - penalty) / 100
  }

  return distributions
}

function adjustDistributionsByDelegations(distributions) {
  const delegations = getDelegationsForUsers()

  const users = Object.keys(delegations)
  for (const user of users) {

    for (const delegation of delegations[user]) {
      const [delegatedTo, delegatedEnergy, delegationSplit] = delegation

      for (let i = 0; i < numberOfMechanics; i++) {
        // trust that will be distributed to the mechanic
        // it's a percentage of the total trust per epoch
        const trustForMechanic = (trustPerEpoch * mechanicPercentages[i]) / 100

        let totalEnergy = 0
        let delegatedEnergy = 0

        for (const criteria of criteriaForMechanic[i]) {
          // The delegate reward is proportional to the ENERGY delegated vs its own ENERGY
          totalEnergy += energy[criteria]
          delegatedEnergy += delegatedEnergy[criteria]
        }

        // trust for the user for the mechanic
        const userTrustFromDelegateForMechanic = (totalEnergy == 0) ? 0 : (trustForMechanic * delegatedEnergy) / (totalEnergy * 100)
      }
    }
  }
  return distributions
}

function checkMechanicPercentages(mechanicPercentages) {
  // check if the mechanic percentages sum to 100
  const sum = mechanicPercentages.reduce((acc, curr) => acc + curr, 0)
  if (sum !== 100) {
    throw new Error('Mechanic percentages must sum to 100')
  }
}

async function main() {
  try {
    // check mechanic percentages: should sum to 100
    checkMechanicPercentages(mechanicPercentages)

    // Calculate the distribution for each user
    const distributions = calculateDistributions()

    // Adjust the distributions by the delegations
    const distributionsWithDelegations = adjustDistributionsByDelegations(distributions)
  }
  catch (error) {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
