#!/usr/bin/env node

import fs from 'node:fs'

import { validateChiKnowPoFineTuningTrial } from '../../src/ocr/chiKnowPoFineTuningTrial.js'

function usage() {
  console.error('usage: validate_chi_know_po_medium_rec_finetune_trial.mjs --input <trial.json>')
}

function inputPath(argv) {
  const index = argv.indexOf('--input')
  if (index < 0 || !argv[index + 1]) return null
  return argv[index + 1]
}

const input = inputPath(process.argv.slice(2))
if (!input) {
  usage()
  process.exitCode = 2
} else {
  try {
    const trial = JSON.parse(fs.readFileSync(input, 'utf8'))
    const result = validateChiKnowPoFineTuningTrial(trial)
    console.log(JSON.stringify({
      status: result.pass ? 'PASSED' : 'FAILED',
      pass: result.pass,
      input,
      errors: result.errors,
    }, null, 2))
    process.exitCode = result.pass ? 0 : 1
  } catch (error) {
    console.log(JSON.stringify({
      status: 'FAILED',
      pass: false,
      input,
      errors: [error instanceof Error ? error.message : String(error)],
    }, null, 2))
    process.exitCode = 1
  }
}
