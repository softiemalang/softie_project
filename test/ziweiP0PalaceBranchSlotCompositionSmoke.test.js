import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const versions = Array.from({ length: 13 }, (_, index) => index + 3)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

for (const version of versions) {
  test(`Ziwei P0 v${version} canonical artifact smoke invariants`, () => {
    const artifactId = `ziwei-p0-palace-branch-slot-composition-v${version}`
    const completePath = `artifacts/${artifactId}/complete.json`
    const bytes = readFileSync(join(ROOT, completePath))
    const integrity = JSON.parse(readFileSync(join(ROOT, `${completePath}.integrity.json`), 'utf8'))
    const artifact = JSON.parse(bytes)

    assert.equal(integrity.path, completePath)
    assert.equal(integrity.byteSha256, sha256(bytes))
    assert.equal(artifact.schemaVersion, artifactId)
    assert.equal(artifact.artifactIdentity.artifactId, artifactId)
    assert.equal(artifact.artifactIdentity.contractVersion, 'artifact-identity-v1')
    assert.equal(artifact.readinessImpact.readiness, 'not_safe_to_start')
    assert.equal(artifact.readinessImpact.grounding, 'blocked')
    assert.equal(artifact.readinessImpact.activation, 'experimental_only')
    assert.equal(artifact.readinessImpact.productionModified, false)
    assert.equal(artifact.readinessImpact.semanticAuthorityPromoted, false)
    assert.deepEqual(artifact.graphImpact.blockersClosed, [])
    assert.equal(artifact.bindingMatrix.coverage.directSingleWitnessFullBindingCount, 0)
    assert.equal(artifact.bindingMatrix.coverage.productionOrdinalBindingCount, 0)
  })
}
