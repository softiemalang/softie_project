#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactPath = resolve(process.env.DE405_TRUE_NODE_FRAME_OUTPUT || join(root, 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json'))
const inputPath = resolve(process.env.DE405_TRUE_NODE_FRAME_INPUT || join(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(path) {
  return sha256(readFileSync(path))
}

function canonicalSha256(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`))
}

function fail(message) {
  throw new Error(message)
}

if (!existsSync(artifactPath)) fail(`artifact missing: ${artifactPath}`)
if (!existsSync(inputPath)) fail(`input artifact missing: ${inputPath}`)
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const inputArtifact = JSON.parse(readFileSync(inputPath, 'utf8'))
if (artifact.schemaVersion !== 'astrology-true-node-frame-diagnostic-v1') fail('schemaVersion mismatch')
if (artifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) fail('payload canonical hash mismatch')
if (artifact.availability !== 'available' || artifact.purpose !== 'diagnostic_only') fail('diagnostic artifact boundary changed')
if (artifact.inputArtifact.schemaVersion !== 'astrology-true-node-independent-frontier-v0') fail('input schema boundary changed')
if (sha256File(inputPath) !== artifact.inputArtifact.sha256) fail('input artifact hash drift')
if (inputArtifact.payloadCanonicalSha256 !== artifact.inputArtifact.payloadCanonicalSha256) fail('input artifact canonical identity drift')
if (artifact.sourceIdentity.swissReference.requestedFlags !== 322 || artifact.sourceIdentity.swissReference.effectiveFlags !== 322) fail('Swiss mean-equinox flags changed')
if (artifact.convention.diagnosticReferenceFlags !== 322 || artifact.convention.diagnosticReferenceFrame !== 'Swiss SE_TRUE_NODE with SEFLG_NONUT: mean equinox of date and no nutation') fail('convention diagnostic contract changed')
if (artifact.comparison.numericStatus !== 'diagnostic_only_no_tolerance_pass') fail('numeric status promoted')
if (artifact.readinessBoundary.independentTrueNodeReference !== 'pending' || artifact.readinessBoundary.qualification !== 'blocked_semantic_identity_insufficient') fail('readiness boundary changed')
if (artifact.readinessBoundary.productionProviderChanged || artifact.readinessBoundary.activationChanged || artifact.readinessBoundary.toleranceChanged) fail('forbidden production/tolerance mutation recorded')
if (artifact.evidenceBoundary.unresolved === '') fail('unresolved boundary missing')

for (const file of artifact.sourceIdentity.swissReference.files) {
  const path = resolve(root, file.path)
  if (!existsSync(path) || sha256File(path) !== file.sha256) fail(`Swiss artifact hash drift: ${file.path}`)
}

const rows = artifact.comparison.rows
const inputRows = inputArtifact.comparison.rows
if (!Array.isArray(rows) || rows.length !== inputRows.length || rows.length !== inputArtifact.corpus.timestampCount) fail('comparison row count mismatch')
for (const [index, row] of rows.entries()) {
  const inputRow = inputRows[index]
  if (row.index !== index || row.sampleId !== inputRow.sampleId) fail(`row ordering mismatch at ${index}`)
  if (row.jdUt !== inputRow.jdUt || row.candidateLongitudeDegrees !== inputRow.candidateLongitudeDegrees) fail(`inherited candidate mismatch at ${row.sampleId}`)
  if (row.swissEffectiveFlags !== 322) fail(`Swiss fallback detected at ${row.sampleId}`)
  if (Math.abs(row.cyclicDifferenceDegrees) > 180) fail(`cyclic difference outside range at ${row.sampleId}`)
  if (row.absoluteDifferenceArcseconds !== Math.abs(row.cyclicDifferenceDegrees) * 3600) fail(`difference materialization mismatch at ${row.sampleId}`)
}

const summary = artifact.comparison.meanEquinoxSummary
const absoluteArcseconds = rows.map((row) => row.absoluteDifferenceArcseconds).sort((left, right) => left - right)
const percentile = (fraction) => absoluteArcseconds[Math.min(absoluteArcseconds.length - 1, Math.floor((absoluteArcseconds.length - 1) * fraction))]
const max = rows.reduce((best, row) => row.absoluteDifferenceArcseconds > best.absoluteDifferenceArcseconds ? row : best, rows[0])
if (summary.rowCount !== rows.length || summary.maxAbsoluteDifferenceArcseconds !== max.absoluteDifferenceArcseconds || summary.maxDifferenceSampleId !== max.sampleId) fail('summary maximum mismatch')
if (summary.p50AbsoluteDifferenceArcseconds !== percentile(0.5) || summary.p95AbsoluteDifferenceArcseconds !== percentile(0.95) || summary.p99AbsoluteDifferenceArcseconds !== percentile(0.99) || summary.minAbsoluteDifferenceArcseconds !== absoluteArcseconds[0]) fail('summary percentile mismatch')
if (summary.tolerancePolicy !== 'diagnostic_only_no_acceptance_tolerance') fail('tolerance policy changed')
if (artifact.inference.classification !== 'residual_collapses_when_reference_uses_mean_equinox_no_nutation') fail('inference classification changed')
if (artifact.inference.observedDefaultMaxArcseconds !== inputArtifact.comparison.summary.maxAbsoluteDifferenceArcseconds || artifact.inference.observedMeanEquinoxMaxArcseconds !== summary.maxAbsoluteDifferenceArcseconds) fail('inference summary mismatch')
if (!(artifact.inference.observedMeanEquinoxMaxArcseconds < artifact.inference.observedDefaultMaxArcseconds)) fail('diagnostic did not reduce the inherited frame residual')
if (artifact.sourceIdentity.publicDocumentation.length !== 3) fail('public documentation inventory changed')
console.log(JSON.stringify({ artifactPath, status: 'pass', rowCount: rows.length, flags: 322, qualification: artifact.readinessBoundary.qualification, maxAbsoluteDifferenceArcseconds: summary.maxAbsoluteDifferenceArcseconds }, null, 2))
