import assert from 'node:assert/strict'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { buildArtifact } from '../scripts/materialize-ziwei-auxiliary-star-placement-core-evidence-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-auxiliary-star-placement-core-evidence-v0.mjs'

test('auxiliary-star evidence is deterministic and exhaustive at the declared boundaries', () => {
  const first = buildArtifact()
  const second = buildArtifact()
  assert.equal(canonicalIdentityJson(first.artifact), canonicalIdentityJson(second.artifact))
  for (const name of Object.keys(first.files)) assert.equal(canonicalIdentityJson(first.files[name]), canonicalIdentityJson(second.files[name]), name)

  assert.equal(first.artifact.targetStars.length, 13)
  assert.deepEqual(first.artifact.sourceEvidence.sourceIdentity.ming_nanyangtang, {
    id: 'ming_nanyangtang',
    label: '明代南阳堂刊本',
    pathOutsideRepository: '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    actualByteSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    expectedByteSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    pageCount: 528,
    encrypted: false,
    readOnly: true,
    storedInGit: false,
  })
  assert.equal(first.artifact.sourceEvidence.sourceIdentity.nanbei_shanren.pageCount, 219)
  assert.equal(first.artifact.occurrenceSummary.source, 820)
  assert.equal(first.artifact.occurrenceSummary.production, 68)
  assert.equal(first.files.comparison.summary.comparableCount, 136)
  assert.equal(first.files.comparison.summary.exactMatchCount, 136)
  assert.equal(first.files.comparison.summary.mismatchCount, 0)
  assert.ok(first.files['transform-search'].searches.every((item) => item.exactFitIds.length === 1 && item.exactFitIds[0] === 'rotation_0'))
  assert.deepEqual(first.files['dependency-graph'].accounting, {
    rootRule: 'lucun',
    derivedRules: ['qingyang', 'tuoluo'],
    rootErrorsNotDoubleCounted: true,
    derivedRowsRetainRootReference: true,
  })
  assert.equal(first.artifact.boundaries.productionEngineModified, false)
  assert.equal(first.artifact.boundaries.sourcePromotion, false)
  assert.deepEqual(checkArtifact(), [])
})
