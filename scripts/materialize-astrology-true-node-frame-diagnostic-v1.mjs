#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { angularDifferenceDegrees } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = resolve(process.env.DE405_TRUE_NODE_FRAME_INPUT || join(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))
const swissBuildPath = resolve(process.env.DE405_TRUE_NODE_FRAME_SWISS_BUILD || join(root, 'spikes/astrology-swiss-wasm/generated/build-a'))
const outputPath = resolve(process.env.DE405_TRUE_NODE_FRAME_OUTPUT || join(root, 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json'))
const SWISS_ENGINE_FLAGS = 2
const SWISS_NONUT_FLAG = 64
const SWISS_SPEED_FLAG = 256
const requestedFlags = SWISS_ENGINE_FLAGS | SWISS_NONUT_FLAG | SWISS_SPEED_FLAG

function fail(message) {
  throw new Error(message)
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path))
}

function canonicalSha256(value) {
  return sha256Bytes(Buffer.from(`${JSON.stringify(value)}\n`))
}

function summarize(rows) {
  const absoluteArcseconds = rows.map((row) => row.absoluteDifferenceArcseconds).sort((left, right) => left - right)
  const percentile = (fraction) => absoluteArcseconds[Math.min(absoluteArcseconds.length - 1, Math.floor((absoluteArcseconds.length - 1) * fraction))]
  const max = rows.reduce((best, row) => row.absoluteDifferenceArcseconds > best.absoluteDifferenceArcseconds ? row : best, rows[0])
  return {
    rowCount: rows.length,
    maxAbsoluteDifferenceArcseconds: max.absoluteDifferenceArcseconds,
    maxDifferenceSampleId: max.sampleId,
    p50AbsoluteDifferenceArcseconds: percentile(0.5),
    p95AbsoluteDifferenceArcseconds: percentile(0.95),
    p99AbsoluteDifferenceArcseconds: percentile(0.99),
    minAbsoluteDifferenceArcseconds: absoluteArcseconds[0],
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

function calculateSwissMeanEquinoxTrueNode(module, jdUt) {
  const row = JSON.parse(module.ccall('astro_spike_calculate_body', 'string', ['number', 'number', 'number'], [jdUt, 11, requestedFlags]))
  if (row.effectiveFlags !== requestedFlags || row.error !== '') fail(`Swiss fallback or error at JD UT ${jdUt}: ${JSON.stringify(row)}`)
  return row
}

const inputBytes = readFileSync(inputPath)
const inputArtifact = JSON.parse(inputBytes)
if (inputArtifact.schemaVersion !== 'astrology-true-node-independent-frontier-v0') fail('input artifact schemaVersion mismatch')
if (inputArtifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(inputArtifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) fail('input artifact canonical hash mismatch')
const inputRows = inputArtifact.comparison?.rows
if (!Array.isArray(inputRows) || inputRows.length !== inputArtifact.corpus?.timestampCount) fail('input comparison rows are incomplete')

const swiss = await loadSwiss()
const rows = inputRows.map((inputRow, index) => {
  if (inputRow.index !== index || inputRow.sampleId !== `true-node-${String(index).padStart(5, '0')}`) fail(`input row ordering mismatch at ${index}`)
  const swissRow = calculateSwissMeanEquinoxTrueNode(swiss, inputRow.jdUt)
  const rawDifferenceDegrees = inputRow.candidateLongitudeDegrees - swissRow.longitude
  const cyclicDifferenceDegrees = angularDifferenceDegrees(inputRow.candidateLongitudeDegrees, swissRow.longitude)
  return {
    index,
    sampleId: inputRow.sampleId,
    jdTdb: inputRow.jdTdb,
    jdTt: inputRow.jdTt,
    jdUt: inputRow.jdUt,
    etSeconds: inputRow.etSeconds,
    candidateLongitudeDegrees: inputRow.candidateLongitudeDegrees,
    swissMeanEquinoxTrueNodeLongitudeDegrees: swissRow.longitude,
    rawDifferenceDegrees,
    cyclicDifferenceDegrees,
    absoluteDifferenceArcseconds: Math.abs(cyclicDifferenceDegrees) * 3600,
    swissEffectiveFlags: swissRow.effectiveFlags,
  }
})

const swissFiles = ['swiss-spike.mjs', 'swiss-spike.wasm', 'swiss-spike.data'].map((fileName) => {
  const path = join(swissBuildPath, fileName)
  if (!existsSync(path) || !lstatSync(path).isFile()) fail(`Swiss artifact missing: ${path}`)
  return { path: relative(root, path), sizeBytes: readFileSync(path).byteLength, sha256: sha256File(path) }
})
const inputSummary = inputArtifact.comparison.summary
const meanEquinoxSummary = summarize(rows)

const payload = {
  schemaVersion: 'astrology-true-node-frame-diagnostic-v1',
  availability: 'available',
  purpose: 'diagnostic_only',
  evidenceBoundary: {
    directObservation: 'A deterministic local comparison was run against the inherited JPL DE405 state-derived candidate rows.',
    inheritedEvidence: 'The candidate states, epochs, and candidate longitudes are inherited from the preserved v0 artifact; this artifact does not create an independent oracle.',
    independentCorroboration: 'Official Swiss Ephemeris documentation defines the node and documents mean-equinox/no-nutation flags; documentation is not a raw independent True Node output.',
    inference: 'The observed residual change bounds a frame/nutation mismatch in the prior comparison, but does not establish semantic identity or authority.',
    unresolved: 'Independent raw True Node output, exact provider/version equivalence, historical UTC mapping, licensing/deployment terms, and product convention approval remain unresolved.',
  },
  inputArtifact: {
    path: relative(root, inputPath),
    sha256: sha256Bytes(inputBytes),
    schemaVersion: inputArtifact.schemaVersion,
    payloadCanonicalSha256: inputArtifact.payloadCanonicalSha256,
    role: 'inherited_candidate_comparison_only',
  },
  sourceIdentity: {
    swissReference: {
      engineVersion: swiss.ccall('astro_spike_version', 'string'),
      files: swissFiles,
      target: 'SE_TRUE_NODE=11',
      requestedFlags,
      effectiveFlags: requestedFlags,
      flagSemantics: 'SEFLG_SWIEPH=2 | SEFLG_NONUT=64 | SEFLG_SPEED=256; mean equinox of date, no nutation, speed requested',
      role: 'same-engine-convention-diagnostic_reference_only',
    },
    publicDocumentation: [
      {
        title: 'Swiss Ephemeris Documentation: Lunar and Planetary Nodes and Apsides',
        provider: 'Astrodienst / Swiss Ephemeris',
        url: 'https://www.astro.com/swisseph-download/doc/swisseph.pdf',
        accessDate: '2026-08-09',
        locator: 'section 3, pp. 18-19 of the PDF',
        context: 'Documents the traditional true lunar node as the osculating node of the momentary lunar orbit and distinguishes ecliptic/nutation conventions.',
        admission: 'independent_corroboration_definition_only',
      },
      {
        title: 'Swiss Ephemeris Programmer\'s Manual',
        provider: 'Astrodienst / Swiss Ephemeris',
        url: 'https://www.astro.com/swisseph/swephprg.pdf',
        accessDate: '2026-08-09',
        locator: 'flag table, pp. 15-17 of the PDF; SE_TRUE_NODE body table',
        context: 'Documents SEFLG_NONUT=64 as no nutation / mean equinox of date and identifies SE_TRUE_NODE=11.',
        admission: 'independent_corroboration_convention_metadata_only',
      },
      {
        title: 'Horizons System Manual',
        provider: 'NASA/JPL Solar System Dynamics',
        url: 'https://ssd.jpl.nasa.gov/horizons/manual.html',
        accessDate: '2026-08-09',
        locator: 'section 2, Osculating Orbital Elements, and output-field description for OM',
        context: 'Documents instantaneous osculating elements, JDTDB epochs, and longitude of ascending node output, but no raw Horizons result was acquired in this run.',
        admission: 'independent_corroboration_oracle-lead_only',
      },
    ],
  },
  convention: {
    candidateOutputFrame: 'mean ecliptic and equinox of date',
    priorReferenceFlags: inputArtifact.comparison.rows[0].swissEffectiveFlags,
    diagnosticReferenceFlags: requestedFlags,
    diagnosticReferenceFrame: 'Swiss SE_TRUE_NODE with SEFLG_NONUT: mean equinox of date and no nutation',
    nodeDefinitionEquivalence: 'unresolved',
  },
  comparison: {
    reference: 'Swiss SE_TRUE_NODE through the existing WASM smoke binding with SEFLG_NONUT',
    coordinateComparison: 'cyclic longitude difference in degrees, then arcseconds',
    numericStatus: 'diagnostic_only_no_tolerance_pass',
    inheritedDefaultFlagsSummary: {
      flags: inputArtifact.comparison.rows[0].swissEffectiveFlags,
      maxAbsoluteDifferenceArcseconds: inputSummary.maxAbsoluteDifferenceArcseconds,
      p50AbsoluteDifferenceArcseconds: inputSummary.p50AbsoluteDifferenceArcseconds,
      p95AbsoluteDifferenceArcseconds: inputSummary.p95AbsoluteDifferenceArcseconds,
    },
    meanEquinoxSummary,
    rows,
  },
  inference: {
    classification: 'residual_collapses_when_reference_uses_mean_equinox_no_nutation',
    observedDefaultMaxArcseconds: inputSummary.maxAbsoluteDifferenceArcseconds,
    observedMeanEquinoxMaxArcseconds: meanEquinoxSummary.maxAbsoluteDifferenceArcseconds,
    residualReductionArcseconds: inputSummary.maxAbsoluteDifferenceArcseconds - meanEquinoxSummary.maxAbsoluteDifferenceArcseconds,
    interpretation: 'The prior 18.6357 arcsecond maximum is materially affected by comparing a mean-ecliptic candidate with the default Swiss true-equinox/nutation output. The remaining residual is still not an authority or acceptance result.',
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
console.log(JSON.stringify({ outputPath, payloadCanonicalSha256: output.payloadCanonicalSha256, rowCount: rows.length, summary: meanEquinoxSummary }, null, 2))
