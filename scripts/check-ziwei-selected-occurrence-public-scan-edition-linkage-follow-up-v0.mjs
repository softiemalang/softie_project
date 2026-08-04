import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildFollowUpArtifact, canonicalJson, SCHEMA, VERDICT, MATERIALIZER_VERSION, BASIS_HEAD, TARGET_OCCURRENCE, SOURCE_ARTIFACT } from './materialize-ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-v0.mjs'
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export async function checkFollowUpArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildFollowUpArtifact(); const failures = []
  if (candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) failures.push('schema_verdict_or_basis')
  if (!same(candidate.scope?.occurrenceIds, [TARGET_OCCURRENCE]) || candidate.scope?.expansion !== 'none') failures.push('scope_expansion')
  if (candidate.selectedOccurrence?.occurrenceId !== TARGET_OCCURRENCE || !same(candidate.selectedOccurrence.rawText, expected.selectedOccurrence.rawText) || !same(candidate.selectedOccurrence.provenance, expected.selectedOccurrence.provenance) || !same(candidate.selectedOccurrence.guard, expected.selectedOccurrence.guard)) failures.push('protected_inventory_changed')
  if (candidate.linkageTrace?.length !== 2 || candidate.linkageTrace.some(x => x.viewerFile?.fileUrl !== null || x.viewerFile?.imageManifestUrl !== null || x.editionVolumePage?.page !== null || x.editionVolumePage?.status !== 'page_not_located')) failures.push('unresolved_linkage_overclaim')
  if (candidate.immutableIdentity?.scanBytesObtained !== false || candidate.immutableIdentity?.sha256 !== null || candidate.immutableIdentity?.fileSizeBytes !== null) failures.push('immutable_identity_overclaim')
  if (candidate.textComparison?.wikisource?.exactMatch !== false || candidate.textComparison?.wikisource?.normalizedMatch !== false || !candidate.textComparison?.wikisource?.qualifierDifferences?.length || !candidate.textComparison?.wikisource?.wordingDrift?.length) failures.push('text_difference_hidden')
  if (candidate.assessment?.finalVerdict !== VERDICT || candidate.assessment?.legacySourceRecovery !== 'frozen' || candidate.assessment?.nextTrack !== 'clean Ziwei rule corpus') failures.push('assessment_boundary')
  if (candidate.globalBoundary?.stableClaimCount !== 0 || candidate.globalBoundary?.verifiedFactCount !== 0 || candidate.globalBoundary?.readiness !== 'not_safe_to_start' || candidate.globalBoundary?.groundingSubset !== 'blocked' || candidate.globalBoundary?.scopeExpanded !== false) failures.push('claim_or_readiness_promotion')
  if (candidate.sourceArtifact !== SOURCE_ARTIFACT || candidate.linkageTrace.some(x => !/^https:\/\//.test(x.catalog.stableUrl) || !x.catalog.recordId || !x.holding.itemId)) failures.push('citation_or_holding_identity')
  if (candidate.deterministicContract?.editionOrder !== 'fixed NCL then CiNii order' || candidate.deterministicContract?.target !== TARGET_OCCURRENCE) failures.push('nondeterministic_contract')
  failures.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(failures)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const bytes = await readFile(path); const failures = await checkFollowUpArtifact(JSON.parse(bytes)); console.log(JSON.stringify({ pass: failures.length === 0, verdict: JSON.parse(bytes).verdictToken, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), failures }, null, 2)); if (failures.length) process.exitCode = 1 }
