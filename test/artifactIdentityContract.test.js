import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { artifactPayloadSha256, checkArtifactIdentity } from '../src/artifactIdentity.js'

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
