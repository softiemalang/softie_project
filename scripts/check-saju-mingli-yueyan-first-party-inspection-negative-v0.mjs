#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

import {
  checkSajuMingliYueyanFirstPartyInspection,
} from '../src/interpretationPrep/sajuMingliYueyanFirstPartyInspection.js'

const artifact = JSON.parse(await readFile('artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json', 'utf8'))
const cases = [
  ['first-party-item-to-target-page-observation', value => { value.targetPageReconciliation.fields[0].directObservation = true; return value }],
  ['mirror-to-physical-witness', value => { value.mirrorLocator.physicalWitnessAdmitted = true; return value }],
  ['mirror-to-independent-corroboration', value => { value.mirrorLocator.independentWitnessCount = 1; return value }],
  ['recorded-date-to-physical-production-date', value => { value.firstPartyItem.physicalProductionDateStatus = 'confirmed'; return value }],
  ['section-heading-to-numeric-rule', value => { value.timingReconciliation.mirrorCandidate.threeDaysOneYear = 'direct_literal'; return value }],
  ['permission-block-to-whole-volume-negative', value => { value.targetPageReconciliation.noWholeVolumeNegative = false; return value }],
  ['item-identity-to-semantic-authority', value => { value.readiness.semanticAuthority = 'established'; return value }],
  ['blocked-target-to-promotion', value => { value.promotion.stableClaimPromotionCount = 1; return value }],
]

const results = cases.map(([id, mutate]) => {
  const candidate = structuredClone(artifact)
  const errors = checkSajuMingliYueyanFirstPartyInspection(mutate(candidate))
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
