#!/usr/bin/env node

import fs from 'node:fs'

import { validateChiKnowPoMediumRecRecipeArtifacts } from '../../src/ocr/chiKnowPoMediumRecRecipe.js'

const defaults = {
  split: 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/inner-dev-split.json',
  recipe: 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/recipe-design.json',
  hf: 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/hf-disposable-recipe-job-spec.json',
}

function readOption(argv, name, fallback) {
  const index = argv.indexOf(name)
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback
}

try {
  const argv = process.argv.slice(2)
  const paths = {
    split: readOption(argv, '--split', defaults.split),
    recipe: readOption(argv, '--recipe', defaults.recipe),
    hf: readOption(argv, '--hf', defaults.hf),
  }
  const artifacts = {
    split: JSON.parse(fs.readFileSync(paths.split, 'utf8')),
    recipe: JSON.parse(fs.readFileSync(paths.recipe, 'utf8')),
    hfJobSpec: JSON.parse(fs.readFileSync(paths.hf, 'utf8')),
  }
  const result = validateChiKnowPoMediumRecRecipeArtifacts(artifacts)
  console.log(JSON.stringify({ status: result.pass ? 'PASSED' : 'FAILED', pass: result.pass, paths, errors: result.errors }, null, 2))
  process.exitCode = result.pass ? 0 : 1
} catch (error) {
  console.log(JSON.stringify({ status: 'FAILED', pass: false, errors: [error instanceof Error ? error.message : String(error)] }, null, 2))
  process.exitCode = 1
}
