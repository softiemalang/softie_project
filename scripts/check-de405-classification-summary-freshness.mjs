#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { validateClassificationSummaryFreshness } from './lib/de405-classification-summary.mjs'

async function main() {
  const options = {
    'classification-summary': { type: 'string', default: 'artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json' },
    summary: { type: 'string' },
    manifest: { type: 'string' },
    samples: { type: 'string' },
    classifications: { type: 'string' },
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

  const classificationSummaryPath = values['classification-summary']

  try {
    const result = await validateClassificationSummaryFreshness(classificationSummaryPath, {
      summary: values.summary,
      manifest: values.manifest,
      samples: values.samples,
      classifications: values.classifications
    })

    if (values.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(`Classification summary freshness: ${result.status}`)
      if (result.mismatches.length > 0) {
        console.log('Mismatches found:')
        for (const m of result.mismatches) {
          console.log(`  - [${m.source}] ${m.field}: recorded "${m.recorded}", actual "${m.actual}"`)
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
  } catch (err) {
    if (values.json) {
      console.log(JSON.stringify({ status: 'invalid', fresh: false, error: err.message }, null, 2))
    } else {
      console.error(`Validation error: ${err.message}`)
    }
    process.exitCode = 1
  }
}

main()
