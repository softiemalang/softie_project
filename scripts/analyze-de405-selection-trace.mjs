#!/usr/bin/env node
import { analyzeSelectionTrace, parseCliOptions, selectionTraceMarkdown, serializeCanonicalJson } from './lib/de405-selection-trace.mjs'
import { writeFile } from 'node:fs/promises'

const options = parseCliOptions(process.argv.slice(2))
const inputPath = options.input || 'artifacts/de405-jpl-cspice-selection-trace.jsonl'
const outputPath = options.output || 'docs/de405-selection-trace-analysis.json'
const markdownPath = options.markdown || (options.output ? null : 'docs/de405-selection-trace-analysis.md')
analyzeSelectionTrace({ inputPath })
  .then(async analysis => {
    await writeFile(outputPath, serializeCanonicalJson(analysis))
    if (markdownPath) await writeFile(markdownPath, selectionTraceMarkdown(analysis))
    console.log(JSON.stringify({ outputPath, markdownPath, traceCount: analysis.totalTraceCount }, null, 2))
  })
  .catch(error => { console.error(`DE405 selection trace analysis failed: ${error.message}`); process.exitCode = 1 })
