#!/usr/bin/env node

import fs from 'node:fs'
import {
  validateChiKnowPoMediumRecRecipeRun,
} from '../../src/ocr/chiKnowPoMediumRecRecipeRun.js'

const inputPath = process.argv[2]
if (!inputPath) throw new Error('usage: validate_chi_know_po_medium_rec_recipe_run.mjs <result.json>')
const result = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const validation = validateChiKnowPoMediumRecRecipeRun(result)
console.log(JSON.stringify(validation, null, 2))
if (!validation.pass) process.exitCode = 1
