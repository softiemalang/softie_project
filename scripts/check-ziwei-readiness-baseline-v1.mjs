import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'

const root = resolve(new URL('..', import.meta.url).pathname)
const artifactPath = resolve(root, process.argv[2] || 'artifacts/ziwei-readiness-baseline-v1/complete.json')
const integrityPath = `${artifactPath}.integrity.json`
const assessmentPath = resolve(root, 'docs/ziwei-readiness-baseline-v1.md')
const failures = []
const artifactBytes = await readFile(artifactPath)
const artifact = JSON.parse(artifactBytes)
const integrity = JSON.parse(await readFile(integrityPath))
const assessment = await readFile(assessmentPath, 'utf8')
const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const hash = createHash('sha256').update(artifactBytes).digest('hex')
const requiredLayers = ['input_calendar', 'deterministic_calculation', 'traditional_rule_application', 'fixture_external_validation', 'claim_meaning_candidate_structure', 'provenance', 'relation_graph', 'readiness_context', 'handoff_grounding', 'materialization_checker', 'activation']
const statuses = new Set(['verified', 'implemented_unverified', 'partial', 'experimental', 'regression_only', 'stub_or_simulation', 'documented_only', 'absent', 'blocked'])
const evidenceIds = new Set((artifact.evidence || []).map(item => item.id))

if (artifact.schemaVersion !== 'ziwei-readiness-baseline-v1') failures.push('schema_version')
failures.push(...checkArtifactIdentity(artifact, { root, artifactId: 'ziwei-readiness-baseline-v1', materializerPath: 'scripts/materialize-ziwei-readiness-baseline-v1.mjs', materializerVersion: '1.1.0' }))
if (integrity.artifactByteSha256 !== hash) failures.push('artifact_hash_mismatch')
if (!artifact.sourceIdentity || artifact.sourceIdentity.sourceEditionIdentity !== 'unresolved_source_identity') failures.push('source_identity_overpromoted')
if (artifact.sourceIdentity?.circularValidation !== true) failures.push('circular_validation_not_preserved')
if (artifact.claimAssessment?.stableClaimId !== false || artifact.claimAssessment?.sourceRefsOnOutput !== false) failures.push('claim_boundary_overpromoted')
if (artifact.overall?.claimProvenanceStart !== 'blocked') failures.push('claim_provenance_not_blocked')
if (artifact.validationSummary?.declaredExternalFixtures?.verifiedMatches !== 0) failures.push('verified_fixture_count_nonzero')
if (artifact.validationSummary?.declaredExternalFixtures?.pendingSourceReview !== 6) failures.push('pending_fixture_count_changed')
if (!assessment.includes(`verdict=${artifact.verdictToken}`) || !assessment.includes(`head=${artifact.basisHead}`)) failures.push('assessment_marker_mismatch')
if (!assessment.includes(artifact.materializerPath) || !assessment.includes(artifact.checkerPath)) failures.push('assessment_checker_documentation_mismatch')
for (const layer of artifact.layerStatus || []) {
  if (!assessment.includes(`${layer.id}=${layer.status}`)) failures.push(`assessment_status_mismatch:${layer.id}`)
}
for (const layer of artifact.layerStatus || []) {
  if (!requiredLayers.includes(layer.id)) failures.push(`unknown_layer:${layer.id}`)
  if (!statuses.has(layer.status)) failures.push(`unknown_status:${layer.id}`)
  for (const id of layer.evidenceIds || []) if (!evidenceIds.has(id)) failures.push(`dangling_evidence:${layer.id}:${id}`)
}
for (const id of requiredLayers) if (!(artifact.layerStatus || []).some(layer => layer.id === id)) failures.push(`missing_layer:${id}`)
for (const item of artifact.evidence || []) {
  try { await readFile(resolve(root, item.path)) } catch { failures.push(`missing_evidence_path:${item.id}`) }
  for (const p of [...(item.testPaths || []), ...(item.relatedPaths || [])]) {
    try { await readFile(resolve(root, p)) } catch { failures.push(`missing_related_path:${item.id}:${p}`) }
  }
}

const result = { pass: failures.length === 0, schemaVersion: artifact.schemaVersion, basisHead: artifact.basisHead, artifactByteSha256: hash, layerCount: artifact.layerStatus?.length || 0, evidenceCount: artifact.evidence?.length || 0, failures }
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1
