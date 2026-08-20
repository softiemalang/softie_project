import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  P0_FIELDS,
  checkSajuMingliYueyanFirstPartyInspection,
} from '../src/interpretationPrep/sajuMingliYueyanFirstPartyInspection.js'
import { buildArtifact } from '../scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs'

const artifactPath = 'artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json'

test('命理約言 first-party item identity is closed while target-page timing remains blocked', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  assert.deepEqual(checkSajuMingliYueyanFirstPartyInspection(artifact), [])
  assert.equal(artifact.summary.firstPartyItemIdentityConfirmed, true)
  assert.equal(artifact.summary.firstPartyTargetPageObtained, false)
  assert.equal(artifact.summary.directTargetPageObservationCount, 0)
  assert.equal(artifact.summary.directTimingObservationCount, 0)
  assert.equal(artifact.summary.mirrorLocatorCount, 2)
  assert.equal(artifact.summary.unresolvedP0FieldCount, P0_FIELDS.length)
  assert.deepEqual(artifact.targetPageReconciliation.fields.map(field => field.field), [...P0_FIELDS])
  assert.ok(artifact.targetPageReconciliation.fields.every(field => field.status === 'unresolved_target_page_access_blocked'))
  assert.equal(artifact.firstPartyItem.identityStatus, 'confirmed_item_record_only')
  assert.equal(artifact.firstPartyItem.titleCatalog, '精选命理约言')
  assert.equal(artifact.firstPartyItem.titleCover, '精選命理約言')
  assert.equal(artifact.firstPartyItem.publicationDateRecorded, '民国二十四年[1935]')
  assert.equal(artifact.firstPartyItem.access.permission.success, false)
  assert.equal(artifact.firstPartyItem.access.directPdfEndpoint.httpStatus, 404)
  assert.equal(artifact.mirrorLocator.physicalWitnessAdmitted, false)
  assert.equal(artifact.mirrorLocator.independentWitnessCount, 0)
  assert.equal(artifact.lineageGraph.canonicalEdges.length, 0)
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.deepEqual(artifact.typedReadinessRecalculation.before, artifact.typedReadinessRecalculation.after)
  const claim = artifact.sourceClaimReconciliation.claims.find(item => item.claimId === 'claim.E.mingli-yueyan-direct-observation')
  assert.ok(claim)
  assert.equal(claim.statusBefore, 'unresolved')
  assert.equal(claim.statusAfter, 'unresolved')
})

test('命理約言 materialization is deterministic and negative checks reject shortcut promotions', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  const negative = spawnSync(process.execPath, ['scripts/check-saju-mingli-yueyan-first-party-inspection-negative-v0.mjs'], { encoding: 'utf8' })
  assert.equal(negative.status, 0, negative.stderr || negative.stdout)
  const report = JSON.parse(negative.stdout)
  assert.equal(report.status, 'pass')
  assert.equal(report.results.length, 8)
  assert.ok(report.results.every(result => result.rejected))
})
