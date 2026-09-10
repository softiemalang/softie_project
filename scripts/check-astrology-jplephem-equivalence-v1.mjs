#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeAstrologyRawChart } from '../src/astrology/astrologyEphemerisCore.js'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import {
  ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1,
  evaluateAstrologyProviderEquivalenceSummary,
} from './lib/astrology-provider-equivalence-contract.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const EXPECTED_KERNEL_URL = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp'
const EXPECTED_KERNEL_SHA256 = '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89'
const EXPECTED_KERNEL_BYTES = 10898432
const EXPECTED_FIXTURE_SHA256 = '8cb64320ebfe24bc2654b920da27af370cc78b4c0f7c663898933aea67a2355d'
const EXPECTED_PROVIDER = { id: 'jplephem', implementation: 'direct_spk', version: '2.24', numpyVersion: '2.5.3', pythonVersion: '3.14.7' }
const EXPECTED_BODY_MAPPING = [
  ['sun', 10, 'body'], ['moon', 301, 'body'], ['mercury', 1, 'barycenter'], ['venus', 2, 'barycenter'],
  ['mars', 4, 'barycenter'], ['jupiter', 5, 'barycenter'], ['saturn', 6, 'barycenter'], ['uranus', 7, 'barycenter'],
  ['neptune', 8, 'barycenter'], ['pluto', 9, 'barycenter'],
]

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
const fixturePath = resolve(args.fixture || '')
const candidatePath = resolve(args.candidate || '')
const referencePath = resolve(args.reference || '')
const summaryPath = args.summary ? resolve(args.summary) : null

const stable = (value) => JSON.stringify(value)
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
const maxAbs = (current, left, right) => Math.max(current, Math.abs(left - right))

function fail(message) {
  throw new Error(message)
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label}: ${actual} != ${expected}`)
}

function assertFiniteVector(vector, label) {
  if (!Array.isArray(vector) || vector.length !== 6 || vector.some((value) => !finite(value))) fail(`${label}: invalid state vector`)
}

function validateFixture(fixture, fixtureBytes) {
  assertEqual(fixture.schemaVersion, 'astrology-provider-equivalence-fixture-v1', 'fixture schema')
  assertEqual(fixture.fixtureId, 'jplephem-de405-equivalence-suite-v1', 'fixture id')
  assertEqual(sha256(fixtureBytes), EXPECTED_FIXTURE_SHA256, 'fixture SHA')
  assertEqual(fixture.kernel.sourceUrl, EXPECTED_KERNEL_URL, 'fixture kernel URL')
  assertEqual(fixture.kernel.sha256, EXPECTED_KERNEL_SHA256, 'fixture kernel SHA')
  assertEqual(fixture.kernel.bytes, EXPECTED_KERNEL_BYTES, 'fixture kernel bytes')
  assertEqual(fixture.time.timeScale, 'TDB', 'fixture time scale')
  assertEqual(fixture.time.observerId, 399, 'fixture observer')
  assertEqual(fixture.time.frame, 'J2000', 'fixture frame')
  assertEqual(fixture.time.aberrationCorrection, 'NONE', 'fixture aberration')
  const mapping = fixture.bodies.map((body) => [body.id, body.targetId, body.targetType])
  assertEqual(stable(mapping), stable(EXPECTED_BODY_MAPPING), 'fixture body mapping')
  if (fixture.fixtures.length !== 19 || fixture.locations.length !== 4) fail('fixture coverage suite incomplete')
}

function validateProviderOutput(candidate, fixture) {
  assertEqual(candidate.schemaVersion, 'astrology-jplephem-producer-output-v1', 'candidate schema')
  assertEqual(candidate.availability, 'available', 'candidate availability')
  for (const [key, expected] of Object.entries(EXPECTED_PROVIDER)) assertEqual(candidate.provider?.[key], expected, `candidate provider ${key}`)
  assertEqual(candidate.source?.sourceUrl, EXPECTED_KERNEL_URL, 'candidate source URL')
  assertEqual(candidate.source?.sha256, EXPECTED_KERNEL_SHA256, 'candidate source SHA')
  assertEqual(candidate.source?.bytes, EXPECTED_KERNEL_BYTES, 'candidate source bytes')
  assertEqual(candidate.source?.identity, fixture.kernel.identity, 'candidate source identity')
  assertEqual(candidate.semantics?.timeScale, fixture.time.timeScale, 'candidate time scale')
  assertEqual(candidate.semantics?.observerId, fixture.time.observerId, 'candidate observer')
  assertEqual(candidate.semantics?.frame, 'J2000/ICRF', 'candidate frame')
  assertEqual(candidate.semantics?.aberrationCorrection, fixture.time.aberrationCorrection, 'candidate aberration')
  assertEqual(candidate.fixture?.fixtureId, fixture.fixtureId, 'candidate fixture id')
  assertEqual(candidate.fixture?.sha256, EXPECTED_FIXTURE_SHA256, 'candidate fixture SHA')
  assertEqual(candidate.fixture?.dateCount, fixture.fixtures.length, 'candidate date count')
  assertEqual(candidate.fixture?.locationCount, fixture.locations.length, 'candidate location count')
  assertEqual(candidate.fixture?.bodyCount, fixture.bodies.length, 'candidate body count')
  assertEqual(candidate.fixture?.rowCount, fixture.fixtures.length * fixture.bodies.length, 'candidate row count metadata')
  if (!Array.isArray(candidate.rows) || candidate.rows.length !== candidate.fixture.rowCount) fail('candidate rows missing or incomplete')
}

function validateReferenceOutput(reference, fixture) {
  assertEqual(reference.schemaVersion, 'astrology-cspice-reference-output-v1', 'reference schema')
  assertEqual(reference.availability, 'available', 'reference availability')
  assertEqual(reference.provider?.id, 'cspice-n0067-canonical-v2', 'reference provider')
  assertEqual(reference.provider?.toolkitVersion, 'N0067', 'reference toolkit')
  assertEqual(reference.provider?.role, 'offline_reference_oracle_only', 'reference role')
  assertEqual(reference.source?.sourceUrl, EXPECTED_KERNEL_URL, 'reference source URL')
  assertEqual(reference.source?.sha256, EXPECTED_KERNEL_SHA256, 'reference source SHA')
  assertEqual(reference.source?.bytes, EXPECTED_KERNEL_BYTES, 'reference source bytes')
  assertEqual(reference.fixture?.fixtureId, fixture.fixtureId, 'reference fixture id')
  assertEqual(reference.fixture?.sha256, EXPECTED_FIXTURE_SHA256, 'reference fixture SHA')
  assertEqual(reference.fixture?.rowCount, fixture.fixtures.length * fixture.bodies.length, 'reference row count')
  if (!Array.isArray(reference.rows) || reference.rows.length !== reference.fixture.rowCount) fail('reference rows missing or incomplete')
}

function validateRows(candidate, reference, fixture) {
  const expected = new Map(fixture.fixtures.flatMap((item) => fixture.bodies.map((body) => [
    `${item.id}:${body.id}`,
    { fixtureId: item.id, body: body.id, targetId: body.targetId, targetType: body.targetType, et: item.et },
  ])))
  const indexRows = (rows, label) => {
    const indexed = new Map()
    for (const row of rows) {
      const key = `${row.fixtureId}:${row.body}`
      const wanted = expected.get(key)
      if (!wanted || indexed.has(key)) fail(`${label} row identity mismatch: ${key}`)
      assertEqual(row.targetId, wanted.targetId, `${label} target ${key}`)
      assertEqual(row.targetType, wanted.targetType, `${label} target type ${key}`)
      assertEqual(row.observerId, 399, `${label} observer ${key}`)
      assertEqual(row.queryEtHex, (() => { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); view.setFloat64(0, wanted.et, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` })(), `${label} ET bits ${key}`)
      const vector = [...(row.positionKm || []), ...(row.velocityKmPerSecond || [])]
      assertFiniteVector(vector, `${label} ${key}`)
      assertEqual(row.selectionEvidenceStatus, 'verified', `${label} selection ${key}`)
      indexed.set(key, row)
    }
    if (indexed.size !== expected.size) fail(`${label} row set incomplete: ${indexed.size}`)
    return indexed
  }
  return { candidate: indexRows(candidate.rows, 'candidate'), reference: indexRows(reference.rows, 'reference') }
}

function stateFromRow(row) {
  return [...row.positionKm, ...row.velocityKmPerSecond]
}

function timeAngleInput(fixture, location, item) {
  return {
    schemaVersion: 'astrology-time-angle-input-v0',
    calendar: 'proleptic_gregorian',
    candidateId: `${item.id}:${location.id}`,
    inputStatus: 'synthetic_validation_fixture',
    verificationStatus: 'verified',
    utc: item.utc,
    location: { longitudeDegreesEast: location.longitudeDegreesEast, geographicLatitudeDegrees: location.latitudeDegrees },
    timeScaleOffsets: {
      ut1MinusUtcSeconds: fixture.time.ut1MinusUtcSeconds,
      ttMinusUtcSeconds: fixture.time.ttMinusUtcSeconds,
      sourceStatus: 'explicit_deterministic_fixture',
    },
  }
}

function composeForProvider(fixture, location, item, rows, provider) {
  const rowByBody = new Map(rows.filter((row) => row.fixtureId === item.id).map((row) => [row.body, row]))
  const raw = composeAstrologyRawChart({
    timeAngleInput: timeAngleInput(fixture, location, item),
    tdbMinusTtSeconds: item.tdbMinusTtSeconds,
    evaluateStates: ({ etSeconds, bodyMapping, observerId, frame, aberrationCorrection }) => {
      if (!finite(etSeconds) || observerId !== 399 || frame !== 'J2000' || aberrationCorrection !== 'NONE') return { availability: 'blocked', reason: 'semantic_input_mismatch' }
      const states = {}
      for (const mapping of bodyMapping) {
        const row = rowByBody.get(mapping.id)
        if (!row) return { availability: 'blocked', reason: `missing_state:${mapping.id}` }
        states[mapping.id] = { stateKmKmPerSec: stateFromRow(row), selectionEvidenceStatus: 'verified' }
      }
      return { availability: 'available', states }
    },
    kernelProvenance: {
      source: provider.provider.id,
      provider: provider.provider.id,
      kernelSha256: provider.source.sha256,
      coverage: { coverageStartEt: fixture.kernel.coverage.startEt, coverageEndEt: fixture.kernel.coverage.endEt },
    },
  })
  if (raw.availability !== 'available') fail(`raw chart unavailable for ${provider.provider.id}/${item.id}/${location.id}: ${raw.reason}`)
  return raw
}

function semanticProjection(rule) {
  const body = (rule.bodies || []).map((item) => ({ id: item.id, signId: item.signId, signIndex: item.signIndex, boundaryStatus: item.boundaryStatus, motionState: item.motionState, retrograde: item.retrograde, availability: item.availability }))
  const angles = ['ascendant', 'midheaven'].map((id) => {
    const item = rule.angles?.[id] || {}
    return { id, signId: item.signId, signIndex: item.signIndex, boundaryStatus: item.boundaryStatus, availability: item.availability }
  })
  const houses = {
    availability: rule.houses?.availability,
    houseSystem: rule.houses?.houseSystem,
    ascendantSignId: rule.houses?.ascendantSignId,
    ascendantSignIndex: rule.houses?.ascendantSignIndex,
    placements: (rule.houses?.placements || []).map((item) => ({ id: item.id, house: item.house, availability: item.availability })),
  }
  const chartRulers = {
    availability: rule.chartRulers?.availability,
    ascendantSignId: rule.chartRulers?.ascendantSignId,
    traditionalChartRuler: rule.chartRulers?.traditionalChartRuler,
    modernChartRuler: rule.chartRulers?.modernChartRuler,
  }
  const aspects = (rule.aspects || []).map((item) => ({ id: item.id, pointA: item.pointA, pointB: item.pointB, aspectId: item.aspectId, orbBoundaryStatus: item.orbBoundaryStatus, phase: item.phase, phaseReason: item.phaseReason }))
  const distribution = rule.distribution ? {
    overall: rule.distribution.overall,
    personal: rule.distribution.personal,
  } : null
  return { body, angles, houses, chartRulers, aspects, distribution }
}

function boundaryProjection(rule) {
  const body = (rule.bodies || []).map((item) => [item.id, item.boundaryStatus])
  const angles = ['ascendant', 'midheaven'].map((id) => [id, rule.angles?.[id]?.boundaryStatus])
  const aspects = (rule.aspects || []).map((item) => [item.id, item.orbBoundaryStatus])
  return { body, angles, aspects }
}

function semanticProvenance(raw) {
  const de405 = raw.provenance?.de405 || {}
  const time = raw.provenance?.ephemerisTime || {}
  const transform = raw.provenance?.transform || {}
  return {
    time: { inputScale: time.inputScale, model: time.model },
    de405: {
      observerId: de405.observerId,
      observer: de405.observer,
      frame: de405.frame,
      aberrationCorrection: de405.aberrationCorrection,
      units: de405.units,
      bodyMapping: de405.bodyMapping,
    },
    transform: { model: transform.model, input: transform.input, output: transform.output, speed: transform.speed },
  }
}

function compareChart(candidateRaw, referenceRaw, totals) {
  const candidateRule = deriveAstrologyRuleChart(candidateRaw)
  const referenceRule = deriveAstrologyRuleChart(referenceRaw)
  for (const [left, right] of candidateRaw.bodies.map((body, index) => [body, referenceRaw.bodies[index]])) {
    totals.maxLongitudeAbsDiffDegrees = maxAbs(totals.maxLongitudeAbsDiffDegrees, left.longitudeDegrees, right.longitudeDegrees)
    totals.maxSpeedAbsDiffDegreesPerDay = maxAbs(totals.maxSpeedAbsDiffDegreesPerDay, left.longitudeSpeedDegreesPerDay, right.longitudeSpeedDegreesPerDay)
    const leftPlacement = deriveAstrologyRuleChart({ ...candidateRaw, bodies: [left] }).bodies[0]
    const rightPlacement = deriveAstrologyRuleChart({ ...referenceRaw, bodies: [right] }).bodies[0]
    totals.maxDegreeInSignAbsDiffDegrees = maxAbs(totals.maxDegreeInSignAbsDiffDegrees, leftPlacement.degreeInSign, rightPlacement.degreeInSign)
    totals.maxBoundaryDistanceAbsDiffDegrees = maxAbs(totals.maxBoundaryDistanceAbsDiffDegrees, leftPlacement.distanceToNearestBoundaryDegrees, rightPlacement.distanceToNearestBoundaryDegrees)
  }
  for (const id of ['ascendant', 'midheaven']) totals.maxLongitudeAbsDiffDegrees = maxAbs(totals.maxLongitudeAbsDiffDegrees, candidateRaw.angles[id].longitudeDegrees, referenceRaw.angles[id].longitudeDegrees)
  const candidateAspectById = new Map(candidateRule.aspects.map((item) => [item.id, item]))
  const referenceAspectById = new Map(referenceRule.aspects.map((item) => [item.id, item]))
  for (const id of new Set([...candidateAspectById.keys(), ...referenceAspectById.keys()])) {
    const left = candidateAspectById.get(id); const right = referenceAspectById.get(id)
    if (!left || !right) continue
    totals.maxAspectDistanceAbsDegrees = maxAbs(totals.maxAspectDistanceAbsDegrees, left.angularDistanceDegrees, right.angularDistanceDegrees)
    totals.maxAspectOrbAbsDegrees = maxAbs(totals.maxAspectOrbAbsDegrees, left.orbDegrees, right.orbDegrees)
    totals.maxAspectOffsetAbsDegrees = maxAbs(totals.maxAspectOffsetAbsDegrees, left.signedOffsetDegrees || 0, right.signedOffsetDegrees || 0)
    totals.maxAspectRelativeSpeedAbsDegreesPerDay = maxAbs(totals.maxAspectRelativeSpeedAbsDegreesPerDay, left.relativeSpeedDegreesPerDay || 0, right.relativeSpeedDegreesPerDay || 0)
  }
  if (stable(semanticProjection(candidateRule)) !== stable(semanticProjection(referenceRule))) totals.discreteMismatchCount += 1
  const leftBoundary = boundaryProjection(candidateRule); const rightBoundary = boundaryProjection(referenceRule)
  if (stable(leftBoundary) !== stable(rightBoundary)) totals.boundaryMismatchCount += 1
  if (stable(semanticProvenance(candidateRaw)) !== stable(semanticProvenance(referenceRaw))) totals.provenanceMismatchCount += 1
}

async function main() {
  if (!args.fixture || !args.candidate || !args.reference) fail('usage: --fixture FILE --candidate FILE --reference FILE [--summary FILE]')
  const fixtureBytes = await readFile(fixturePath)
  const fixture = JSON.parse(fixtureBytes)
  validateFixture(fixture, fixtureBytes)
  const candidateBytes = await readFile(candidatePath)
  const referenceBytes = await readFile(referencePath)
  const candidate = JSON.parse(candidateBytes)
  const reference = JSON.parse(referenceBytes)
  validateProviderOutput(candidate, fixture)
  validateReferenceOutput(reference, fixture)
  const indexed = validateRows(candidate, reference, fixture)
  const totals = {
    rawRowCount: candidate.rows.length,
    chartCount: fixture.fixtures.length * fixture.locations.length,
    maxRawPositionAbsDiffKm: 0,
    maxRawPositionNormAbsDiffKm: 0,
    maxRawVelocityAbsDiffKmS: 0,
    maxRawVelocityNormAbsDiffKmS: 0,
    maxLongitudeAbsDiffDegrees: 0,
    maxDegreeInSignAbsDiffDegrees: 0,
    maxSpeedAbsDiffDegreesPerDay: 0,
    maxBoundaryDistanceAbsDiffDegrees: 0,
    maxAspectDistanceAbsDegrees: 0,
    maxAspectOrbAbsDegrees: 0,
    maxAspectOffsetAbsDegrees: 0,
    maxAspectRelativeSpeedAbsDegreesPerDay: 0,
    discreteMismatchCount: 0,
    boundaryMismatchCount: 0,
    provenanceMismatchCount: 0,
  }
  for (const key of indexed.candidate.keys()) {
    const left = indexed.candidate.get(key); const right = indexed.reference.get(key)
    const leftState = stateFromRow(left); const rightState = stateFromRow(right)
    for (let index = 0; index < 3; index += 1) totals.maxRawPositionAbsDiffKm = Math.max(totals.maxRawPositionAbsDiffKm, Math.abs(leftState[index] - rightState[index]))
    for (let index = 3; index < 6; index += 1) totals.maxRawVelocityAbsDiffKmS = Math.max(totals.maxRawVelocityAbsDiffKmS, Math.abs(leftState[index] - rightState[index]))
    totals.maxRawPositionNormAbsDiffKm = Math.max(totals.maxRawPositionNormAbsDiffKm, Math.hypot(...leftState.slice(0, 3).map((value, index) => value - rightState[index])))
    totals.maxRawVelocityNormAbsDiffKmS = Math.max(totals.maxRawVelocityNormAbsDiffKmS, Math.hypot(...leftState.slice(3, 6).map((value, index) => value - rightState[index + 3])))
  }
  for (const item of fixture.fixtures) {
    for (const location of fixture.locations) {
      const candidateRaw = composeForProvider(fixture, location, item, candidate.rows, candidate)
      const referenceRaw = composeForProvider(fixture, location, item, reference.rows, reference)
      compareChart(candidateRaw, referenceRaw, totals)
    }
  }
  const evaluation = evaluateAstrologyProviderEquivalenceSummary(totals)
  const report = {
    schemaVersion: 'astrology-provider-equivalence-report-v1',
    contract: ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.schemaVersion,
    candidate: { path: candidatePath, bytes: candidateBytes.length, sha256: sha256(candidateBytes), provider: candidate.provider },
    reference: { path: referencePath, bytes: referenceBytes.length, sha256: sha256(referenceBytes), provider: reference.provider },
    fixture: { path: fixturePath, bytes: fixtureBytes.length, sha256: sha256(fixtureBytes), fixtureId: fixture.fixtureId },
    metrics: totals,
    evaluation,
    status: evaluation.status,
    productionStatus: ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.status,
  }
  if (summaryPath) await writeFile(summaryPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
  if (evaluation.status !== 'pass') process.exitCode = 1
}

try {
  await main()
} catch (error) {
  console.error(`Astrology jplephem equivalence check failed: ${error.message}`)
  process.exitCode = 1
}
