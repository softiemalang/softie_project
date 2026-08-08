#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactPath = resolve(process.env.DE405_TRUE_NODE_OUTPUT || join(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))
const expectedJplPath = resolve(process.env.DE405_TRUE_NODE_JPL_BINARY || join(root, 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405'))
const expectedCspiceRunnerPath = resolve(process.env.DE405_TRUE_NODE_CSPICE_RUNNER || join(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner'))
const expectedCspiceSpkPath = resolve(process.env.DE405_TRUE_NODE_CSPICE_SPK || join(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp'))

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(path) {
  return sha256(readFileSync(path))
}

function fail(message) {
  throw new Error(message)
}

if (!existsSync(artifactPath)) fail(`artifact missing: ${artifactPath}`)
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const { payloadCanonicalSha256, ...payload } = artifact
if (artifact.schemaVersion !== 'astrology-true-node-independent-frontier-v0') fail('schemaVersion mismatch')
if (payloadCanonicalSha256 !== sha256(Buffer.from(`${JSON.stringify(payload)}\n`))) fail('payload canonical hash mismatch')
if (artifact.availability !== 'available') fail('artifact unavailable')
if (artifact.candidate.status !== 'experimental_not_production') fail('candidate was promoted')
if (artifact.independenceAssessment.qualification !== 'blocked_semantic_identity_insufficient') fail('qualification boundary changed')
if (artifact.readinessImpact.independentTrueNodeReference !== 'pending') fail('readiness boundary changed')
if (artifact.readinessImpact.productionProviderChanged || artifact.readinessImpact.activationChanged || artifact.readinessImpact.toleranceChanged) fail('forbidden production/tolerance mutation recorded')
if (!existsSync(expectedJplPath)) fail(`JPL source missing: ${expectedJplPath}`)
if (sha256File(expectedJplPath) !== artifact.sourceIdentity.jplData.sha256) fail('JPL source hash drift')
if (!existsSync(expectedCspiceRunnerPath) || sha256File(expectedCspiceRunnerPath) !== artifact.sourceIdentity.cspiceCrossReference.runnerSha256) fail('CSPICE runner hash drift')
if (!existsSync(expectedCspiceSpkPath) || sha256File(expectedCspiceSpkPath) !== artifact.sourceIdentity.cspiceCrossReference.spkSha256) fail('CSPICE SPK hash drift')
for (const file of artifact.sourceIdentity.swissReference.files) {
  const path = resolve(root, file.path)
  if (!existsSync(path) || sha256File(path) !== file.sha256) fail(`Swiss artifact hash drift: ${file.path}`)
}
const rows = artifact.comparison.rows
if (!Array.isArray(rows) || rows.length !== artifact.corpus.timestampCount) fail('comparison row count mismatch')
if (artifact.comparison.summary.rowCount !== rows.length) fail('comparison summary count mismatch')
for (const [index, row] of rows.entries()) {
  if (row.index !== index || row.sampleId !== `true-node-${String(index).padStart(5, '0')}`) fail(`row ordering mismatch at ${index}`)
  if (row.swissEffectiveFlags !== 258) fail(`Swiss fallback detected at ${row.sampleId}`)
  if (Math.abs(row.cyclicDifferenceDegrees) > 180) fail(`cyclic difference outside range at ${row.sampleId}`)
  if (row.absoluteDifferenceArcseconds !== Math.abs(row.cyclicDifferenceDegrees) * 3600) fail(`difference materialization mismatch at ${row.sampleId}`)
}
if (!artifact.comparison.summary.firstNonIdentical) fail('unexpected exact equality across corpus')
if (!artifact.comparison.diagnostics?.swissArgumentShift) fail('time-scale diagnostic missing')
const timeScaleDiagnostic = artifact.comparison.diagnostics.swissArgumentShift
if (timeScaleDiagnostic.status !== 'diagnostic_only' || timeScaleDiagnostic.rowCount !== rows.length || timeScaleDiagnostic.effectiveFlags !== 258) fail('time-scale diagnostic contract mismatch')
if (timeScaleDiagnostic.method !== 'same_swe_calc_ut_binding_with_jdTt_argument_probe') fail('time-scale diagnostic method changed')
if (timeScaleDiagnostic.classification !== 'argument_shift_is_smaller_than_observed_candidate_residual') fail('time-scale diagnostic classification changed')
if (!Number.isFinite(timeScaleDiagnostic.swissReferenceArgumentShiftArcseconds?.max?.value) || !Number.isFinite(timeScaleDiagnostic.candidateVsShiftedReferenceArcseconds?.max?.value)) fail('time-scale diagnostic summary invalid')
if (timeScaleDiagnostic.swissReferenceArgumentShiftArcseconds.max.value >= artifact.comparison.summary.maxAbsoluteDifferenceArcseconds) fail('time-scale diagnostic does not bound the observed residual')
if (!artifact.firstDivergenceClassification?.worstSwissDifference || artifact.firstDivergenceClassification.worstSwissDifference.sampleId !== artifact.comparison.summary.maxDifferenceSampleId) fail('worst divergence record missing or inconsistent')
if (artifact.firstDivergenceClassification.conventionBoundary?.classification !== 'frame_and_node_definition_equivalence_unresolved') fail('convention boundary changed')
if (!artifact.productionRelation || artifact.productionRelation.trueNodeInProductionEphemeris || artifact.productionRelation.trueNodeRuleStatus !== 'unsupported' || artifact.productionRelation.productionResultCompared) fail('production relation boundary changed')
if (artifact.corpus.boundaryRows?.length !== 4) fail('boundary probe count mismatch')
if (artifact.corpus.boundaryRows.some((row) => !row.sampleId.startsWith('boundary-service-'))) fail('boundary probe identity mismatch')
if (artifact.cspiceOverlap?.status !== 'available' || artifact.cspiceOverlap.rowCount !== 3653) fail('CSPICE overlap evidence incomplete')
if (!Number.isFinite(artifact.cspiceOverlap.candidateDifferenceMax?.candidateCyclicDifferenceArcseconds)) fail('CSPICE candidate comparison summary invalid')
const candidateIds = new Set((artifact.oracleCandidateInventory || []).map((candidate) => candidate.id))
for (const requiredId of ['jpl-de405-osculating-state-derived', 'cspice-de405-overlap', 'swiss-se-true-node', 'astrolog-matrix-true-node']) if (!candidateIds.has(requiredId)) fail(`candidate inventory missing: ${requiredId}`)
console.log(JSON.stringify({ artifactPath, status: 'pass', rowCount: rows.length, qualification: artifact.independenceAssessment.qualification, maxAbsoluteDifferenceArcseconds: artifact.comparison.summary.maxAbsoluteDifferenceArcseconds }, null, 2))
