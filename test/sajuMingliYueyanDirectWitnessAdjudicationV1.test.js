import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  P0_FIELD_DECISIONS,
  P0_FIELDS,
  checkSajuMingliYueyanDirectWitnessAdjudication,
} from '../src/interpretationPrep/sajuMingliYueyanDirectWitnessAdjudicationV1.js'
import { buildArtifact } from '../scripts/materialize-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs'

const artifactPath = 'artifacts/saju-mingli-yueyan-direct-witness-adjudication-v1/complete.json'

test('NLC reader captures add bounded direct observations without closing or promoting the seven P0 fields', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  assert.deepEqual(checkSajuMingliYueyanDirectWitnessAdjudication(artifact), [])
  assert.equal(artifact.summary.firstPartyItemIdentityConfirmed, true)
  assert.equal(artifact.summary.firstPartyReaderPagesObserved, true)
  assert.deepEqual(artifact.firstPartyItem.readerPagesObserved, [85, 86, 87])
  assert.equal(artifact.summary.directTargetPageObservationCount, 3)
  assert.equal(artifact.summary.directlyObservedP0FieldCount, 4)
  assert.equal(artifact.summary.completeP0FieldClosureCount, 0)
  assert.equal(artifact.summary.unresolvedP0FieldCount, P0_FIELDS.length)
  assert.equal(artifact.targetPageReconciliation.officialTargetPageBytesObtained, false)
  assert.equal(artifact.targetPageReconciliation.noWholeVolumeNegative, true)
  assert.deepEqual(artifact.targetPageReconciliation.fields.map(field => field.field), [...P0_FIELDS])

  const fields = Object.fromEntries(artifact.targetPageReconciliation.fields.map(field => [field.field, field]))
  assert.equal(fields.順逆.directObservation, true)
  assert.equal(fields.順逆.status, P0_FIELD_DECISIONS.順逆.status)
  assert.deepEqual(fields.順逆.observedFragments, P0_FIELD_DECISIONS.順逆.observedFragments)
  assert.equal(fields.節選択.directObservation, true)
  assert.equal(fields.三日一歲.literal, '三日則為一歲。')
  assert.equal(fields.一日四月.literal, '一日則為四月。')
  assert.equal(fields.一時辰十日.directObservation, false)
  assert.equal(fields.workedExample.directObservation, false)
  assert.ok(artifact.targetPageReconciliation.fields.every(field => field.completeRule === false && field.productionAuthority === false))

  assert.equal(artifact.sourceClaimReconciliation.statusMutation, false)
  assert.equal(artifact.sourceClaimReconciliation.parentArtifact.unchanged, true)
  assert.equal(artifact.digitalPhysicalRelationshipAudit.overallState, 'unresolved')
  assert.equal(artifact.digitalPhysicalRelationshipAudit.canonicalTransmissionEdges.length, 0)
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
})

test('direct witness v1 materialization is deterministic and rejects shortcut promotion', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  const negative = spawnSync(process.execPath, ['scripts/check-saju-mingli-yueyan-direct-witness-adjudication-v1-negative-v0.mjs'], { encoding: 'utf8' })
  assert.equal(negative.status, 0, negative.stderr || negative.stdout)
  const report = JSON.parse(negative.stdout)
  assert.equal(report.status, 'pass')
  assert.equal(report.results.length, 9)
  assert.ok(report.results.every(result => result.rejected), JSON.stringify(report))
  assert.equal(artifact.summary.promotionCount, 0)
})
