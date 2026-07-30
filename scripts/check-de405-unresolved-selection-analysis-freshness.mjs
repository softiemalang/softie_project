#!/usr/bin/env node
import {
  DEFAULT_ANALYSIS_INPUTS,
  DEFAULT_ANALYSIS_OUTPUT,
  parseCliOptions,
  validateUnresolvedSelectionAnalysisFreshness
} from './lib/de405-unresolved-selection-analysis.mjs'

const options = parseCliOptions(process.argv.slice(2))
const inputPaths = { ...DEFAULT_ANALYSIS_INPUTS }
for (const role of Object.keys(DEFAULT_ANALYSIS_INPUTS)) {
  if (options[role]) inputPaths[role] = options[role]
}

const analysisPath = options.analysis || options.analysisOutput || options.output || DEFAULT_ANALYSIS_OUTPUT
const result = await validateUnresolvedSelectionAnalysisFreshness(analysisPath, inputPaths)

if (options.json) {
  console.log(JSON.stringify(result, null, 2))
} else if (result.status === 'fresh') {
  console.log('Unresolved selection analysis freshness: fresh')
} else {
  console.log(`Unresolved selection analysis freshness: ${result.status}`)
  if (result.error) console.log(`Error: ${result.error}`)
  if (result.mismatches.length > 0) {
    console.log('Mismatches found:')
    for (const mismatch of result.mismatches) {
      console.log(`  - [${mismatch.source}.${mismatch.field}] recorded=${JSON.stringify(mismatch.recorded)} actual=${JSON.stringify(mismatch.actual)}`)
    }
  }
}

process.exitCode = result.status === 'fresh' ? 0 : result.status === 'stale' ? 2 : 1
