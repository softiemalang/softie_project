#!/usr/bin/env node

import fs from 'node:fs'
import {
  validateChiKnowPoMediumRecRecipeSubmission,
} from '../../src/ocr/chiKnowPoMediumRecRecipeSubmission.js'

const inputPath = process.argv[2]
if (!inputPath) throw new Error('usage: validate_chi_know_po_medium_rec_recipe_submission.mjs <receipt.json>')
const receipt = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const validation = validateChiKnowPoMediumRecRecipeSubmission(receipt)
console.log(JSON.stringify(validation, null, 2))
if (!validation.pass) process.exitCode = 1
