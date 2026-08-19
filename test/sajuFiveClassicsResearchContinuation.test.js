import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuFiveClassicsResearchContinuation,
} from '../src/interpretationPrep/sajuFiveClassicsResearchContinuation.js'
import {
  buildArtifact,
} from '../scripts/materialize-saju-five-classics-research-continuation-v1.mjs'

test('continuation preserves fail-closed readiness and splits the bundled 大運 claim', async () => {
  const artifact = await buildArtifact()
  const sourceFrontier = JSON.parse(await (await import('node:fs/promises')).readFile('artifacts/saju-five-classics-source-identity-frontier-v0/complete.json', 'utf8'))
  const claimAdjudication = JSON.parse(await (await import('node:fs/promises')).readFile('artifacts/saju-five-classics-claim-adjudication-v0/complete.json', 'utf8'))
  const timingAuthority = JSON.parse(await (await import('node:fs/promises')).readFile('artifacts/saju-timing-authority-frontier-v0/complete.json', 'utf8'))
  assert.deepEqual(checkSajuFiveClassicsResearchContinuation(artifact, { sourceFrontier, claimAdjudication, timingAuthority }), [])
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.deepEqual(artifact.readiness.promotionReadyClaimIds, [])
  assert.equal(artifact.claims.some(claim => claim.claimId === 'claim.yuanhai-dayun-start-age'), false)
  assert.equal(artifact.inventory.counts.splitClaims, 7)
  assert.equal(artifact.semanticConflictFindings[0].classification, 'semantic_conflict')
  assert.equal(artifact.semanticConflictFindings[0].locatorMismatch.status, 'ruled_out')
  assert.deepEqual(artifact.semanticConflictFindings[0].additionalHistoricalObservation.observedPhrases, ['輔我用神者是也', '財旺生官'])
  assert.equal(artifact.semanticConflictFindings[0].additionalHistoricalObservation.roleClauseAfterCaiWangShengGuan.text, null)
  assert.match(artifact.claimRelations.find(relation => relation.relationId === 'relation.continuation.xiangshen-conflict-cause').conclusion, /NLC 35296 p\.39 separately confirms/)
  const qiongtongRelation = artifact.claimRelations.find(relation => relation.relationId === 'relation.continuation.qiongtong-three-witness-stability')
  assert.ok(qiongtongRelation.observationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu'))
  assert.ok(qiongtongRelation.observationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu'))
  assert.ok(qiongtongRelation.observationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'))
  const yuanhaiFinding = artifact.unitFindings.find(finding => finding.unitId === 'research-unit-4-yuanhai-promotion-near')
  assert.ok(yuanhaiFinding.evidenceIds.includes('obs.nlc.yuanhai.qilu-conversion-1926'))
  assert.match(yuanhaiFinding.result, /clause-level/)
})

test('negative continuation check rejects completing the unresolved NLC 35296 role clause', async () => {
  const artifact = await buildArtifact()
  const readFile = (await import('node:fs/promises')).readFile
  const sourceFrontier = JSON.parse(await readFile('artifacts/saju-five-classics-source-identity-frontier-v0/complete.json', 'utf8'))
  const claimAdjudication = JSON.parse(await readFile('artifacts/saju-five-classics-claim-adjudication-v0/complete.json', 'utf8'))
  const timingAuthority = JSON.parse(await readFile('artifacts/saju-timing-authority-frontier-v0/complete.json', 'utf8'))
  artifact.semanticConflictFindings[0].additionalHistoricalObservation.roleClauseAfterCaiWangShengGuan.text = '則財為用，官為相'
  const errors = checkSajuFiveClassicsResearchContinuation(artifact, { sourceFrontier, claimAdjudication, timingAuthority })
  assert.ok(errors.includes('xiangshen_finding_role_clause_overclaim'))
})
