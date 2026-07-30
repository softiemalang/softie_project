#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { generateClassificationSummary } from './lib/de405-classification-summary.mjs'

async function main() {
  const options = {
    summary: { type: 'string', short: 's' },
    manifest: { type: 'string', short: 'm' },
    samples: { type: 'string', short: 'p' },
    classifications: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
    force: { type: 'boolean', short: 'f', default: false },
    json: { type: 'boolean', default: false }
  }

  let values
  try {
    const parsed = parseArgs({ options, allowPositionals: true })
    values = parsed.values
  } catch (err) {
    console.error(`CLI argument error: ${err.message}`)
    process.exitCode = 1
    return
  }

  try {
    const summaryObj = await generateClassificationSummary({
      summary: values.summary,
      manifest: values.manifest,
      samples: values.samples,
      classifications: values.classifications,
      output: values.output,
      force: values.force
    })

    if (values.json) {
      console.log(JSON.stringify(summaryObj, null, 2))
    } else {
      console.log(`Successfully generated classification summary`)
      console.log(`Source sample count: ${summaryObj.sourceSampleCount}`)
      console.log(`Classification count: ${summaryObj.totalClassificationCount}`)
      console.log(`Unresolved count: ${summaryObj.selectionUnresolvedCount}`)
      console.log(`Out of coverage count: ${summaryObj.outOfCoverageCount}`)
      if (values.output) {
        console.log(`Output written to: ${values.output}`)
      }
    }
  } catch (err) {
    if (values.json) {
      console.log(JSON.stringify({ error: err.message, status: 'error' }, null, 2))
    } else {
      console.error(`Generation failed: ${err.message}`)
    }
    process.exitCode = 1
  }
}

main()
