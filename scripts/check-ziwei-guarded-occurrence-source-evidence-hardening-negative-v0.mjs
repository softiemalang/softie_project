import { readFile } from 'node:fs/promises'
import { buildHardeningArtifact } from './materialize-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs'
import { checkHardeningArtifact } from './check-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs'

const fixture = JSON.parse(await readFile(new URL('../test/fixtures/ziwei/guarded-occurrence-source-evidence-hardening-negative-v0.json', import.meta.url), 'utf8'))
const clone = value => structuredClone(value)
const mutate = (artifact, id) => {
  const x = clone(artifact); const first = x.records[0]
  if (id === 'target-outside-four') x.records.push(clone(first), { ...clone(first), occurrenceId: 'ziwei-occ-outside-target' })
  if (id === 'blog-promoted') x.sourceLineage.push({ evidenceId: 'evidence-blog', url: 'https://example.com/blog/reprint', independence: 'independent' })
  if (id === 'duplicate-source-counted') x.citationLineage.duplicateSourcesNotCountedAsIndependent = false
  if (id === 'resolved-without-edition') first.sourceIdentityAssessment.status = 'source_identity_resolved'
  if (id === 'configuration-hidden') first.independentRuleCorroboration.conditions = []
  if (id === 'literature-as-truth') first.boundaryEvidenceCandidates[0].notAStableClaim = false
  if (id === 'stable-claim-promoted') x.globalBoundary.stableClaimBoundary = 1
  if (id === 'fake-citation') x.sourceLineage[0].url = 'https://blog.example.invalid/fake'
  if (id === 'nondeterministic-order') x.records.reverse()
  return x
}
const findings = []
for (const item of fixture.cases) {
  const failures = await checkHardeningArtifact(mutate(await buildHardeningArtifact(), item.id))
  if (!failures.length) findings.push(item.detects)
}
console.log(JSON.stringify({ pass: findings.length === 0, findings, caseCount: fixture.cases.length }, null, 2))
if (findings.length) process.exitCode = 1
