#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

import {
  checkSajuMingliYueyanDirectWitnessAdjudication,
} from '../src/interpretationPrep/sajuMingliYueyanDirectWitnessAdjudicationV1.js'

const artifact = JSON.parse(await readFile('artifacts/saju-mingli-yueyan-direct-witness-adjudication-v1/complete.json', 'utf8'))
const field = (value, name) => value.targetPageReconciliation.fields.find(item => item.field === name)
const cases = [
  ['reader-capture-to-raw-page-bytes', value => { value.targetPageReconciliation.officialTargetPageBytesObtained = true; return value }],
  ['recorded-date-to-physical-production-date', value => { value.firstPartyItem.physicalProductionDateStatus = 'confirmed'; return value }],
  ['bounded-direction-fragment-to-complete-rule', value => { field(value, '順逆').completeRule = true; return value }],
  ['numeric-literal-to-production-procedure', value => { field(value, '三日一歲').productionAuthority = true; return value }],
  ['unobserved-time-unit-to-observation', value => { field(value, '一時辰十日').directObservation = true; return value }],
  ['unobserved-worked-example-to-observation', value => { field(value, 'workedExample').status = 'bounded_direct_literal_not_promoted'; return value }],
  ['reader-capture-to-independent-lineage', value => { value.digitalPhysicalRelationshipAudit.axes[0].countedAsIndependent = true; return value }],
  ['direct-observation-to-semantic-authority', value => { value.readiness.semanticAuthority = 'established'; return value }],
  ['direct-observation-to-promotion', value => { value.promotion.stableClaimPromotionCount = 1; return value }],
]

const results = cases.map(([id, mutate]) => {
  const candidate = structuredClone(artifact)
  const errors = checkSajuMingliYueyanDirectWitnessAdjudication(mutate(candidate))
  return { id, rejected: errors.length > 0, errors }
})

const failed = results.filter(result => !result.rejected)
console.log(JSON.stringify({
  status: failed.length ? 'fail' : 'pass',
  allMustReject: true,
  results,
  failedIds: failed.map(result => result.id),
}, null, 2))
if (failed.length) process.exitCode = 1
