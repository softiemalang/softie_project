import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs'
import {
  checkArtifact,
} from '../scripts/check-saju-five-classics-claim-provenance-closure-v0.mjs'
import {
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

const readArtifact = async () => JSON.parse(await readFile(ARTIFACT_PATH, 'utf8'))

test('Five Classics claim provenance closure replays exact predecessor bytes without PDFs', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: process.cwd(),
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs',
    materializerVersion: VERSION,
  })
  assert.deepEqual(await checkArtifact(artifact, { mode: 'historical' }), [])
  assert.equal(artifact.publication.existingV0ArtifactBytesPreserved, true)
  assert.equal(artifact.publication.semanticPayloadChanged, false)
  assert.equal(artifact.publication.readinessChanged, false)
  assert.equal(artifact.publication.promotionChanged, false)
  assert.equal(artifact.timingAuthorityRelation.generationDependency, false)
})
test('Five Classics claim provenance closure rejects predecessor identity tampering', async () => {
  const artifact = await readArtifact()

  const sourceInputTamper = structuredClone(artifact)
  sourceInputTamper.sourceFrontierPredecessor.artifactIdentity.inputs[0].byteSha256 = 'f'.repeat(64)
  assert.ok((await checkArtifact(sourceInputTamper, { mode: 'historical', artifactPath: null })).includes('source_predecessor_identity'))

  const sourceSidecarTamper = structuredClone(artifact)
  sourceSidecarTamper.sourceFrontierPredecessor.sidecarByteSha256 = 'e'.repeat(64)
  assert.ok((await checkArtifact(sourceSidecarTamper, { mode: 'historical', artifactPath: null })).includes('source_predecessor_identity'))

  const sourcePayloadTamper = structuredClone(artifact)
  sourcePayloadTamper.sourceFrontierPredecessor.artifactByteSha256 = 'd'.repeat(64)
  assert.ok((await checkArtifact(sourcePayloadTamper, { mode: 'historical', artifactPath: null })).includes('source_predecessor_identity'))

  const timingRelationTamper = structuredClone(artifact)
  timingRelationTamper.timingAuthorityRelation.generationDependency = true
  assert.ok((await checkArtifact(timingRelationTamper, { mode: 'historical', artifactPath: null })).includes('timing_relation_identity'))
})
