import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canonicalJson, materializeAudit, AUDIT_SCHEMA, AUDIT_VERDICT, AUDIT_HEAD } from './materialize-ziwei-source-identity-claim-boundary-audit-v1.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const path = resolve(process.argv[2] || 'artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json')
const failures = []
const bytes = await readFile(path)
const artifact = JSON.parse(bytes)
const expected = await materializeAudit()
const hash = createHash('sha256').update(bytes).digest('hex')
if (artifact.schemaVersion !== AUDIT_SCHEMA) failures.push('schema_version')
if (artifact.verdictToken !== AUDIT_VERDICT || artifact.basisHead !== AUDIT_HEAD) failures.push('verdict_or_basis_head')
if (artifact.observedHead !== AUDIT_HEAD) failures.push('observed_head_not_fixed')
if (canonicalJson(artifact) !== canonicalJson(expected)) failures.push('materialized_content_mismatch')
if (artifact.meaningCandidateOccurrenceInventory?.length !== 19) failures.push('meaning_occurrence_count')
if (artifact.claimBoundaryVocabulary?.distribution?.['stable claim boundary'] !== 0) failures.push('stable_claim_overpromoted')
if (artifact.fixtureProvenanceAssessment?.declaredExternal?.verified !== 0 || artifact.fixtureProvenanceAssessment?.declaredExternal?.pending !== 6) failures.push('external_fixture_promoted')
if (artifact.fixtureProvenanceAssessment?.circularValidationRisk !== true) failures.push('circular_validation_hidden')
if (artifact.provenanceStart?.status !== 'blocked') failures.push('provenance_unblocked')
for (const item of artifact.sourceIdentityInventory || []) {
  if (item.sourceIdentity !== 'unresolved_source_identity') failures.push(`source_identity_resolved:${item.id}`)
  if (!item.evidence?.repositoryByteEvidence) failures.push(`byte_evidence_missing:${item.id}`)
}
for (const item of artifact.meaningCandidateOccurrenceInventory || []) {
  if (!item.text || !item.sourceFile || !item.sourceLocation || !item.occurrenceId) failures.push(`occurrence_incomplete:${item.occurrenceId || 'unknown'}`)
  if (item.boundary === 'stable claim boundary') failures.push(`stable_occurrence_overpromoted:${item.occurrenceId}`)
}
const result = { pass: failures.length === 0, schemaVersion: artifact.schemaVersion, basisHead: artifact.basisHead, artifactByteSha256: hash, sourceCount: artifact.sourceIdentityInventory?.length || 0, occurrenceCount: artifact.meaningCandidateOccurrenceInventory?.length || 0, failures }
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1
