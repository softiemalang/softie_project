import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const fixture = JSON.parse(await readFile(resolve(root, 'test/fixtures/ziwei/clean-rule-corpus-source-selection-negative-v0.json')))
const findings = []
for (const item of fixture.cases) {
  if (item.verdict === 'admissible' && (!item.edition || !item.location)) findings.push('admissible_missing_edition_or_location')
  if (item.sourceKind === 'catalog_record' && item.claimsScan === true) findings.push('catalog_only_scan_claim')
  if (item.duplicateLineage === true && item.countsAsIndependentCandidate === true) findings.push('mirror_reprint_double_count')
  if (item.sourceKind === 'blog_or_ai_generated' && item.promoted === true) findings.push('unattributed_blog_ai_promotion')
  if (item.fileHash === 'inferred') findings.push('file_identity_inferred')
  if (item.lineage === 'inferred') findings.push('lineage_inferred')
  if (item.contentClass === 'interpretive_prose' && item.status === 'verified') findings.push('interpretive_prose_verified_claim')
  if (item.bypassUsed === true) findings.push('access_restriction_bypass')
  if (item.legacyOccurrenceLink) findings.push('legacy_occurrence_auto_link')
  if (item.readiness === 'ready' || item.grounding === 'grounded' || item.activation === 'active') findings.push('downstream_promotion')
  if (item.candidateId === 'random-uuid' || item.sort === 'insertion_order') findings.push('nondeterministic_id_or_sort')
  if (item.checkoutHeadChanged === true && item.inputChanged === false) findings.push('checkout_head_only_not_stale')
  if (item.baseHeadExists === false) findings.push('base_head_missing')
  if (item.basisHeadOverwritten === true) findings.push('historical_basis_head_overwritten')
  if (item.inputHash === null) findings.push('input_hash_missing')
  if (item.inputHashChanged === true) findings.push('input_hash_mismatch')
  if (item.payloadHashChanged === true) findings.push('payload_hash_mismatch')
  if (item.materializerVersionChanged === true) findings.push('materializer_version_mismatch')
  if (item.feasibilityStatus === 'acquirable') findings.push('feasibility_promotion')
  if (item.includedCommit) findings.push('included_commit_self_reference')
}
const expected = fixture.cases.map(item => item.expectedCode).sort()
const actual = [...findings].sort()
const pass = JSON.stringify(actual) === JSON.stringify(expected)
console.log(JSON.stringify({ pass, caseCount: fixture.cases.length, findings: actual, expected }, null, 2))
if (!pass) process.exitCode = 1
