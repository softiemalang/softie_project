#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const adapter = await readFile(join(root, 'src/astrology/verifiedAstrologyAdapter.js'), 'utf8')
const forbidden = [
  '../interpretationPrep/', './planetResolver', './houseResolver', './aspectResolver',
  'astrologyPromptAdapter', 'supabase', 'fetch(', 'localStorage', 'sessionStorage',
]
const failures = forbidden.filter((needle) => adapter.includes(needle))
const productionFiles = [
  'src/interpretationPrep/threeSystemPrepPipeline.js', 'src/interpretationPrep/unifiedPromptAdapter.js',
  'src/interpretationPrep/sessionPromptAdapter.js', 'src/astrology/astrologyPromptAdapter.js',
  'src/lib/supabase.js', 'src/astrology/planetResolver.js', 'src/astrology/houseResolver.js', 'src/astrology/aspectResolver.js',
]
for (const file of productionFiles) {
  const text = await readFile(join(root, file), 'utf8')
  if (text.includes('verifiedAstrologyAdapter')) failures.push(`${file}:imports_verified_adapter`)
}
if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ pass: true, adapter: 'dry-run-only', productionImports: false }, null, 2))
}
