import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFieldKit, canonicalJson, SCHEMA, VERDICT } from '../scripts/materialize-tri-system-evidence-acquisition-field-kit-v1.mjs'
import { checkArtifact } from '../scripts/check-tri-system-evidence-acquisition-field-kit-v1.mjs'

test('tri-system field kit covers every current blocker and preserves readiness boundaries', async () => {
  const artifact = await buildFieldKit()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.verdictToken, VERDICT)
  assert.equal(artifact.scope.currentHead, artifact.scope.expectedHead)
  assert.equal(artifact.scope.originMainHead, artifact.scope.expectedHead)
  assert.equal(artifact.targets.length, 19)
  assert.equal(artifact.noAction.length, 2)
  assert.deepEqual(await checkArtifact(artifact), [])
  assert.equal(artifact.currentAudit.systems.find(system => system.id === 'saju').readiness.startsWith('availableForInterpretation:false'), true)
  assert.equal(artifact.currentAudit.systems.find(system => system.id === 'ziwei').stableClaimCount, 0)
  assert.equal(artifact.currentAudit.systems.find(system => system.id === 'western').currentVerdict, 'blocked_semantic_identity_insufficient')
  assert.equal(artifact.verificationContract.promotionBoundary.automaticReadinessPromotion, false)
  assert.equal(artifact.verificationContract.promotionBoundary.automaticProductionPromotion, false)
})

test('tri-system field kit is deterministic and keeps actual local byte inventory', async () => {
  const a = await buildFieldKit()
  const b = await buildFieldKit()
  assert.equal(canonicalJson(a), canonicalJson(b))
  assert.equal(a.evidenceInventory.alreadyHeld.length, 7)
  assert.equal(a.evidenceInventory.alreadyHeld.every(item => /^[a-f0-9]{64}$/.test(item.byteSha256)), true)
  assert.equal(a.scope.unrelatedUntrackedPreserved.includes('-.jpg'), true)
})

test('checker rejects missing mapping, missing criteria, and readiness promotion', async () => {
  const artifact = await buildFieldKit()
  const missingMapping = structuredClone(artifact)
  missingMapping.targets = missingMapping.targets.filter(target => target.id !== 'SAJU-P0-CALENDAR-ORACLE')
  const mappingErrors = await checkArtifact(missingMapping)
  assert.equal(mappingErrors.some(error => error.includes('target_count_or_unique_ids') || error.includes('unmapped_blocker')), true)

  const missingCriteria = structuredClone(artifact)
  missingCriteria.targets.find(target => target.id === 'ZIWEI-P0-TIANFU-CONVENTION').accept = []
  assert.equal((await checkArtifact(missingCriteria)).includes('target_accept_reject:ZIWEI-P0-TIANFU-CONVENTION'), true)

  const promoted = structuredClone(artifact)
  promoted.targets.find(target => target.id === 'WESTERN-P0-SEMANTIC-ADJUDICATION').expectedChange.production = 'ready'
  assert.equal((await checkArtifact(promoted)).includes('target_promotion_boundary:WESTERN-P0-SEMANTIC-ADJUDICATION'), true)
})
