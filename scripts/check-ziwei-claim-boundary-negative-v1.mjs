import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const fixture = JSON.parse(await readFile(resolve(root, 'test/fixtures/ziwei/claim-boundary-negative-v1.json')))
const findings = []
for (const c of fixture.cases) {
  if (c.mergedOriginalTexts?.length > 1) findings.push('forced_original_text_merge')
  if (c.sourceLocation === null) findings.push('source_location_missing')
  if (c.fixtureStatus === 'regression_only' && c.promotedStatus === 'verified') findings.push('regression_fixture_promoted')
  if (c.sourceIdentity === 'unresolved_source_identity' && c.resolutionState === 'verified') findings.push('unresolved_source_hidden')
  if (c.sourceVariants?.length > 1 && c.collapsed === true) findings.push('edition_school_difference_deleted')
  if (c.rankByFrequency === true) findings.push('frequency_ranking')
  if (c.idsAreStable === false || c.sort === 'insertion_order') findings.push('nondeterministic_id_or_sort')
}
const expected = fixture.cases.map(c => c.expectedCode).sort()
const actual = [...findings].sort()
const pass = JSON.stringify(actual) === JSON.stringify(expected)
console.log(JSON.stringify({ pass, caseCount: fixture.cases.length, findings: actual, expected }, null, 2))
if (!pass) process.exitCode = 1
