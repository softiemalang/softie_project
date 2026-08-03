import test from 'node:test'
import assert from 'node:assert/strict'
import { checkSajuClaimProvenanceArtifact, canonicalJson, materializeSajuClaimProvenance } from '../src/interpretationPrep/sajuClaimProvenance.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import artifact from '../artifacts/saju-claim-provenance-v0.json' with { type: 'json' }

test('saju claim provenance artifact passes deterministic contract checks', () => {
  assert.deepEqual(checkSajuClaimProvenanceArtifact(artifact), [])
  assert.equal(artifact.claimCount, 43)
  assert.equal(artifact.claimCount, artifact.claims.length)
  assert.equal(artifact.inventoryScope.validFixtureCount, 12)
  assert.equal(artifact.inventoryScope.observedStableClaimIdCount, 43)
  assert.equal(artifact.claims.find((claim) => claim.claimId === 'saju.natal.day-master').occurrenceCount, 11)
  assert.equal(artifact.externalEvidenceSummary.observedScopedMatches, 7)
  assert.equal(artifact.claims.every((claim) => claim.verificationStatus === 'unverified'), true)
})

test('multi-fixture materialization is byte-stable and preserves occurrence inventory', () => {
  const results = sajuValidationFixtures
    .filter((fixture) => !fixture.expectedError)
    .map((fixture) => ({ contextId: fixture.id, result: prepareInterpretationData(fixture.input) }))
  const options = { results, internalFixtures: sajuValidationFixtures, externalFixtures: SAJU_EXTERNAL_FIXTURES }
  const first = materializeSajuClaimProvenance(options)
  const second = materializeSajuClaimProvenance(options)
  assert.equal(canonicalJson(first), canonicalJson(second))
  assert.equal(first.contentSha256, second.contentSha256)
  assert.equal(first.artifactByteSha256, second.artifactByteSha256)
  assert.equal(first.claims.reduce((sum, claim) => sum + claim.occurrenceCount, 0), 126)
})

test('negative provenance fixtures reject identity, scope, connectivity, gaps, omissions and unsafe fields', () => {
  const mutate = (changes) => ({ ...artifact, claims: artifact.claims.map((claim, index) => index === 0 ? { ...claim, ...changes } : claim) })
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ traditionalSourceRefs: [] })).join('\n'), /unresolved source gap/)
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ calculationRefs: [] })).join('\n'), /disconnected/)
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ verificationStatus: 'verified' })).join('\n'), /promoted/)
  const externallyScopedClaim = artifact.claims.find((claim) => claim.externalEvidenceRefs.length > 0)
  assert.ok(externallyScopedClaim)
  assert.match(checkSajuClaimProvenanceArtifact({
    ...artifact,
    claims: artifact.claims.map((claim) => claim.claimId === externallyScopedClaim.claimId
      ? { ...claim, verificationStatus: 'verified' }
      : claim),
  }).join('\n'), /scoped external match expanded/)
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ claimText: 'rank this claim' })).join('\n'), /interpretation\/advice\/ranking/)
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ calculationRefs: [{ refId: 'source.does-not-exist' }] })).join('\n'), /dangling source identity/)
  assert.match(checkSajuClaimProvenanceArtifact(mutate({ fixtureRefs: [{ refId: 'fixture.internal.val-solar-normal', kind: 'scoped_external_reference_match' }] })).join('\n'), /mislabeled as external/)
  assert.match(checkSajuClaimProvenanceArtifact({ ...artifact, claims: [...artifact.claims].reverse() }).join('\n'), /ordering/)
  assert.match(checkSajuClaimProvenanceArtifact({ ...artifact, claims: [artifact.claims[0], artifact.claims[0]] }).join('\n'), /duplication/)
})
