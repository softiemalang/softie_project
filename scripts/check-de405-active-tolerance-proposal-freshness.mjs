#!/usr/bin/env node
import {
  parseCliOptions,
  validateProposalFreshness
} from './lib/de405-active-tolerance-proposal.mjs'

async function main() {
  const options = parseCliOptions(process.argv.slice(2))
  const proposalPath = options.proposal || options.candidateSource || 'artifacts/de405-jpl-cspice-active-tolerance-proposal.json'

  const result = await validateProposalFreshness(proposalPath, options)

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`DE405 Active Tolerance Proposal Freshness Check`)
    console.log(`Proposal: ${proposalPath}`)
    console.log(`Schema Version: ${result.schemaVersion ?? 'unknown'}`)
    console.log(`Status: ${result.status.toUpperCase()}`)
    if (result.error) {
      console.log(`Error: ${result.error}`)
    }
    if (result.mismatches && result.mismatches.length > 0) {
      console.log(`Mismatches (${result.mismatches.length}):`)
      for (const m of result.mismatches) {
        console.log(`  - [${m.source}] ${m.field}: recorded=${JSON.stringify(m.recorded)} vs actual=${JSON.stringify(m.actual)}`)
      }
    }
  }

  if (result.status === 'fresh') {
    process.exitCode = 0
  } else if (result.status === 'stale') {
    process.exitCode = 2
  } else {
    process.exitCode = 1
  }
}

main().catch(err => {
  console.error(`Freshness check failed: ${err.message}`)
  process.exitCode = 1
})
