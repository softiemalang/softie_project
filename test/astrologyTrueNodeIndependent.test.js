import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { angularDifferenceDegrees, deriveOsculatingLunarNodeLongitude } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

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
