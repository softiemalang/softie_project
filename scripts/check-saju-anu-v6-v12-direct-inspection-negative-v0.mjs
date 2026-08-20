#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

import { checkSajuAnuV6V12DirectInspection } from '../src/interpretationPrep/sajuAnuV6V12DirectInspection.js'

const artifact = JSON.parse(await readFile('artifacts/saju-anu-v6-v12-direct-inspection-v0/complete.json', 'utf8'))
const cases = [
  ['metadata-volume-to-printed-folio', value => { value.volumeCrosswalk[0].titlePage.printedFolio = '六'; return value }],
  ['digital-files-to-independent-physical-witnesses', value => { value.digitalPhysicalRelationshipAudit.axes[0].countedAsIndependent = true; return value }],
  ['literal-to-time-unit-normalization', value => { value.pageObservations.find(item => item.observationId === 'obs.anu.v11.p24-dayun-literal-variant').literalAudit.oneTimeUnitTenDays = 'derived_from_一辰十歲'; return value }],
  ['literal-variant-to-semantic-equivalence', value => { value.pageObservations.find(item => item.observationId === 'obs.anu.v11.p24-dayun-literal-variant').semanticRelation.normalizationPerformed = true; return value }],
  ['title-page-to-edition-date', value => { value.metadataRegressionAudit.disposition.editionDate = 'confirmed'; return value }],
  ['handwritten-mark-to-printed-folio', value => { value.volumeCrosswalk[1].titlePage.handwrittenMarkStatus = 'printed_folio'; return value }],
  ['same-item-observation-to-production-authority', value => { value.readiness.availableForInterpretation = true; return value }],
  ['hypothesis-edge-to-canonical-graph', value => { value.lineageGraph.canonicalEdges.push({ edgeId: 'injected', status: 'HYPOTHESIS' }); return value }],
  ['absence-from-locator-to-whole-volume-negative', value => { value.timingSearchAudit.byVolume[0].wholeVolumeNegativeClaim = true; return value }],
  ['parent-status-to-successor-promotion', value => { value.sourceClaimReconciliation.claims[0].statusAfter = 'corrected'; return value }],
]

const results = cases.map(([id, mutate]) => {
  const candidate = structuredClone(artifact)
  const errorsBeforeIdentity = checkSajuAnuV6V12DirectInspection(mutate(candidate))
  return { id, rejected: errorsBeforeIdentity.length > 0, errors: errorsBeforeIdentity }
})

const failed = results.filter(result => !result.rejected)
console.log(JSON.stringify({
  status: failed.length ? 'fail' : 'pass',
  allMustReject: true,
  results,
  failedIds: failed.map(result => result.id),
}, null, 2))
if (failed.length) process.exitCode = 1
