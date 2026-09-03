#!/usr/bin/env node

import fs from 'node:fs'

import { validateChiKnowPoMediumRecPreflight } from '../../src/ocr/chiKnowPoMediumRecPreflight.js'

function usage() {
  console.error('usage: validate_chi_know_po_medium_rec_preflight.mjs --input <preflight.json>')
}

const argv = process.argv.slice(2)
const inputIndex = argv.indexOf('--input')
const input = inputIndex >= 0 ? argv[inputIndex + 1] : null

if (!input) {
  usage()
  process.exitCode = 2
} else {
  try {
    const preflight = JSON.parse(fs.readFileSync(input, 'utf8'))
    const result = validateChiKnowPoMediumRecPreflight(preflight)
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
