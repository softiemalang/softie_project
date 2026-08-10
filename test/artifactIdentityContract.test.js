import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { artifactPayloadSha256, checkArtifactIdentity, checkHistoricalRepositoryBasis, fileByteIdentity, inspectFileByteIdentity, stableArtifactContentEqual } from '../src/artifactIdentity.js'

const root = process.cwd()
const inventory = JSON.parse(readFileSync('artifacts/tri-system-readiness-v1/inventory.json', 'utf8'))
const options = { root, artifactId: 'tri-system-readiness-v1', materializerPath: 'scripts/materialize-tri-system-readiness.mjs', materializerVersion: '1.1.0' }

test('a later checkout HEAD does not stale an artifact whose input identity still matches', () => {
  assert.equal(inventory.artifactIdentity.generation.baseHead, 'acb1af9f7ad393cea23d8d9949660c9bcfe37beb')
  assert.notEqual(inventory.artifactIdentity.generation.baseHead, 'd40f0fe167a020a6c6f576ac45bd180c2989da55')
  assert.deepEqual(checkArtifactIdentity(inventory, options), [])
})

test('negative identity mutations fail closed', () => {
  const cases = [
    ['generation base missing', value => { delete value.artifactIdentity.generation.baseHead }],
    ['input hash mismatch', value => { value.artifactIdentity.inputs[0].byteSha256 = '0'.repeat(64) }],
    ['contract version mismatch', value => { value.artifactIdentity.contractVersion = 'artifact-identity-v0' }],
    ['materializer mismatch', value => { value.artifactIdentity.materializer.version = '9.9.9' }],
    ['wrong artifact reuse', value => { value.artifactIdentity.artifactId = 'ziwei-readiness-baseline-v1' }],
    ['included commit reintroduced', value => { value.artifactIdentity.generation.includedCommit = 'd40f0fe167a020a6c6f576ac45bd180c2989da55' }],
    ['payload identity mismatch', value => { value.artifactIdentity.artifactPayloadSha256 = 'f'.repeat(64) }],
  ]
  for (const [name, mutate] of cases) {
    const candidate = structuredClone(inventory)
    mutate(candidate)
    assert.ok(checkArtifactIdentity(candidate, options).length > 0, name)
  }
})

test('input changes are checked independently of HEAD freshness', () => {
  const candidate = structuredClone(inventory)
  candidate.artifactIdentity.inputs[0].byteSha256 = '1'.repeat(64)
  candidate.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(candidate)
  assert.match(checkArtifactIdentity(candidate, options).join('\n'), /input byte identity mismatch/)
})

test('historical repository basis accepts a verified descendant without erasing provenance', () => {
  const basis = checkHistoricalRepositoryBasis(root, inventory.artifactIdentity.generation.baseHead)
  assert.equal(basis.errors.length, 0)
  assert.equal(basis.status, 'descendant_snapshot')
  assert.notEqual(basis.currentHead, inventory.artifactIdentity.generation.baseHead)

  const input = fileByteIdentity(root, 'src/artifactIdentity.js')
  const inspected = inspectFileByteIdentity(root, input.path, input.byteSha256, {
    generationBaseHead: inventory.artifactIdentity.generation.baseHead,
  })
  assert.equal(inspected.currentMatches, true)
  assert.equal(inspected.status, 'current_bytes_match')
})

test('historical basis mutation is rejected by ancestry verification', () => {
  const mutated = structuredClone(inventory)
  mutated.artifactIdentity.generation.baseHead = '0'.repeat(40)
  const result = checkHistoricalRepositoryBasis(root, mutated.artifactIdentity.generation.baseHead)
  assert.ok(result.errors.includes('basis_commit_not_found'))
  assert.ok(result.errors.includes('basis_not_ancestor_of_current_head'))
  assert.ok(result.errors.includes('basis_not_ancestor_of_origin_main'))
})

test('stable artifact content ignores repository diagnostics but rejects payload mutation', () => {
  const historical = { basisHead: 'a'.repeat(40), observedHead: 'b'.repeat(40), scope: { currentHead: 'c'.repeat(40), originMainHead: 'd'.repeat(40) }, value: { count: 1 } }
  const descendant = structuredClone(historical)
  descendant.observedHead = 'e'.repeat(40)
  descendant.scope.currentHead = 'f'.repeat(40)
  descendant.scope.originMainHead = '0'.repeat(40)
  assert.equal(stableArtifactContentEqual(historical, descendant), true)
  descendant.value.count = 2
  assert.equal(stableArtifactContentEqual(historical, descendant), false)
})
