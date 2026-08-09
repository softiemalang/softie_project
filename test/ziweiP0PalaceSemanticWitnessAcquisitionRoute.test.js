import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArtifact, canonicalJson, SCHEMA, VERDICT } from '../scripts/materialize-ziwei-p0-palace-semantic-witness-acquisition-route-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-semantic-witness-acquisition-route-v1.mjs'

test('Ziwei P0 acquisition route records actual NARA byte observations without semantic promotion', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.verdictToken, VERDICT)
  assert.equal(artifact.candidates.filter(candidate => candidate.classification === 'confirmed_acquirable').length, 2)
  assert.deepEqual(artifact.candidates.filter(candidate => candidate.classification === 'confirmed_acquirable').map(candidate => candidate.identity.itemId), ['4468520', '4469314'])
  assert.equal(artifact.acquisitionAudit.actualPublicBytesObtained, true)
  assert.equal(artifact.acquisitionAudit.semanticGateClosed, true)
  assert.equal(artifact.acquisitionAudit.independentSecondWitnessObtained, false)
  assert.equal(artifact.verificationContract.promotionBoundary.automaticProductionChange, false)
})

test('checker accepts canonical artifact and rejects semantic or rights overclaim', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(await checkArtifact(artifact), [])

  const overclaim = structuredClone(artifact)
  overclaim.acquisitionAudit.imageLevelReuseClosed = true
  assert.ok((await checkArtifact(overclaim)).includes('gate_or_rights_boundary'))

  const badHash = structuredClone(artifact)
  badHash.candidates.find(candidate => candidate.classification === 'confirmed_acquirable').fetchObservation.sampleImages[0].imageSha256 = 'not-a-real-sha256'
  assert.ok((await checkArtifact(badHash)).includes('nara_sample_shape:nara-volume-one-iiif:84'))
})

test('canonical JSON is stable and keeps the blocked semantic result explicit', async () => {
  const artifact = await buildArtifact()
  assert.equal(canonicalJson(artifact), canonicalJson(JSON.parse(canonicalJson(artifact))))
  assert.match(artifact.semanticFinding.result, /gate_remains_blocked/)
  assert.match(JSON.stringify(artifact.relationshipAudit), /independent/i)
})
