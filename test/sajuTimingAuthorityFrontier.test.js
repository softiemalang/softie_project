import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  buildArtifact,
  ARTIFACT_PATH,
} from '../scripts/materialize-saju-timing-authority-frontier-v0.mjs'
import {
  SAJU_TIMING_AUTHORITY_FRONTIER_SCHEMA,
  SAJU_TIMING_AUTHORITY_FRONTIER_VERSION,
  SAJU_TIMING_RAW_TEXT_CONSUMPTION,
  checkSajuTimingAuthorityFrontier,
} from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'

const root = resolve(new URL('../', import.meta.url).pathname)
const artifact = JSON.parse(fs.readFileSync(resolve(root, ARTIFACT_PATH), 'utf8'))

test('Saju timing authority frontier keeps the four source-first boundaries blocked', () => {
  assert.deepEqual(checkSajuTimingAuthorityFrontier(artifact), [])
  assert.equal(artifact.schemaVersion, SAJU_TIMING_AUTHORITY_FRONTIER_SCHEMA)
  assert.equal(artifact.frontierVersion, SAJU_TIMING_AUTHORITY_FRONTIER_VERSION)
  assert.equal(artifact.frontiers.length, 4)
  assert.equal(artifact.sources.length, 13)
  assert.equal(artifact.observations.length, 20)
  assert.equal(artifact.claims.length, 15)
  assert.equal(artifact.relations.length, 25)
  assert.equal(artifact.blockers.length, 8)
  assert.deepEqual(artifact.inventory.observationIds, artifact.observations.map(observation => observation.observationId).sort())
  assert.deepEqual(artifact.inventory.claimIds, artifact.claims.map(claim => claim.claimId).sort())
  assert.deepEqual(artifact.authoritySummary.closedAuthorityClaimIds, [])
  assert.equal(artifact.authoritySummary.lineageSpecificClaimIds.length, 6)
  assert.equal(artifact.authoritySummary.modernPolicyClaimIds.length, 5)
  assert.equal(artifact.authoritySummary.conflictingAuthorityClaimIds.length, 1)
  assert.equal(artifact.authoritySummary.insufficientEvidenceClaimIds.length, 3)
  assert.ok(artifact.observations.every(observation => observation.rawText.isVerifiedFact === false && observation.rawText.consumption === SAJU_TIMING_RAW_TEXT_CONSUMPTION))
  assert.ok(artifact.claims.every(claim => claim.independence?.status && claim.independence?.basis && claim.confidence?.level && claim.confidence?.basis && claim.authorityStatus && claim.authorityStatus !== 'authority_supported' && claim.evidence?.length === claim.sourceObservationIds.length))
  assert.ok(artifact.blockers.every(blocker => blocker.status === 'open' && blocker.blocking === true))
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.frontierConclusion.activationAllowed, false)
  const nlcConversion = artifact.observations.find(observation => observation.observationId === 'obs.nlc.yuanhai.qilu-conversion-1926')
  assert.deepEqual(nlcConversion.locator, {
    kind: 'attached_pdf_scan',
    value: 'NLC416-13jh002326-46442 PDF pages 79–80 / printed folios 三三–三四',
    sourceByteSha256: '96bc14ccb8fd6f90fb5ec33784846a9067f2cad45ab9730f12bdf9846ea7c265',
    sourceByteLength: 2690379,
  })
  assert.match(nlcConversion.rawText.text, /三日為年/)
  assert.match(nlcConversion.scopeBoundary, /no exact first-start age\/date\/rounding\/clamping/)
  assert.deepEqual(artifact.claims.find(claim => claim.claimId === 'claim.dayun-first-start-date').sourceObservationIds.includes('obs.nlc.yuanhai.qilu-conversion-1926'), false)
})

test('Saju timing authority frontier materialization is byte-stable and rejects promotion', () => {
  const first = buildArtifact()
  const second = buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))

  const promoted = structuredClone(artifact)
  promoted.readiness.availableForInterpretation = true
  assert.ok(checkSajuTimingAuthorityFrontier(promoted).includes('content hash mismatch'))
  assert.ok(checkSajuTimingAuthorityFrontier(promoted).includes('readiness or activation promoted'))
})

test('Saju timing authority frontier rejects claim evidence and confidence mutations', () => {
  const missingConfidence = structuredClone(artifact)
  delete missingConfidence.claims[0].confidence
  assert.ok(checkSajuTimingAuthorityFrontier(missingConfidence).includes(`claim confidence:${artifact.claims[0].claimId}`))

  const mutatedEvidence = structuredClone(artifact)
  mutatedEvidence.claims[0].evidence[0].rawEvidence.text = 'unadmitted replacement text'
  assert.ok(checkSajuTimingAuthorityFrontier(mutatedEvidence).includes(`claim evidence:${artifact.claims[0].claimId}`))

  const promotedAuthority = structuredClone(artifact)
  promotedAuthority.claims[0].authorityStatus = 'authority_supported'
  assert.ok(checkSajuTimingAuthorityFrontier(promotedAuthority).includes(`authority promotion:${artifact.claims[0].claimId}`))
})

test('negative checks reject promoting the NLC clause into an exact first-start procedure', () => {
  const promotedScope = structuredClone(artifact)
  promotedScope.observations.find(observation => observation.observationId === 'obs.nlc.yuanhai.qilu-conversion-1926').scopeBoundary = 'exact first-start procedure'
  assert.ok(checkSajuTimingAuthorityFrontier(promotedScope).includes('nlc_yuanhai_conversion_scope_promoted'))

  const promotedClaim = structuredClone(artifact)
  const firstStartClaim = promotedClaim.claims.find(claim => claim.claimId === 'claim.dayun-first-start-date')
  firstStartClaim.sourceObservationIds.push('obs.nlc.yuanhai.qilu-conversion-1926')
  assert.ok(checkSajuTimingAuthorityFrontier(promotedClaim).includes('nlc_yuanhai_conversion_promoted_to_exact_first_start'))
})
