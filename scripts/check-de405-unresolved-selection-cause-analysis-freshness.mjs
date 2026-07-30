#!/usr/bin/env node
import { DEFAULT_CAUSE_INPUTS, DEFAULT_CAUSE_OUTPUT, parseCliOptions, validateUnresolvedSelectionCauseAnalysisFreshness } from './lib/de405-unresolved-selection-cause-analysis.mjs'
const options = parseCliOptions(process.argv.slice(2)); const inputs = { ...DEFAULT_CAUSE_INPUTS }
for (const key of Object.keys(inputs)) if (options[key]) inputs[key] = options[key]
const result = await validateUnresolvedSelectionCauseAnalysisFreshness(options.analysis || options.output || DEFAULT_CAUSE_OUTPUT, inputs)
console.log(options.json ? JSON.stringify(result, null, 2) : `Unresolved selection cause analysis freshness: ${result.status}`)
if (result.error) console.error(result.error)
process.exitCode = result.status === 'fresh' ? 0 : result.status === 'stale' ? 2 : 1
