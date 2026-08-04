import { buildOccurrenceProvenance } from './materialize-ziwei-occurrence-provenance-v0.mjs'
import { checkOccurrenceProvenance } from './check-ziwei-occurrence-provenance-v0.mjs'

const base = await buildOccurrenceProvenance()
const cases = [
  ['different_originals_merged', x => { x.occurrences[0].rawText.text = x.occurrences[1].rawText.text }],
  ['source_location_lost', x => { x.occurrences[0].source.location = null }],
  ['stable_claim_id_invented', x => { x.occurrences[0].claimBoundary.stableClaimId = 'claim-x' }],
  ['internal_fixture_promoted', x => { x.fixturePolicy.internal.status = 'verified' }],
  ['unresolved_source_hidden', x => { x.occurrences[0].sourceIdentity.status = 'verified' }],
  ['scoped_match_expanded', x => { x.fixturePolicy.external.verified = 6 }],
  ['frequency_ranking', x => { x.forbiddenTransformations = x.forbiddenTransformations.filter(v => v !== 'frequency_ranking') }],
  ['dangling_reference', x => { x.evidenceIndex[Object.keys(x.evidenceIndex)[0]].occurrenceIds.push('ziwei-occ-dangling') }],
  ['raw_text_verified_fact', x => { x.occurrences[0].rawText.isVerifiedFact = true }],
  ['nondeterministic_sort', x => { x.occurrences.reverse() }],
]
const findings = []
for (const [name, mutate] of cases) { const candidate = structuredClone(base); mutate(candidate); const failures = await checkOccurrenceProvenance(candidate); if (failures.length) findings.push(name) }
const result = { pass: findings.length === cases.length, caseCount: cases.length, findings, expectedCases: cases.map(([name]) => name) }
console.log(JSON.stringify(result, null, 2))
if (!result.pass) process.exitCode = 1
