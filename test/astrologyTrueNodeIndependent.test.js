import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { angularDifferenceDegrees, deriveOsculatingLunarNodeLongitude } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'
import { checkFrontierArtifact } from '../scripts/check-astrology-true-node-independent-frontier-v4.mjs'

const j2000MoonState = [
  -291608.38845719636, -266716.82923742401, -76102.481323201602,
  0.64353137360795276, -0.66608769556622882, -0.30132570660791735,
]

test('experimental candidate derives a deterministic normalized ascending node', () => {
  const input = { stateJ2000KmKmPerSec: j2000MoonState, jdTt: 2451545.0 }
  const first = deriveOsculatingLunarNodeLongitude(input)
  const second = deriveOsculatingLunarNodeLongitude(input)
  assert.deepEqual(first, second)
  assert.equal(first.availability, 'available')
  assert.equal(first.candidateStatus, 'experimental_not_production')
  assert.equal(first.nodeType, 'osculating_lunar_ascending_node')
  assert.ok(first.longitudeDegrees >= 0 && first.longitudeDegrees < 360)
  assert.ok(Math.abs(first.longitudeDegrees - 123.95790070524538) < 1e-12)
  assert.equal(first.velocitySemantics, 'inertial_velocity_expressed_in_date_axes')
})

test('candidate fails closed on malformed state and degenerate epochs', () => {
  assert.equal(deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: [1, 2, 3], jdTt: 2451545 }).reason, 'state_invalid')
  assert.equal(deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: j2000MoonState, jdTt: null }).reason, 'epoch_invalid')
})

test('cyclic longitude differences preserve wrap-around semantics', () => {
  assert.ok(Math.abs(angularDifferenceDegrees(359.9, 0.1) + 0.2) < 1e-12)
  assert.ok(Math.abs(angularDifferenceDegrees(0.1, 359.9) - 0.2) < 1e-12)
  assert.equal(angularDifferenceDegrees(181, 0), -179)
})

test('comparison artifact preserves worst divergence and diagnostic boundaries', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-independent-v0/complete.json', 'utf8'))
  const diagnostic = artifact.comparison.diagnostics.swissArgumentShift
  assert.equal(diagnostic.status, 'diagnostic_only')
  assert.equal(diagnostic.rowCount, 7342)
  assert.equal(diagnostic.effectiveFlags, 258)
  assert.equal(diagnostic.classification, 'argument_shift_is_smaller_than_observed_candidate_residual')
  assert.equal(artifact.firstDivergenceClassification.worstSwissDifference.sampleId, artifact.comparison.summary.maxDifferenceSampleId)
  assert.ok(diagnostic.swissReferenceArgumentShiftArcseconds.max.value < artifact.comparison.summary.maxAbsoluteDifferenceArcseconds)
  assert.equal(artifact.firstDivergenceClassification.conventionBoundary.classification, 'frame_and_node_definition_equivalence_unresolved')
})

test('Horizons and ERFA frontier artifact preserves oracle independence boundaries', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-horizons-erfa-v1/complete.json', 'utf8'))
  assert.equal(artifact.schemaVersion, 'astrology-true-node-horizons-erfa-frontier-v1')
  assert.equal(artifact.purpose, 'research_only')
  assert.equal(artifact.sourceIdentity.horizons.sourceFamily, 'DE441')
  assert.equal(artifact.sourceIdentity.horizons.transport.tlsVerification, 'disabled_explicitly_for_local_certificate_chain')
  assert.equal(artifact.oracleAssessment.horizons.independence, 'same_family_corroboration')
  assert.equal(artifact.oracleAssessment.erfaMoon98.independence, 'independent_analytic_negative_control')
  assert.equal(artifact.readinessBoundary.independentTrueNodeReference, 'pending')
  assert.equal(artifact.readinessBoundary.activationChanged, false)
  assert.equal(artifact.comparison.summaries.horizonsElementVectorConsistency.maxAbsoluteDifferenceArcseconds, 4.092726157978177e-10)
  assert.equal(artifact.comparison.summaries.horizonsDateVsSwiss.maxAbsoluteDifferenceArcseconds, 1.0702176164159027)
  assert.equal(artifact.comparison.summaries.erfaMoon98VsSwiss.maxAbsoluteDifferenceArcseconds, 28.92438340040826)
})

test('expanded Horizons corpus preserves raw provenance and semantic blocking', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-horizons-erfa-v2/complete.json', 'utf8'))
  assert.equal(artifact.schemaVersion, 'astrology-true-node-horizons-erfa-frontier-v2')
  assert.equal(artifact.corpus.rowCount, 134)
  assert.deepEqual(artifact.corpus.historicalSampleIndices, [0, 440, 1354, 2367, 3670, 5000, 6000, 7341])
  assert.equal(artifact.sourceIdentity.horizons.rawFiles.filter((file) => file.kind === 'VECTORS').length, 3)
  assert.equal(artifact.sourceIdentity.horizons.rawFiles.filter((file) => file.kind === 'ELEMENTS').length, 3)
  assert.equal(artifact.oracleAssessment.horizons.independence, 'same_family_corroboration')
  assert.equal(artifact.comparison.summaries.horizonsDateVsSwiss.maxAbsoluteDifferenceArcseconds, 1.6422761457306478)
  assert.equal(artifact.comparison.summaries.horizonsDateVsLocalDe405.maxAbsoluteDifferenceArcseconds, 0.11627137882896932)
  assert.equal(artifact.readinessBoundary.independentTrueNodeReference, 'pending')
})

test('light-time diagnostic remains local convention evidence', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json', 'utf8'))
  assert.equal(artifact.schemaVersion, 'astrology-true-node-light-time-diagnostic-v1')
  assert.equal(artifact.comparison.numericStatus, 'diagnostic_only_no_tolerance_pass')
  assert.equal(artifact.sourceIdentity.swissReference.defaultFlags, 322)
  assert.equal(artifact.sourceIdentity.swissReference.truePositionFlags, 338)
  assert.equal(artifact.comparison.lightTimeEffectSummary.maxAbsoluteDifferenceArcseconds, 0.014527895200444618)
  assert.equal(artifact.comparison.truePositionFlagsSummary.maxAbsoluteDifferenceArcseconds, 1.6396008296851505)
  assert.equal(artifact.readinessBoundary.independentTrueNodeReference, 'pending')
})

test('v4 frontier ledger verifies contract decomposition, exhausted candidates, and preserved inputs', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-independent-frontier-v4/complete.json', 'utf8'))
  assert.deepEqual(checkFrontierArtifact(artifact).errors, [])
  assert.equal(artifact.productionContractAudit.status, 'not_defined_for_true_node')
  assert.equal(artifact.readinessBoundary.authorityFrontier, 'exhausted_under_current_permissions')
  assert.equal(artifact.readinessBoundary.independentTrueNodeReference, 'pending')
  assert.equal(artifact.scope.activationChanged, false)
})

test('v4 frontier checker rejects a promoted verdict or mutated input identity', () => {
  const artifact = JSON.parse(readFileSync('artifacts/astrology-true-node-independent-frontier-v4/complete.json', 'utf8'))
  const verdictMutation = structuredClone(artifact)
  verdictMutation.verdictToken = 'production_true_node_ready'
  assert.equal(checkFrontierArtifact(verdictMutation).pass, false)

  const hashMutation = structuredClone(artifact)
  hashMutation.provenance.sourceFiles[0].sha256 = '0'.repeat(64)
  assert.equal(checkFrontierArtifact(hashMutation).pass, false)
})
