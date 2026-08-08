import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildArtifact } from '../scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs'
import { canonicalTriSystemReadinessJson, checkTriSystemReadinessContract, isSafeTriSystemRelativePath } from '../src/interpretationPrep/triSystemReadinessContract.js'

test('tri-system integration contract preserves independent readiness and blocks common envelope', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkTriSystemReadinessContract(artifact), [])
  assert.deepEqual(artifact.domains.map(domain => domain.id), ['saju', 'ziwei', 'astrology'])
  assert.deepEqual(artifact.propagation.blockedDomains, ['saju', 'ziwei'])
  assert.equal(artifact.propagation.aggregateReadiness, 'not_computed')
  assert.equal(artifact.envelope.availableForInterpretation, false)
  assert.equal(artifact.domains.find(domain => domain.id === 'astrology').readiness.localResearch, 'eligible_for_local_interpretation_research')
  assert.equal(artifact.domains.find(domain => domain.id === 'saju').readiness.status, 'blocked')
  assert.equal(artifact.domains.find(domain => domain.id === 'ziwei').readiness.status, 'blocked')
  assert.ok(artifact.domains.every(domain => domain.claimInventory.stableClaimCount === 0 || domain.id === 'astrology'))
  assert.equal(artifact.localEvidence.exhausted, true)
})

test('tri-system integration materialization is byte deterministic and checker passes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'astrology-v1-integration-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    execFileSync(process.execPath, ['scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs', a], { cwd: process.cwd() })
    execFileSync(process.execPath, ['scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs', b], { cwd: process.cwd() })
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = execFileSync(process.execPath, ['scripts/check-astrology-v1-local-integration-milestone-v1.mjs', a], { cwd: process.cwd(), encoding: 'utf8' })
    assert.equal(JSON.parse(checked).pass, true)
    assert.equal(
      canonicalTriSystemReadinessJson(await buildArtifact()),
      canonicalTriSystemReadinessJson(await buildArtifact()),
    )
    assert.equal(canonicalTriSystemReadinessJson({ b: 2, a: 1 }), '{"a":1,"b":2}\n')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('tri-system integration checker rejects promotion, propagation, and provenance mutations', async () => {
  const artifact = await buildArtifact()
  const cases = [
    ['domain readiness promotion', value => { value.domains[0].readiness.availableForInterpretation = true }, 'interpretation_availability_promoted'],
    ['stable claim promotion', value => { value.domains[1].claimInventory.stableClaimCount = 1 }, 'stable_claim_boundary_promoted'],
    ['readiness propagation', value => { value.domains[2].propagation.readinessInheritedFromOtherDomain = true }, 'readiness_propagation_detected'],
    ['common envelope promotion', value => { value.envelope.availableForInterpretation = true }, 'common_envelope_promoted'],
    ['source hash mutation', value => { value.domains[0].evidenceRefs[0].byteSha256 = '0'.repeat(64) }, 'content_hash_mismatch'],
  ]
  for (const [label, mutate, expected] of cases) {
    const candidate = structuredClone(artifact)
    mutate(candidate)
    const errors = checkTriSystemReadinessContract(candidate)
    assert.ok(errors.some(error => error.includes(expected.split(':')[0])), `${label}: ${errors.join(',')}`)
  }
})

test('tri-system contract rejects path traversal and malformed roots without throwing', async () => {
  assert.equal(isSafeTriSystemRelativePath('artifacts/example.json'), true)
  assert.equal(isSafeTriSystemRelativePath('../outside.json'), false)
  assert.equal(isSafeTriSystemRelativePath('artifacts/../outside.json'), false)
  assert.equal(isSafeTriSystemRelativePath('/outside.json'), false)
  assert.ok(checkTriSystemReadinessContract(null).includes('schema_or_version_mismatch'))
  assert.ok(checkTriSystemReadinessContract(null).includes('content_hash_mismatch'))
  const artifact = await buildArtifact()
  const candidate = {
    ...artifact,
    domains: artifact.domains.map((domain, index) => index === 0
      ? { ...domain, evidenceRefs: [{ ...domain.evidenceRefs[0], path: '../outside.json' }] }
      : domain),
  }
  const errors = checkTriSystemReadinessContract(candidate)
  assert.ok(errors.some(error => error.includes('evidence_path_not_repo_relative')))
})
