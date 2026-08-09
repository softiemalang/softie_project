#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeDegrees360 } from '../src/astrology/astrologyAngles.js'
import { deriveOsculatingLunarNodeLongitude, angularDifferenceDegrees } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactPath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_OUTPUT || resolve(root, 'artifacts/astrology-true-node-horizons-erfa-v1/complete.json'))
const inputPath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_INPUT || resolve(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))
const framePath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_FRAME_INPUT || resolve(root, 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json'))

function fail(message) {
  throw new Error(message)
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
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

function readJson(path) {
  if (!existsSync(path)) fail(`missing JSON: ${path}`)
  return JSON.parse(readFileSync(path, 'utf8'))
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

function deriveJ2000EclipticNodeLongitude(state) {
  const epsilon = (84381.448 / 3600) * Math.PI / 180
  const c = Math.cos(epsilon)
  const s = Math.sin(epsilon)
  const ecliptic = [state[0], c * state[1] + s * state[2], -s * state[1] + c * state[2], state[3], c * state[4] + s * state[5], -s * state[4] + c * state[5]]
  const h = [
    ecliptic[1] * ecliptic[5] - ecliptic[2] * ecliptic[4],
    ecliptic[2] * ecliptic[3] - ecliptic[0] * ecliptic[5],
    ecliptic[0] * ecliptic[4] - ecliptic[1] * ecliptic[3],
  ]
  return normalizeDegrees360(Math.atan2(h[0], -h[1]) * 180 / Math.PI)
}

function parseHorizonsRaw(path, kind) {
  const rawBytes = readFileSync(path)
  const response = JSON.parse(rawBytes.toString('utf8'))
  if (response.signature?.source !== 'NASA/JPL Horizons API') fail(`${kind} raw source mismatch`)
  if (!response.result?.includes('Target body name: Moon (301)                      {source: DE441}')) fail(`${kind} raw target/source mismatch`)
  if (!response.result.includes(kind === 'vectors' ? 'Output type     : GEOMETRIC cartesian states' : 'Output type     : GEOMETRIC osculating elements')) fail(`${kind} raw type mismatch`)
  if (!response.result.includes(kind === 'vectors' ? 'Geometric state vectors have NO corrections or aberrations applied.' : 'Geometric osculating elements have NO corrections or aberrations applied.')) fail(`${kind} raw correction policy mismatch`)
  const header = response.result.match(/^Ephemeris \/ API_USER ([^\n]+)$/m)?.[1]?.trim()
  if (!header) fail(`${kind} raw response timestamp missing`)
  const body = response.result.split('$$SOE\n')[1]?.split('\n$$EOE')[0]
  if (!body) fail(`${kind} raw body missing`)
  const rows = body.split('\n').filter(Boolean).map((line) => {
    const fields = line.split(',').map((field) => field.trim())
    const numbers = (kind === 'vectors' ? [fields[0], ...fields.slice(2, 8)] : [fields[0], ...fields.slice(2, 6)]).map(Number)
    if (numbers.some((value) => !finite(value))) fail(`${kind} raw numeric parse failed`)
    return kind === 'vectors' ? { jdTdb: numbers[0], state: numbers.slice(1) } : { jdTdb: numbers[0], om: numbers[4] }
  })
  return { rawBytes, response, rows, header }
}

if (!existsSync(artifactPath)) fail(`artifact missing: ${artifactPath}`)
const artifact = readJson(artifactPath)
const input = readJson(inputPath)
const frame = readJson(framePath)
if (artifact.schemaVersion !== 'astrology-true-node-horizons-erfa-frontier-v1') fail('schemaVersion mismatch')
if (artifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) fail('artifact canonical hash mismatch')
if (artifact.availability !== 'available' || artifact.purpose !== 'research_only') fail('research-only availability boundary changed')
if (artifact.comparison.numericStatus !== 'diagnostic_only_no_tolerance_pass') fail('numeric result promoted')
if (artifact.readinessBoundary.independentTrueNodeReference !== 'pending' || artifact.readinessBoundary.qualification !== 'blocked_semantic_identity_insufficient') fail('readiness boundary changed')
if (artifact.readinessBoundary.productionProviderChanged || artifact.readinessBoundary.activationChanged || artifact.readinessBoundary.toleranceChanged) fail('forbidden production/readiness mutation recorded')
if (artifact.sourceIdentity.horizons.sourceFamily !== 'DE441' || artifact.sourceIdentity.horizons.transport.tlsVerification !== 'disabled_explicitly_for_local_certificate_chain') fail('Horizons provenance boundary changed')
if (artifact.sourceIdentity.horizons.vectorQuery.VEC_CORR !== 'NONE' || artifact.sourceIdentity.horizons.vectorQuery.TIME_TYPE !== 'TDB') fail('Horizons vector query semantics changed')
if (artifact.oracleAssessment.horizons.independence !== 'same_family_corroboration' || artifact.oracleAssessment.erfaMoon98.independence !== 'independent_analytic_negative_control') fail('oracle independence classification changed')
if (!artifact.evidenceBoundary.unresolved) fail('unresolved evidence boundary missing')

if (artifact.inputArtifacts.de405Candidate.sha256 !== sha256File(inputPath) || artifact.inputArtifacts.swissFrameDiagnostic.sha256 !== sha256File(framePath)) fail('input artifact byte identity drift')
if (input.schemaVersion !== 'astrology-true-node-independent-frontier-v0' || frame.schemaVersion !== 'astrology-true-node-frame-diagnostic-v1') fail('input schema boundary changed')
if (artifact.sourceIdentity.swissReference.effectiveFlags !== 322 || artifact.sourceIdentity.swissReference.target !== 'SE_TRUE_NODE=11') fail('Swiss reference flags changed')
for (const file of artifact.sourceIdentity.swissReference.files) {
  const path = resolve(root, file.path)
  if (!existsSync(path) || !lstatSync(path).isFile() || sha256File(path) !== file.sha256) fail(`Swiss artifact hash drift: ${file.path}`)
}

const vectorFile = resolve(root, artifact.sourceIdentity.horizons.rawFiles.find((file) => file.kind === 'VECTORS').path)
const elementFile = resolve(root, artifact.sourceIdentity.horizons.rawFiles.find((file) => file.kind === 'ELEMENTS').path)
if (!existsSync(vectorFile) || !existsSync(elementFile)) fail('Horizons raw file missing')
for (const file of artifact.sourceIdentity.horizons.rawFiles) {
  const path = resolve(root, file.path)
  if (file.sizeBytes !== readFileSync(path).byteLength || file.sha256 !== sha256File(path)) fail(`Horizons raw byte identity drift: ${file.path}`)
}
const vectorRaw = parseHorizonsRaw(vectorFile, 'vectors')
const elementRaw = parseHorizonsRaw(elementFile, 'elements')
if (vectorRaw.response.signature?.version !== artifact.sourceIdentity.horizons.apiSignature?.version) fail('Horizons API signature drift')
if (vectorRaw.header !== artifact.sourceIdentity.horizons.rawResponseHeaders.vectors || elementRaw.header !== artifact.sourceIdentity.horizons.rawResponseHeaders.elements) fail('Horizons raw response header drift')

const sampleIndices = artifact.corpus.sampleIndices
const rows = artifact.comparison.rows
if (!Array.isArray(sampleIndices) || sampleIndices.length !== rows.length || artifact.corpus.rowCount !== rows.length) fail('corpus row count mismatch')
const inputById = new Map(input.comparison.rows.map((row) => [row.sampleId, row]))
const frameById = new Map(frame.comparison.rows.map((row) => [row.sampleId, row]))
for (const [index, row] of rows.entries()) {
  const expectedId = `true-node-${String(sampleIndices[index]).padStart(5, '0')}`
  const inputRow = inputById.get(expectedId)
  const frameRow = frameById.get(expectedId)
  if (!inputRow || !frameRow || row.index !== sampleIndices[index] || row.sampleId !== expectedId) fail(`sample ordering mismatch at ${index}`)
  if (row.jdTdb !== inputRow.jdTdb || row.jdTt !== inputRow.jdTt || row.jdUt !== inputRow.jdUt) fail(`inherited epoch mismatch at ${row.sampleId}`)
  if (row.localDe405CandidateLongitudeDegrees !== inputRow.candidateLongitudeDegrees || row.swissMeanEquinoxTrueNodeLongitudeDegrees !== frameRow.swissMeanEquinoxTrueNodeLongitudeDegrees) fail(`inherited longitude mismatch at ${row.sampleId}`)
  if (Math.abs(vectorRaw.rows[index].jdTdb - row.jdTdb) > 1e-9 || Math.abs(elementRaw.rows[index].jdTdb - row.jdTdb) > 1e-9) fail(`raw epoch mismatch at ${row.sampleId}`)
  if (!Array.isArray(row.horizonsVectorStateJ2000KmKmPerSec) || row.horizonsVectorStateJ2000KmKmPerSec.length !== 6 || row.horizonsVectorStateJ2000KmKmPerSec.some((value) => !finite(value))) fail(`Horizons state invalid at ${row.sampleId}`)
  if (!Array.isArray(row.erfaMoon98StateJ2000KmKmPerSec) || row.erfaMoon98StateJ2000KmKmPerSec.length !== 6 || row.erfaMoon98StateJ2000KmKmPerSec.some((value) => !finite(value))) fail(`ERFA state invalid at ${row.sampleId}`)
  if (row.horizonsVectorStateJ2000KmKmPerSec.some((value, stateIndex) => value !== vectorRaw.rows[index].state[stateIndex])) fail(`Horizons state/raw mismatch at ${row.sampleId}`)
  const horizonsDate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: row.horizonsVectorStateJ2000KmKmPerSec, jdTt: row.jdTt })
  const erfaDate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: row.erfaMoon98StateJ2000KmKmPerSec, jdTt: row.jdTt })
  if (horizonsDate.availability !== 'available' || erfaDate.availability !== 'available') fail(`derived state unavailable at ${row.sampleId}`)
  if (horizonsDate.longitudeDegrees !== row.horizonsDateMeanEclipticCandidateLongitudeDegrees || erfaDate.longitudeDegrees !== row.erfaMoon98DateMeanEclipticCandidateLongitudeDegrees) fail(`derived longitude drift at ${row.sampleId}`)
  if (deriveJ2000EclipticNodeLongitude(row.horizonsVectorStateJ2000KmKmPerSec) !== row.horizonsVectorJ2000EclipticNodeLongitudeDegrees) fail(`J2000 node derivation drift at ${row.sampleId}`)
  if (row.horizonsElementJ2000EclipticAscendingNodeLongitudeDegrees !== elementRaw.rows[index].om) fail(`Horizons OM mismatch at ${row.sampleId}`)
  const expected = {
    horizonsElementVectorDifferenceArcseconds: absoluteArcseconds(row.horizonsVectorJ2000EclipticNodeLongitudeDegrees, row.horizonsElementJ2000EclipticAscendingNodeLongitudeDegrees),
    localDe405VsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(row.localDe405CandidateLongitudeDegrees, row.swissMeanEquinoxTrueNodeLongitudeDegrees),
    horizonsDateVsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(row.horizonsDateMeanEclipticCandidateLongitudeDegrees, row.swissMeanEquinoxTrueNodeLongitudeDegrees),
    erfaMoon98VsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(row.erfaMoon98DateMeanEclipticCandidateLongitudeDegrees, row.swissMeanEquinoxTrueNodeLongitudeDegrees),
    horizonsDateVsLocalDe405AbsoluteDifferenceArcseconds: absoluteArcseconds(row.horizonsDateMeanEclipticCandidateLongitudeDegrees, row.localDe405CandidateLongitudeDegrees),
  }
  for (const [field, value] of Object.entries(expected)) if (row[field] !== value) fail(`derived comparison mismatch ${field} at ${row.sampleId}`)
}

for (const [name, field] of Object.entries({
  localDe405VsSwiss: 'localDe405VsSwissAbsoluteDifferenceArcseconds',
  horizonsDateVsSwiss: 'horizonsDateVsSwissAbsoluteDifferenceArcseconds',
  erfaMoon98VsSwiss: 'erfaMoon98VsSwissAbsoluteDifferenceArcseconds',
  horizonsDateVsLocalDe405: 'horizonsDateVsLocalDe405AbsoluteDifferenceArcseconds',
  horizonsElementVectorConsistency: 'horizonsElementVectorDifferenceArcseconds',
})) {
  const expected = summarize(rows, field)
  const actual = artifact.comparison.summaries[name]
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`summary mismatch: ${name}`)
}

if (artifact.sourceIdentity.erfa.runtime?.pyerfaVersion !== '2.0.1.5' || artifact.sourceIdentity.erfa.runtime?.module !== 'erfa.moon98') fail('ERFA runtime provenance mismatch')
if (!artifact.hypotheses.some((hypothesis) => hypothesis.id === 'swiss-default-vondrak-2011' && hypothesis.status === 'supported_as_remaining_frame_hypothesis')) fail('Vondrak frame hypothesis admission changed')
console.log(JSON.stringify({ artifactPath, status: 'pass', rowCount: rows.length, horizonsSourceFamily: artifact.sourceIdentity.horizons.sourceFamily, summaries: artifact.comparison.summaries, qualification: artifact.readinessBoundary.qualification }, null, 2))
