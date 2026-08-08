import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildArtifact, canonicalJson, SCHEMA, MATERIALIZER_VERSION } from './materialize-ziwei-traditional-source-comparison-v0.mjs'

export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate.verdictToken !== 'blocked_partial_source_integration_no_production_promotion') errors.push('verdict_boundary')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental') errors.push('readiness_boundary')
  if (candidate.boundaries?.productionEngineModified !== false || candidate.boundaries?.ruleContractModified !== false || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.sourceConflictHidden !== false) errors.push('mutation_or_conflict_boundary')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.transcription?.sourceImagesAreCanonical !== true) errors.push('ocr_canonical_promotion')
  if (candidate.sourceInventory?.sources?.length !== 2) errors.push('source_count')
  if (candidate.sourceInventory?.sources?.some(source => source.file.storedInGit || !source.file.readOnly)) errors.push('pdf_storage_or_mutability')
  const statuses = candidate.comparison?.statusCounts || {}
  if (Object.keys(statuses).length !== 6 || Object.values(statuses).some(value => !Number.isInteger(value) || value < 0)) errors.push('status_counts')
  if (candidate.comparison?.rules?.length !== 15) errors.push('rule_count')
  for (const domain of ['mingShen', 'fiveElementBureau', 'ziwei', 'tianfu']) {
    const d = candidate.comparison?.domains?.[domain]
    if (!d || !Number.isInteger(d.inputCount) || !Number.isInteger(d.matchCount) || !Number.isInteger(d.mismatchCount) || d.matchCount + d.mismatchCount !== d.inputCount) errors.push(`domain:${domain}`)
  }
  if (candidate.comparison?.domains?.mingShen?.matchCount !== 144 || candidate.comparison?.domains?.fiveElementBureau?.matchCount !== 1440 || candidate.comparison?.domains?.ziwei?.matchCount !== 150 || candidate.comparison?.domains?.tianfu?.matchCount !== 25) errors.push('domain_result_drift')
  if (canonicalJson(candidate.sourceInventory) !== canonicalJson(expected.sourceInventory) || canonicalJson(candidate.transcription) !== canonicalJson(expected.transcription) || canonicalJson(candidate.comparison) !== canonicalJson(expected.comparison)) errors.push('reproduction_drift')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const candidate = JSON.parse(await readFile(path, 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, verdict: candidate.verdictToken, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
