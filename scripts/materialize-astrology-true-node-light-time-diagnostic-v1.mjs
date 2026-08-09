#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { angularDifferenceDegrees } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = resolve(process.env.DE405_TRUE_NODE_LIGHT_TIME_INPUT || join(root, 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json'))
const swissBuildPath = resolve(process.env.DE405_TRUE_NODE_LIGHT_TIME_SWISS_BUILD || join(root, 'spikes/astrology-swiss-wasm/generated/build-a'))
const outputPath = resolve(process.env.DE405_TRUE_NODE_LIGHT_TIME_OUTPUT || join(root, 'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json'))
const SWISS_ENGINE_FLAGS = 2
const SWISS_NONUT_FLAG = 64
const SWISS_SPEED_FLAG = 256
const SWISS_TRUEPOS_FLAG = 16
const defaultFlags = SWISS_ENGINE_FLAGS | SWISS_NONUT_FLAG | SWISS_SPEED_FLAG
const truePositionFlags = defaultFlags | SWISS_TRUEPOS_FLAG
const accessDate = '2026-08-09'

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

async function loadSwiss() {
  const modulePath = join(swissBuildPath, 'swiss-spike.mjs')
  if (!existsSync(modulePath)) fail(`Swiss build missing: ${modulePath}`)
  const { default: createSwissSpike } = await import(pathToFileURL(modulePath))
  const module = await createSwissSpike({ locateFile: (fileName) => join(swissBuildPath, fileName) })
  module.ccall('astro_spike_init', null, ['string'], ['/ephe'])
  return module
}

function calculateSwissTrueNode(module, jdUt, flags) {
  const row = JSON.parse(module.ccall('astro_spike_calculate_body', 'string', ['number', 'number', 'number'], [jdUt, 11, flags]))
  if ((row.effectiveFlags & flags) !== flags || (row.effectiveFlags & SWISS_ENGINE_FLAGS) !== SWISS_ENGINE_FLAGS || row.error !== '') fail(`Swiss fallback or error at JD UT ${jdUt}: ${JSON.stringify(row)}`)
  return row
}

const inputBytes = readFileSync(inputPath)
const inputArtifact = JSON.parse(inputBytes)
if (inputArtifact.schemaVersion !== 'astrology-true-node-horizons-erfa-frontier-v2') fail('input artifact must be the expanded Horizons v2 corpus')
if (inputArtifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(inputArtifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) fail('input artifact canonical hash mismatch')
const inputRows = inputArtifact.comparison?.rows
if (!Array.isArray(inputRows) || inputRows.length !== inputArtifact.corpus?.rowCount) fail('input comparison rows are incomplete')

const swiss = await loadSwiss()
const rows = inputRows.map((inputRow) => {
  const defaultRow = calculateSwissTrueNode(swiss, inputRow.jdUt, defaultFlags)
  const truePositionRow = calculateSwissTrueNode(swiss, inputRow.jdUt, truePositionFlags)
  return {
    index: inputRow.index,
    sampleId: inputRow.sampleId,
    jdTdb: inputRow.jdTdb,
    jdTt: inputRow.jdTt,
    jdUt: inputRow.jdUt,
    horizonsDateMeanEclipticCandidateLongitudeDegrees: inputRow.horizonsDateMeanEclipticCandidateLongitudeDegrees,
    swissDefaultTrueNodeLongitudeDegrees: defaultRow.longitude,
    swissTruePositionTrueNodeLongitudeDegrees: truePositionRow.longitude,
    lightTimeEffectArcseconds: absoluteArcseconds(defaultRow.longitude, truePositionRow.longitude),
    horizonsDateVsSwissDefaultAbsoluteDifferenceArcseconds: absoluteArcseconds(inputRow.horizonsDateMeanEclipticCandidateLongitudeDegrees, defaultRow.longitude),
    horizonsDateVsSwissTruePositionAbsoluteDifferenceArcseconds: absoluteArcseconds(inputRow.horizonsDateMeanEclipticCandidateLongitudeDegrees, truePositionRow.longitude),
    swissDefaultEffectiveFlags: defaultRow.effectiveFlags,
    swissTruePositionEffectiveFlags: truePositionRow.effectiveFlags,
  }
})

const swissFiles = ['swiss-spike.mjs', 'swiss-spike.wasm', 'swiss-spike.data'].map((fileName) => {
  const path = join(swissBuildPath, fileName)
  if (!existsSync(path) || !lstatSync(path).isFile()) fail(`Swiss artifact missing: ${path}`)
  return { path: relative(root, path), sizeBytes: readFileSync(path).byteLength, sha256: sha256File(path) }
})

const payload = {
  schemaVersion: 'astrology-true-node-light-time-diagnostic-v1',
  availability: 'available',
  purpose: 'diagnostic_only',
  evidenceBoundary: {
    directObservation: 'A deterministic local Swiss comparison evaluated SE_TRUE_NODE with and without SEFLG_TRUEPOS on the same expanded Horizons epochs.',
    inheritedEvidence: 'The Horizons-derived candidate and epochs are inherited byte-identified inputs; this artifact does not make Horizons or Swiss an independent semantic authority.',
    deterministicDerivation: 'The reported light-time effect is the cyclic longitude difference between the two explicitly requested Swiss flag configurations.',
    inference: 'The experiment bounds the contribution of Swiss apparent/geometric handling within this same engine and frame convention; it does not prove which convention the product should adopt.',
    unresolved: 'Independent high-precision True Node authority, exact semantic identity, licensing/deployment approval, and production activation remain unresolved.',
  },
  inputArtifact: {
    path: relative(root, inputPath),
    sha256: sha256(inputBytes),
    schemaVersion: inputArtifact.schemaVersion,
    payloadCanonicalSha256: inputArtifact.payloadCanonicalSha256,
    role: 'expanded_horizons_candidate_comparison_input_only',
  },
  sourceIdentity: {
    swissReference: {
      engineVersion: swiss.ccall('astro_spike_version', 'string'),
      files: swissFiles,
      target: 'SE_TRUE_NODE=11',
      defaultFlags,
      truePositionFlags,
      flagSemantics: 'default=SEFLG_SWIEPH|SEFLG_NONUT|SEFLG_SPEED; truePosition=default|SEFLG_TRUEPOS; both mean equinox of date, speed requested',
      role: 'same-engine-light-time-convention-diagnostic_reference_only',
    },
    publicDocumentation: [
      {
        title: 'Swiss Ephemeris Programmer\'s Manual',
        provider: 'Astrodienst / Swiss Ephemeris',
        url: 'https://www.astro.com/swisseph/swephprg.pdf',
        accessDate,
        locator: 'SEFLG_TRUEPOS and SEFLG_NONUT flag descriptions',
        admission: 'convention_metadata_only',
      },
      {
        title: 'Swiss Ephemeris official source',
        provider: 'aloistr/swisseph',
        url: 'https://github.com/aloistr/swisseph',
        accessDate,
        locator: 'lunar_osc_elem light-time branch and SE_TRUE_NODE dispatch',
        admission: 'same-engine_source_observation_only',
      },
    ],
  },
  comparison: {
    numericStatus: 'diagnostic_only_no_tolerance_pass',
    defaultFlagsSummary: summarize(rows, 'horizonsDateVsSwissDefaultAbsoluteDifferenceArcseconds'),
    truePositionFlagsSummary: summarize(rows, 'horizonsDateVsSwissTruePositionAbsoluteDifferenceArcseconds'),
    lightTimeEffectSummary: summarize(rows, 'lightTimeEffectArcseconds'),
    rows,
  },
  inference: {
    classification: 'light_time_effect_bounded_within_same_engine',
    maxLightTimeEffectArcseconds: summarize(rows, 'lightTimeEffectArcseconds').maxAbsoluteDifferenceArcseconds,
    inheritedMaxCandidateResidualArcseconds: inputArtifact.comparison.summaries.horizonsDateVsSwissDefault.maxAbsoluteDifferenceArcseconds,
    interpretation: 'The light-time flag toggle is a bounded same-engine diagnostic. Its measured effect must not be treated as an independent oracle, a semantic selection, or a tolerance authorization.',
    notEstablished: ['semantic identity', 'independent oracle authority', 'production convention', 'license or deployment approval'],
  },
  readinessBoundary: {
    independentTrueNodeReference: 'pending',
    qualification: 'blocked_semantic_identity_insufficient',
    productionProviderChanged: false,
    activationChanged: false,
    toleranceChanged: false,
    interpretationEligibility: 'unchanged_blocked_by_existing_contracts',
  },
  provenance: {
    materializerPath: relative(root, fileURLToPath(import.meta.url)),
    materializerSha256: sha256File(fileURLToPath(import.meta.url)),
    generatedWithoutNetwork: true,
  },
}

const output = { ...payload, payloadCanonicalSha256: canonicalSha256(payload) }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, payloadCanonicalSha256: output.payloadCanonicalSha256, rowCount: rows.length, comparison: output.comparison }, null, 2))
