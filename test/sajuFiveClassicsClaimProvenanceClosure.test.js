import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ARTIFACT_PATH,
} from '../scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs'
import {
  checkArtifact,
} from '../scripts/check-saju-five-classics-claim-provenance-closure-v0.mjs'

const readArtifact = async () => JSON.parse(await readFile(ARTIFACT_PATH, 'utf8'))

test('Five Classics claim provenance closure keeps current source revalidation explicit', async () => {
  const artifact = await readArtifact()
  const errors = await checkArtifact(artifact, { mode: 'source' })
  assert.deepEqual(errors, [])
  assert.equal(artifact.publication.sourceRevalidationProfile, 'source')
  assert.equal(artifact.publication.historicalReplayProfile, 'historical')
  assert.equal(artifact.timingAuthorityRelation.generationDependency, false)
  assert.equal(artifact.timingAuthorityRelation.relation, 'not_a_generation_dependency')
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.stableClaimPromotionCount, 0)
  assert.deepEqual(artifact.readiness.promotionReadyClaimIds, [])
})
