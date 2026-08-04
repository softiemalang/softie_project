import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildPilotArtifact, canonicalJson, SCHEMA, VERDICT, MATERIALIZER_VERSION, BASIS_HEAD } from './materialize-ziwei-guarded-occurrence-exact-source-identity-pilot-v0.mjs'
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export async function checkPilotArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const failures = []; const expected = await buildPilotArtifact(); const id = expected.selection.selectedOccurrenceId
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) failures.push('schema_verdict_or_basis')
  if (candidate.record?.occurrenceId !== id || candidate.selection?.rejectedOccurrenceIds?.length !== 3 || candidate.selection?.selectedOccurrenceId !== id) failures.push('target_selection')
  if (!same(candidate.record?.rawText, expected.record.rawText) || !same(candidate.record?.provenance, expected.record.provenance) || !same(candidate.record?.guard, expected.record.guard)) failures.push('protected_inventory_changed')
  if (candidate.record?.verdict !== VERDICT || candidate.record?.scanAssessment?.status !== 'scan_unavailable') failures.push('unsupported_resolution')
  if (candidate.record?.editionAssessment?.status !== 'candidate_editions_not_linked_to_transcription') failures.push('edition_link_overclaim')
  if (candidate.record?.scanAssessment?.immutableHash !== null || candidate.record?.scanAssessment?.fileUrl !== null) failures.push('scan_identity_overclaim')
  if (!candidate.record?.textComparison?.insufficientEvidence || !candidate.record?.textComparison?.omittedQualifier?.length || !candidate.record?.textComparison?.wordingDrift?.length || !candidate.record?.textComparison?.configurationMismatch?.length) failures.push('text_difference_hidden')
  if (candidate.record?.citationLineage?.duplicateLineageNotIndependent !== true) failures.push('lineage_double_count')
  if (candidate.record?.boundaryEvidenceCandidate?.notAStableClaim !== true || candidate.globalBoundary?.stableClaimCount !== 0 || candidate.globalBoundary?.readiness !== 'not_safe_to_start' || candidate.globalBoundary?.groundingSubset !== 'blocked') failures.push('claim_or_readiness_promotion')
  if (candidate.selection?.rule !== 'descending sum of four evidence-axis scores, then occurrenceId ascending' || candidate.candidates?.[0]?.occurrenceId !== id) failures.push('nondeterministic_selection')
  if (candidate.sourceArtifact !== 'artifacts/ziwei-guarded-occurrence-source-evidence-hardening-v0/complete.json') failures.push('wrong_source_artifact')
  if (candidate.record?.sourceIdentityInventory?.some(x => !/^https:\/\//.test(x.url))) failures.push('fake_citation')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const failures = await checkPilotArtifact(JSON.parse(bytes)); console.log(JSON.stringify({ pass: failures.length === 0, selectedOccurrenceId: JSON.parse(bytes).selection?.selectedOccurrenceId, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
