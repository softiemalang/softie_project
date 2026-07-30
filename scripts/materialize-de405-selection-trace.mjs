#!/usr/bin/env node
import { materializeSelectionTrace, parseCliOptions } from './lib/de405-selection-trace.mjs'

const options = parseCliOptions(process.argv.slice(2))
materializeSelectionTrace({ outputPath: options.output || undefined })
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => { console.error(`DE405 selection trace materialization failed: ${error.message}`); process.exitCode = 1 })
