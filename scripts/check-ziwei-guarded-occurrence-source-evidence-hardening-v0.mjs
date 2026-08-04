import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildHardeningArtifact, canonicalJson, SCHEMA, VERDICT, MATERIALIZER_VERSION, BASIS_HEAD } from './materialize-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs'

const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b))
const TARGETS = ['ziwei-occ-2260aba6ed2163e3', 'ziwei-occ-a09e10a5495186b8', 'ziwei-occ-a72bdf60ef809b58', 'ziwei-occ-e73f469c5e35e072']

export async function checkHardeningArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []; const expected = await buildHardeningArtifact()
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) failures.push('schema_verdict_or_basis')
  if (!same(candidate.targetSelection?.occurrenceIds, TARGETS) || candidate.targetSelection?.occurrenceCount !== 4) failures.push('target_selection')
  if (candidate.records?.length !== 4 || new Set(candidate.records.map(x => x.occurrenceId)).size !== 4) failures.push('target_count_or_duplicate')
  if (candidate.globalBoundary?.stableClaimBoundary !== 0 || candidate.globalBoundary?.readiness !== 'not_safe_to_start' || candidate.globalBoundary?.grounding !== 'not_safe_to_start' || candidate.globalBoundary?.activation !== 'experimental' || candidate.globalBoundary?.groundingSubset !== 'blocked') failures.push('boundary_promoted')
  const expectedById = new Map(expected.records.map(x => [x.occurrenceId, x])); const seen = new Set()
  for (const record of candidate.records || []) {
    const id = record.occurrenceId
    if (seen.has(id)) failures.push(`duplicate:${id}`); seen.add(id)
    if (!expectedById.has(id)) { failures.push(`outside_target:${id}`); continue }
    const expectedRecord = expectedById.get(id)
    for (const field of ['rawText', 'provenance', 'guardPreservation', 'limits']) if (!same(record[field], expectedRecord[field])) failures.push(`protected_field_changed:${field}:${id}`)
    if (record.sourceIdentityAssessment?.status === 'source_identity_resolved' || record.sourceIdentityAssessment?.status === 'source_identity_resolved_and_independently_corrobated') failures.push(`unsupported_resolved:${id}`)
    if (record.sourceIdentityAssessment?.status === 'source_identity_resolved' && (!record.sourceIdentityAssessment?.edition || !record.sourceIdentityAssessment?.location)) failures.push(`resolved_without_bibliography:${id}`)
    if (record.verdict !== 'source_identity_partial') failures.push(`invalid_verdict:${id}`)
    if (record.independentRuleCorroboration?.status !== 'insufficient_evidence' || record.independentRuleCorroboration?.sameRuleMatch !== false) failures.push(`independent_overclaim:${id}`)
    if (!record.ruleCorrespondence?.conditions?.length) failures.push(`configuration_or_opposing_evidence_hidden:${id}`)
    if (!record.evidenceLedger?.length || record.evidenceIds?.length !== record.evidenceLedger?.length) failures.push(`ledger_missing:${id}`)
    if (record.evidenceLedger?.some(e => e.evidenceId === 'evidence-ctext-ziwei-palace-index' && e.independence === 'independent')) failures.push(`parallel_source_promoted:${id}`)
    if (record.boundaryEvidenceCandidates?.some(c => c.notAStableClaim !== true)) failures.push(`boundary_candidate_promoted:${id}`)
    if (record.guardPreservation?.stableClaim !== false) failures.push(`stable_claim:${id}`)
  }
  if (JSON.stringify((candidate.records || []).map(x => x.occurrenceId)) !== JSON.stringify(TARGETS)) failures.push('nondeterministic_order')
  if (!same(candidate.distribution, expected.distribution) || candidate.distribution.source_identity_partial !== 4 || candidate.distribution.independentCorroborationInsufficient !== 4) failures.push('distribution')
  if (candidate.citationLineage?.duplicateSourcesNotCountedAsIndependent !== true) failures.push('citation_lineage_missing')
  if (candidate.sourceLineage?.some(source => !/^https:\/\//.test(source.url) || /blog|medium|reddit/i.test(source.url))) failures.push('fake_or_weak_citation')
  if (candidate.negativeContract?.detects?.length !== 9) failures.push('negative_coverage')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const artifact = JSON.parse(bytes); const failures = await checkHardeningArtifact(artifact); console.log(JSON.stringify({ pass: failures.length === 0, basisHead: artifact.basisHead, occurrenceCount: artifact.records?.length || 0, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
