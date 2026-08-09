#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { angularDifferenceDegrees } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactPath = resolve(process.env.DE405_TRUE_NODE_LIGHT_TIME_OUTPUT || resolve(root, 'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json'))
const inputPath = resolve(process.env.DE405_TRUE_NODE_LIGHT_TIME_INPUT || resolve(root, 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json'))

function fail(message) {
  throw new Error(message)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(path) {
  return sha256(readFileSync(path))
}

function canonicalSha256(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`))
}

function absoluteArcseconds(left, right) {
  return Math.abs(angularDifferenceDegrees(left, right)) * 3600
}

function summarize(rows, field) {
  const values = rows.map((row) => row[field]).sort((left, right) => left - right)
  const percentile = (fraction) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * fraction))]
  const maximum = rows.reduce((best, row) => row[field] > best[field] ? row : best, rows[0])
  return {
    rowCount: rows.length,
    maxAbsoluteDifferenceArcseconds: maximum[field],
    maxDifferenceSampleId: maximum.sampleId,
    p50AbsoluteDifferenceArcseconds: percentile(0.5),
    p95AbsoluteDifferenceArcseconds: percentile(0.95),
    p99AbsoluteDifferenceArcseconds: percentile(0.99),
    minAbsoluteDifferenceArcseconds: values[0],
    tolerancePolicy: 'diagnostic_only_no_acceptance_tolerance',
  }
}

if (!existsSync(artifactPath) || !existsSync(inputPath)) fail('light-time artifact or input missing')
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const input = JSON.parse(readFileSync(inputPath, 'utf8'))
if (artifact.schemaVersion !== 'astrology-true-node-light-time-diagnostic-v1') fail('schemaVersion mismatch')
if (artifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) fail('payload canonical hash mismatch')
if (artifact.availability !== 'available' || artifact.purpose !== 'diagnostic_only') fail('diagnostic boundary changed')
if (artifact.comparison.numericStatus !== 'diagnostic_only_no_tolerance_pass') fail('numeric result promoted')
if (artifact.readinessBoundary.independentTrueNodeReference !== 'pending' || artifact.readinessBoundary.qualification !== 'blocked_semantic_identity_insufficient') fail('readiness boundary changed')
if (artifact.readinessBoundary.productionProviderChanged || artifact.readinessBoundary.activationChanged || artifact.readinessBoundary.toleranceChanged) fail('forbidden mutation recorded')
if (artifact.inputArtifact.schemaVersion !== input.schemaVersion || artifact.inputArtifact.sha256 !== sha256File(inputPath) || artifact.inputArtifact.payloadCanonicalSha256 !== input.payloadCanonicalSha256) fail('input identity drift')
if (artifact.sourceIdentity.swissReference.defaultFlags !== 322 || artifact.sourceIdentity.swissReference.truePositionFlags !== 338) fail('Swiss flag contract changed')
if (artifact.inference.classification !== 'light_time_effect_bounded_within_same_engine') fail('light-time classification changed')

for (const file of artifact.sourceIdentity.swissReference.files) {
  const path = resolve(root, file.path)
  if (!existsSync(path) || !lstatSync(path).isFile() || file.sizeBytes !== readFileSync(path).byteLength || file.sha256 !== sha256File(path)) fail(`Swiss artifact hash drift: ${file.path}`)
}

const inputRows = input.comparison.rows
const rows = artifact.comparison.rows
if (!Array.isArray(rows) || rows.length !== inputRows.length) fail('row count mismatch')
for (const [index, row] of rows.entries()) {
  const inputRow = inputRows[index]
  if (row.index !== inputRow.index || row.sampleId !== inputRow.sampleId || row.jdUt !== inputRow.jdUt) fail(`row identity mismatch at ${index}`)
  if (row.swissDefaultEffectiveFlags !== 322 || (row.swissTruePositionEffectiveFlags & 338) !== 338 || (row.swissTruePositionEffectiveFlags & 2) !== 2) fail(`Swiss fallback or flag mismatch at ${row.sampleId}`)
  const expectedEffect = absoluteArcseconds(row.swissDefaultTrueNodeLongitudeDegrees, row.swissTruePositionTrueNodeLongitudeDegrees)
  const expectedDefault = absoluteArcseconds(row.horizonsDateMeanEclipticCandidateLongitudeDegrees, row.swissDefaultTrueNodeLongitudeDegrees)
  const expectedTruePosition = absoluteArcseconds(row.horizonsDateMeanEclipticCandidateLongitudeDegrees, row.swissTruePositionTrueNodeLongitudeDegrees)
  if (row.lightTimeEffectArcseconds !== expectedEffect || row.horizonsDateVsSwissDefaultAbsoluteDifferenceArcseconds !== expectedDefault || row.horizonsDateVsSwissTruePositionAbsoluteDifferenceArcseconds !== expectedTruePosition) fail(`derived comparison mismatch at ${row.sampleId}`)
}

const summaries = {
  defaultFlagsSummary: summarize(rows, 'horizonsDateVsSwissDefaultAbsoluteDifferenceArcseconds'),
  truePositionFlagsSummary: summarize(rows, 'horizonsDateVsSwissTruePositionAbsoluteDifferenceArcseconds'),
  lightTimeEffectSummary: summarize(rows, 'lightTimeEffectArcseconds'),
}
for (const [name, expected] of Object.entries(summaries)) if (JSON.stringify(artifact.comparison[name]) !== JSON.stringify(expected)) fail(`summary mismatch: ${name}`)
if (artifact.inference.maxLightTimeEffectArcseconds !== summaries.lightTimeEffectSummary.maxAbsoluteDifferenceArcseconds) fail('inference maximum mismatch')
console.log(JSON.stringify({ artifactPath, status: 'pass', rowCount: rows.length, summaries, qualification: artifact.readinessBoundary.qualification }, null, 2))
