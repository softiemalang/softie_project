import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { checkArtifactIdentity, canonicalIdentityJson, stableArtifactContentEqual, stableArtifactPayload } from '../src/artifactIdentity.js'
import { buildArtifact, BASIS_HEAD, canonicalJson, MATERIALIZER_VERSION, SCHEMA, VERDICT } from './materialize-ziwei-palace-semantic-source-frontier-v1.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'))

const comparable = value => {
  const payload = stableArtifactPayload(value)
  for (const witness of payload.sourceWitnesses || []) delete witness.path
  return payload
}

export function checkBundle(candidate, expected) {
  const errors = []
  if (!candidate || candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis')
  if (canonicalIdentityJson(comparable(candidate)) !== canonicalIdentityJson(comparable(expected))) errors.push('payload_not_reproducible')
  const observations = candidate.sourceObservations || []
  const required = ['nanbei-p1-title', 'nanyang-p1-title', 'nanyang-p2-title-imprint', 'nanbei-p4-branch-trigram-diagram', 'nanbei-p7-twelve-cell-diagram', 'nanbei-p8-ming-shen-rule', 'nanbei-p10-ming-shen-bureau-table']
  if (required.some(id => !observations.some(item => item.id === id))) errors.push('observation_coverage')
  if (observations.some(item => item.visualReview?.renderStorage !== 'external_temp_only_not_in_git' || item.visualReview?.dpi !== 110)) errors.push('visual_review_boundary')
  if (candidate.claims?.find(item => item.id === 'palace_semantic_identity')?.status !== 'blocked_semantic_identity_insufficient') errors.push('semantic_identity_promoted')
  if (candidate.claims?.find(item => item.id === 'cross_edition_semantic_identity')?.status !== 'blocked_cross_edition_identity_unresolved') errors.push('cross_edition_promoted')
  if (candidate.claims?.find(item => item.id === 'production_source_authority')?.status !== 'blocked_source_authority_not_established') errors.push('authority_promoted')
  if (candidate.boundaries?.productionRuleModified !== false || candidate.boundaries?.readinessModified !== false || candidate.boundaries?.existingArtifactsModified !== false || candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.renderStoredInGit !== false) errors.push('mutation_or_readiness_boundary')
  if (candidate.frontierAssessment?.closedWithinScope?.length !== 4 || candidate.frontierAssessment?.stillBlocked?.length !== 4) errors.push('frontier_scope')
  errors.push(...checkArtifactIdentity(candidate, { root: ROOT, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowVerifierInputDrift: true }))
  return [...new Set(errors)]
}

export async function checkArtifact(path = `artifacts/${SCHEMA}/complete.json`) {
  const candidate = JSON.parse(await readFile(resolve(ROOT, path), 'utf8')); const expected = await buildArtifact(); const errors = checkBundle(candidate, expected)
  const body = readFileSync(resolve(ROOT, path)); const sidecar = parse(`${path}.integrity.json`)
  if (sidecar.artifactByteSha256 !== sha256(body)) errors.push('complete_integrity_sidecar')
  for (const name of ['source-witnesses.json', 'source-observations.json', 'claim-ledger.json', 'frontier-assessment.json']) {
    const filePath = resolve(dirname(resolve(ROOT, path)), name); const bytes = readFileSync(filePath); const side = parse(`${filePath}.integrity.json`)
    if (side.artifactByteSha256 !== sha256(bytes)) errors.push(`auxiliary_integrity:${name}`)
  }
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = process.argv[2] || `artifacts/${SCHEMA}/complete.json`; const errors = await checkArtifact(path)
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2)); if (errors.length) process.exitCode = 1
}
