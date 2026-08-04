import { readFile } from 'node:fs/promises'
import { checkPilotArtifact } from './check-ziwei-ziwei-star-placement-clean-rule-seed-pilot-v0.mjs'
const original = JSON.parse(await readFile('artifacts/ziwei-ziwei-star-placement-clean-rule-seed-pilot-v0/complete.json','utf8'))
const cases = [
  ['PDF hash tampering', a => { a.sourceWitness.pdfSha256 = '0'.repeat(64) }],
  ['OCR promotion', a => { a.transcription.ocrStatus = 'canonical' }],
  ['uncertainty auto-fix', a => { a.transcription.uncertainty = [] }],
  ['transcription normalization mixing', a => { a.normalizedRule.sourceTranscriptionId = 'other' }],
  ['silent quotient change', a => { a.normalizedRule.arithmetic.quotient = 'floor(lunarDay / bureauNumber)' }],
  ['domain omission', a => { a.comparison.rows.pop(); a.comparison.inputCount = 149 }],
  ['impossible tuple', a => { a.comparison.rows[0].input.lunarDay = 0 }],
  ['mapping mutation', a => { a.normalizedRule.mapping.traditionalToEngine.紫微 = 'tianfu' }],
  ['production reuse', a => { a.independence.sourceEvaluatorImportsProduction = true }],
  ['mismatch concealment', a => { a.comparison.rows[0].match = false; a.comparison.mismatchCount = 0 }],
  ['other star expansion', a => { a.boundaries.otherStarsIncluded = true }],
  ['modern commentary', a => { a.transcription.modernCommentaryIngested = true }],
  ['promotion', a => { a.boundaries.readiness = 'ready' }],
  ['nondeterministic ID', a => { a.comparison.rows[0].rowId = 'random' }],
]
const findings = []
for (const [name, mutate] of cases) { const candidate = structuredClone(original); mutate(candidate); const errors = await checkPilotArtifact(candidate); if (!errors.length) findings.push(name) }
console.log(JSON.stringify({findings}, null, 2)); if (findings.length) process.exitCode = 1
