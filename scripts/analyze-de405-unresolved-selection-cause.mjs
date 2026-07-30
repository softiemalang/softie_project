#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseCliOptions, runUnresolvedSelectionCauseAnalysis, serializeCanonicalJson } from './lib/de405-unresolved-selection-cause-analysis.mjs'
const options = parseCliOptions(process.argv.slice(2))
if (!options.output) throw new Error('--output <path> is required')
const report = await runUnresolvedSelectionCauseAnalysis(options)
await writeFile(resolve(process.cwd(), options.output), serializeCanonicalJson(report), 'utf8')
console.log(`DE405 unresolved selection cause analysis: ${options.output}`)
