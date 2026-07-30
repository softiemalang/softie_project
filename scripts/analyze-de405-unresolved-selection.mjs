#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  parseCliOptions,
  runUnresolvedSelectionAnalysis,
  serializeCanonicalJson
} from './lib/de405-unresolved-selection-analysis.mjs'

async function main() {
  const options = parseCliOptions(process.argv.slice(2))

  if (!options.output) {
    console.error('Error: --output <path> is required')
    process.exitCode = 1
    return
  }

  const report = await runUnresolvedSelectionAnalysis(options)
  const canonicalJson = serializeCanonicalJson(report)

  const outputPath = resolve(process.cwd(), options.output)
  await writeFile(outputPath, canonicalJson, 'utf8')

  if (options.json) {
    console.log(JSON.stringify({ status: 'success', output: outputPath }, null, 2))
  } else {
    console.log(`DE405 Unresolved Selection Analysis Complete`)
    console.log(`Output: ${outputPath}`)
    console.log(`Total Unresolved: ${report.invariants.totalUnresolvedCount}`)
    console.log(`Group 1 (state_equivalent_selection_different): ${report.invariants.groupCounts.state_equivalent_selection_different}`)
    console.log(`Group 2 (candidate_state_different): ${report.invariants.groupCounts.candidate_state_different}`)
    console.log(`Invariant Check: ${report.invariants.invariantCheckPassed ? 'PASSED' : 'FAILED'}`)
  }

  process.exitCode = 0
}

main().catch(err => {
  console.error(`Analysis failed: ${err.message}`)
  process.exitCode = 1
})
