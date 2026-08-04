import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(new URL('..', import.meta.url).pathname); const fixture = JSON.parse(await readFile(resolve(root, 'test/fixtures/ziwei/clean-rule-corpus-source-acquisition-feasibility-negative-v0.json'))); const findings = []
for (const x of fixture.cases) {
  if (x.kind === 'catalog_record' && x.status === 'acquirable') findings.push('catalog_existence_not_acquirable')
  if (x.kind === 'login_required' && x.status === 'acquirable') findings.push('login_requirement_hidden')
  if (x.kind === 'purchase_required' && x.status === 'acquirable') findings.push('paid_requirement_hidden')
  if (x.kind === 'application_required' && x.status === 'acquirable') findings.push('application_requirement_hidden')
  if (x.rights === 'assumed') findings.push('rights_inferred')
  if (x.bytes === false && x.hash === true) findings.push('hash_without_bytes')
  if (x.id === 'seed_without_page_map' && x.seed === true && !x.pageMap) findings.push('seed_without_page_map')
  if (['unofficial_mirror','blog','ai_generated'].includes(x.kind)) findings.push(x.kind === 'unofficial_mirror' ? 'unofficial_mirror_promoted' : x.kind === 'ai_generated' ? 'ai_text_promoted' : 'blog_promoted')
  if (x.contentClass === 'interpretive_prose' && x.seed === true) findings.push('interpretive_prose_seed')
  if (x.selectedWithoutLedger === true) findings.push('candidate_scope_expanded')
  if (x.ruleCorpus === true) findings.push('rule_ingestion_promoted')
  if (x.stableClaimCount > 0) findings.push('claim_promoted')
  if (x.grounding === 'grounded') findings.push('grounding_promoted')
  if (x.id === 'random-uuid') findings.push('nondeterministic_id')
  if (x.sort === 'insertion_order') findings.push('nondeterministic_sort')
}
const expected = fixture.cases.map(x => x.expected).sort(); const actual = findings.sort(); const result = { pass: JSON.stringify(actual) === JSON.stringify(expected), caseCount: fixture.cases.length, findings: actual, expected }; console.log(JSON.stringify(result, null, 2)); if (!result.pass) process.exitCode = 1
