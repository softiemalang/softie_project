import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { checkSajuAnuV6V12DirectInspection } from '../src/interpretationPrep/sajuAnuV6V12DirectInspection.js'
import { buildArtifact } from '../scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs'

const artifactPath = 'artifacts/saju-anu-v6-v12-direct-inspection-v0/complete.json'

test('ANU v6-v12 direct inspection preserves parent gates and closes only bounded page observations', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  assert.deepEqual(checkSajuAnuV6V12DirectInspection(artifact), [])
  assert.deepEqual(artifact.volumeCrosswalk.map(item => item.titlePage.printedVolumeTitle), [
    '三命通會卷之六',
    '三命通會卷之七',
    '三命通會卷之八',
    '三命通會卷之九',
    '三命通會卷之十',
    '三命通會卷之十一',
    '三命通會卷之十二',
  ])
  assert.ok(artifact.volumeCrosswalk.every(item => item.titlePage.pdfPage === 3 && item.titlePage.printedFolio === null))
  assert.equal(artifact.summary.printedFolioClosedCount, 0)
  assert.equal(artifact.summary.directTimingObservationCount, 2)
  const p7 = artifact.pageObservations.find(item => item.observationId === 'obs.anu.v11.p7-dayun-heading')
  const p24 = artifact.pageObservations.find(item => item.observationId === 'obs.anu.v11.p24-dayun-literal-variant')
  assert.ok(p7.observed.includes('大運折除成歲小運逆順由時'))
  assert.ok(p24.observed.includes('運行則一辰十歲'))
  assert.ok(p24.observed.includes('折除乃三日為年'))
  assert.equal(p24.literalAudit.oneTimeUnitTenDays, 'not_observed')
  assert.equal(p24.semanticRelation.normalizationPerformed, false)
  assert.equal(artifact.lineageGraph.canonicalEdges.length, 0)
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.deepEqual(artifact.typedReadinessRecalculation.before, artifact.typedReadinessRecalculation.after)
})

test('ANU direct inspection materialization is deterministic and negative checker rejects shortcuts', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  const negative = spawnSync(process.execPath, ['scripts/check-saju-anu-v6-v12-direct-inspection-negative-v0.mjs'], { encoding: 'utf8' })
  assert.equal(negative.status, 0, negative.stderr || negative.stdout)
  const report = JSON.parse(negative.stdout)
  assert.equal(report.status, 'pass')
  assert.equal(report.results.length, 10)
  assert.ok(report.results.every(result => result.rejected))
})
