import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArtifact, canonicalJson, SCHEMA, VERDICT } from '../scripts/materialize-tri-system-p0-acquisition-priority-and-dossier-v1.mjs'
import { checkArtifact } from '../scripts/check-tri-system-p0-acquisition-priority-and-dossier-v1.mjs'

test('P0 priority artifact reconstructs all eight targets and selects a single dossier target', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.verdictToken, VERDICT)
  assert.equal(artifact.rankedP0Targets.length, 8)
  assert.deepEqual(
    artifact.rankedP0Targets.map(target => target.id).sort(),
    [
      'SAJU-P0-CALENDAR-ORACLE',
      'SAJU-P0-IDENTITY-WITNESS',
      'ZIWEI-P0-CALENDAR-TIME-ORACLE',
      'ZIWEI-P0-CLAIM-SOURCE-IDENTITY',
      'ZIWEI-P0-PALACE-SEMANTIC-WITNESS',
      'ZIWEI-P0-TIANFU-CONVENTION',
      'WESTERN-P0-INDEPENDENT-DIRECT-ORACLE',
      'WESTERN-P0-SEMANTIC-ADJUDICATION',
    ].sort(),
  )
  assert.equal(artifact.priorityDecision.rank1, 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS')
  assert.deepEqual(artifact.priorityDecision.runnerUps, ['SAJU-P0-CALENDAR-ORACLE', 'ZIWEI-P0-CLAIM-SOURCE-IDENTITY'])
  assert.equal(artifact.selectedDossier.targetId, artifact.priorityDecision.rank1)
  assert.equal(artifact.verificationContract.promotionBoundary.automaticReadinessPromotion, false)
  assert.equal(artifact.verificationContract.promotionBoundary.automaticClaimPromotion, false)
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('checker rejects incomplete P0 comparison, missing candidate classification, and missing dossier criteria', async () => {
  const artifact = await buildArtifact()

  const missingTarget = structuredClone(artifact)
  missingTarget.rankedP0Targets = missingTarget.rankedP0Targets.slice(1)
  const targetErrors = await checkArtifact(missingTarget)
  assert.equal(targetErrors.includes('p0_count_or_unique_ids'), true)

  const missingStrongCandidate = structuredClone(artifact)
  missingStrongCandidate.researchCandidates = missingStrongCandidate.researchCandidates.filter(item => item.status !== 'strong_candidate')
  const candidateErrors = await checkArtifact(missingStrongCandidate)
  assert.equal(candidateErrors.includes('strong_candidate_missing'), true)

  const missingCriteria = structuredClone(artifact)
  missingCriteria.selectedDossier.acceptCriteria = []
  const criteriaErrors = await checkArtifact(missingCriteria)
  assert.equal(criteriaErrors.includes('dossier_empty:acceptCriteria'), true)

  const promoted = structuredClone(artifact)
  promoted.scope.readinessPromotion = true
  const promotionErrors = await checkArtifact(promoted)
  assert.equal(promotionErrors.includes('mutation_or_promotion:readinessPromotion'), true)
})

test('priority materialization is deterministic and keeps the held PDF as comparison-only', async () => {
  const a = await buildArtifact()
  const b = await buildArtifact()
  assert.equal(canonicalJson(a), canonicalJson(b))
  assert.equal(a.heldMaterialCheck.role.includes('not an independent official witness'), true)
  assert.match(a.heldMaterialCheck.actualBytes.byteSha256, /^[a-f0-9]{64}$/)
  assert.equal(a.deterministic.networkFetch, false)
  assert.equal(a.scope.unrelatedUntrackedPreserved.includes('-.jpg'), true)
})
