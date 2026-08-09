#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeDegrees360 } from '../src/astrology/astrologyAngles.js'
import { transformDe405State } from '../src/astrology/astrologyEphemerisCore.js'
import { angularDifferenceDegrees, deriveOsculatingLunarNodeLongitude } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_INPUT || join(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))
const framePath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_FRAME_INPUT || join(root, 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json'))
const outputPath = resolve(process.env.DE405_TRUE_NODE_HORIZONS_OUTPUT || join(root, 'artifacts/astrology-true-node-horizons-erfa-v1/complete.json'))
const artifactDirectory = dirname(outputPath)
const vectorRawPath = join(artifactDirectory, 'horizons-vectors.json')
const elementsRawPath = join(artifactDirectory, 'horizons-elements.json')
const horizonsApiUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api'
const accessDate = '2026-08-09'
const sampleIndices = [0, 440, 1354, 2367, 3670, 5000, 6000, 7341]
const J2000 = 2451545.0
const DAY_SECONDS = 86400
const AU_KM = 149597870.7
const IAU76_OBLIQUITY_RADIANS = (84381.448 / 3600) * Math.PI / 180

function fail(message) {
  throw new Error(message)
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
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

function readJson(path) {
  if (!existsSync(path)) fail(`JSON file missing: ${path}`)
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadArtifact(path, schemaVersion) {
  const artifact = readJson(path)
  if (artifact.schemaVersion !== schemaVersion) fail(`schemaVersion mismatch for ${path}`)
  if (artifact.payloadCanonicalSha256 !== canonicalSha256(Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== 'payloadCanonicalSha256')))) {
    fail(`canonical hash mismatch for ${path}`)
  }
  return artifact
}

function requestParams(kind, tlist) {
  const common = {
    format: 'json',
    COMMAND: "'301'",
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    CENTER: "'500@399'",
    TLIST_TYPE: 'JD',
    TLIST: tlist.map((jd) => jd.toFixed(1)).join(' '),
    TIME_TYPE: 'TDB',
    OUT_UNITS: 'KM-S',
    CSV_FORMAT: 'YES',
  }
  if (kind === 'vectors') {
    return { ...common, EPHEM_TYPE: 'VECTORS', REF_PLANE: 'FRAME', REF_SYSTEM: 'ICRF', VEC_TABLE: '2', VEC_CORR: 'NONE', VEC_LABELS: 'YES' }
  }
  return { ...common, EPHEM_TYPE: 'ELEMENTS', REF_PLANE: 'ECLIPTIC', REF_SYSTEM: 'ICRF', ELM_LABELS: 'YES' }
}

function fetchHorizons(params) {
  const args = ['--insecure', '--fail-with-body', '--retry', '1', '--connect-timeout', '15', '--max-time', '90', '--get', horizonsApiUrl]
  for (const [key, value] of Object.entries(params)) args.push('--data-urlencode', `${key}=${value}`)
  const result = spawnSync('curl', args, { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) {
    fail(`Horizons request failed status=${result.status}: ${result.stderr?.toString() || result.stdout?.toString() || 'no response'}`)
  }
  return result.stdout
}

function loadRawResponse(path, inputEnv, params) {
  let bytes
  const input = process.env[inputEnv]
  if (input) {
    if (!existsSync(input)) fail(`raw input missing: ${input}`)
    bytes = readFileSync(input)
  } else if (existsSync(path)) {
    bytes = readFileSync(path)
  } else {
    bytes = fetchHorizons(params)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, bytes)
  return { bytes, response: JSON.parse(bytes.toString('utf8')) }
}

function validateHorizonsResponse(response, kind) {
  if (response.signature?.source !== 'NASA/JPL Horizons API') fail(`${kind} response source mismatch`)
  if (!response.result?.includes('Target body name: Moon (301)                      {source: DE441}')) fail(`${kind} response target/source mismatch`)
  if (!response.result.includes('Center body name: Earth (399)                     {source: DE441}')) fail(`${kind} response center/source mismatch`)
  if (!response.result.includes(kind === 'vectors' ? 'Output type     : GEOMETRIC cartesian states' : 'Output type     : GEOMETRIC osculating elements')) fail(`${kind} response geometry mismatch`)
  if (!response.result.includes(kind === 'vectors' ? 'Geometric state vectors have NO corrections or aberrations applied.' : 'Geometric osculating elements have NO corrections or aberrations applied.')) fail(`${kind} response correction policy mismatch`)
}

function responseHeader(response) {
  const match = response.result.match(/^Ephemeris \/ API_USER ([^\n]+)$/m)
  if (!match) fail('Horizons response timestamp header missing')
  return match[1].trim()
}

function parseCsvRows(response, kind) {
  const body = response.result.split('$$SOE\n')[1]?.split('\n$$EOE')[0]
  if (!body) fail(`${kind} response has no $$SOE/$$EOE block`)
  return body.split('\n').filter(Boolean).map((line) => {
    const fields = line.split(',').map((field) => field.trim())
    if (fields.length < 8) fail(`${kind} CSV row has too few fields: ${line}`)
    const numericFields = kind === 'vectors' ? [fields[0], ...fields.slice(2, 8)] : [fields[0], ...fields.slice(2, 6)]
    const numbers = numericFields.map(Number)
    if (numbers.some((value) => !finite(value))) fail(`${kind} CSV row has non-numeric value: ${line}`)
    if (kind === 'vectors') {
      return { jdTdb: numbers[0], stateJ2000KmKmPerSec: numbers.slice(1, 7) }
    }
    return { jdTdb: numbers[0], longitudeAscendingNodeJ2000Degrees: numbers[4] }
  })
}

function deriveJ2000EclipticNodeLongitude(state) {
  const c = Math.cos(IAU76_OBLIQUITY_RADIANS)
  const s = Math.sin(IAU76_OBLIQUITY_RADIANS)
  const ecliptic = [
    state[0], c * state[1] + s * state[2], -s * state[1] + c * state[2],
    state[3], c * state[4] + s * state[5], -s * state[4] + c * state[5],
  ]
  const h = [
    ecliptic[1] * ecliptic[5] - ecliptic[2] * ecliptic[4],
    ecliptic[2] * ecliptic[3] - ecliptic[0] * ecliptic[5],
    ecliptic[0] * ecliptic[4] - ecliptic[1] * ecliptic[3],
  ]
  return normalizeDegrees360(Math.atan2(h[0], -h[1]) * 180 / Math.PI)
}

function runErfa(rows) {
  const source = String.raw`
import importlib.metadata
import json
import sys
import erfa

input_rows = json.loads(sys.stdin.read())
out_rows = []
for row in input_rows:
    position_au, velocity_au_per_day = erfa.moon98(2451545.0, row['jdTt'] - 2451545.0)
    scale = 149597870.7
    out_rows.append({
        'sampleId': row['sampleId'],
        'stateJ2000KmKmPerSec': [
            position_au[0] * scale,
            position_au[1] * scale,
            position_au[2] * scale,
            velocity_au_per_day[0] * scale / 86400.0,
            velocity_au_per_day[1] * scale / 86400.0,
            velocity_au_per_day[2] * scale / 86400.0,
        ],
    })
print(json.dumps({
    'runtime': {
        'python': sys.version.split()[0],
        'pyerfaVersion': importlib.metadata.version('pyerfa'),
        'module': 'erfa.moon98',
    },
    'rows': out_rows,
}))
`
  const result = spawnSync('python3', ['-c', source], { input: JSON.stringify(rows), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0) fail(`pyerfa moon98 failed: ${result.stderr || result.stdout}`)
  const parsed = JSON.parse(result.stdout)
  if (parsed.runtime?.pyerfaVersion !== '2.0.1.5' || parsed.runtime?.module !== 'erfa.moon98') fail(`unexpected pyerfa runtime: ${JSON.stringify(parsed.runtime)}`)
  if (!Array.isArray(parsed.rows) || parsed.rows.length !== rows.length) fail('pyerfa row count mismatch')
  return parsed
}

const inputArtifact = loadArtifact(inputPath, 'astrology-true-node-independent-frontier-v0')
const frameArtifact = loadArtifact(framePath, 'astrology-true-node-frame-diagnostic-v1')
const inputRowsById = new Map(inputArtifact.comparison.rows.map((row) => [row.sampleId, row]))
const frameRowsById = new Map(frameArtifact.comparison.rows.map((row) => [row.sampleId, row]))
const selectedRows = sampleIndices.map((index) => {
  const sampleId = `true-node-${String(index).padStart(5, '0')}`
  const row = inputRowsById.get(sampleId)
  const frameRow = frameRowsById.get(sampleId)
  if (!row || !frameRow || row.index !== index || frameRow.index !== index) fail(`missing inherited row ${sampleId}`)
  return { ...row, swissMeanEquinoxTrueNodeLongitudeDegrees: frameRow.swissMeanEquinoxTrueNodeLongitudeDegrees }
})
const tlist = selectedRows.map((row) => row.jdTdb)
const vectorsRaw = loadRawResponse(vectorRawPath, 'DE405_TRUE_NODE_HORIZONS_VECTORS_RAW_INPUT', requestParams('vectors', tlist))
const elementsRaw = loadRawResponse(elementsRawPath, 'DE405_TRUE_NODE_HORIZONS_ELEMENTS_RAW_INPUT', requestParams('elements', tlist))
validateHorizonsResponse(vectorsRaw.response, 'vectors')
validateHorizonsResponse(elementsRaw.response, 'elements')
const vectorRows = parseCsvRows(vectorsRaw.response, 'vectors')
const elementRows = parseCsvRows(elementsRaw.response, 'elements')
if (vectorRows.length !== selectedRows.length || elementRows.length !== selectedRows.length) fail('Horizons row count mismatch')
for (const [index, row] of selectedRows.entries()) {
  if (Math.abs(vectorRows[index].jdTdb - row.jdTdb) > 1e-9 || Math.abs(elementRows[index].jdTdb - row.jdTdb) > 1e-9) fail(`Horizons epoch mismatch at ${row.sampleId}`)
}

const erfa = runErfa(selectedRows.map((row) => ({ sampleId: row.sampleId, jdTt: row.jdTt })))
const erfaStateById = new Map(erfa.rows.map((row) => [row.sampleId, row.stateJ2000KmKmPerSec]))
const rows = selectedRows.map((inputRow, index) => {
  const vectorRow = vectorRows[index]
  const elementRow = elementRows[index]
  const erfaState = erfaStateById.get(inputRow.sampleId)
  const horizonsDate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: vectorRow.stateJ2000KmKmPerSec, jdTt: inputRow.jdTt })
  const erfaDate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: erfaState, jdTt: inputRow.jdTt })
  if (horizonsDate.availability !== 'available' || erfaDate.availability !== 'available') fail(`node derivation failed at ${inputRow.sampleId}`)
  const horizonsJ2000 = deriveJ2000EclipticNodeLongitude(vectorRow.stateJ2000KmKmPerSec)
  return {
    index: inputRow.index,
    sampleId: inputRow.sampleId,
    jdTdb: inputRow.jdTdb,
    jdTt: inputRow.jdTt,
    jdUt: inputRow.jdUt,
    localDe405CandidateLongitudeDegrees: inputRow.candidateLongitudeDegrees,
    swissMeanEquinoxTrueNodeLongitudeDegrees: inputRow.swissMeanEquinoxTrueNodeLongitudeDegrees,
    horizonsVectorStateJ2000KmKmPerSec: vectorRow.stateJ2000KmKmPerSec,
    horizonsVectorJ2000EclipticNodeLongitudeDegrees: horizonsJ2000,
    horizonsElementJ2000EclipticAscendingNodeLongitudeDegrees: elementRow.longitudeAscendingNodeJ2000Degrees,
    horizonsElementVectorDifferenceArcseconds: absoluteArcseconds(horizonsJ2000, elementRow.longitudeAscendingNodeJ2000Degrees),
    horizonsDateMeanEclipticCandidateLongitudeDegrees: horizonsDate.longitudeDegrees,
    erfaMoon98StateJ2000KmKmPerSec: erfaState,
    erfaMoon98DateMeanEclipticCandidateLongitudeDegrees: erfaDate.longitudeDegrees,
    localDe405VsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(inputRow.candidateLongitudeDegrees, inputRow.swissMeanEquinoxTrueNodeLongitudeDegrees),
    horizonsDateVsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(horizonsDate.longitudeDegrees, inputRow.swissMeanEquinoxTrueNodeLongitudeDegrees),
    erfaMoon98VsSwissAbsoluteDifferenceArcseconds: absoluteArcseconds(erfaDate.longitudeDegrees, inputRow.swissMeanEquinoxTrueNodeLongitudeDegrees),
    horizonsDateVsLocalDe405AbsoluteDifferenceArcseconds: absoluteArcseconds(horizonsDate.longitudeDegrees, inputRow.candidateLongitudeDegrees),
  }
})

const swissFiles = frameArtifact.sourceIdentity.swissReference.files.map((file) => ({ ...file }))
for (const file of swissFiles) {
  const path = resolve(root, file.path)
  if (!existsSync(path) || !lstatSync(path).isFile() || sha256File(path) !== file.sha256) fail(`Swiss artifact hash drift: ${file.path}`)
}

const payload = {
  schemaVersion: 'astrology-true-node-horizons-erfa-frontier-v1',
  availability: 'available',
  purpose: 'research_only',
  evidenceBoundary: {
    directPrimarySourceObservation: 'The preserved raw NASA/JPL Horizons API responses are direct observations of geometric geocentric Moon vectors and osculating elements from the public API.',
    sameFamilyCorroboration: 'Horizons identifies the response source as DE441. The local candidate uses DE405, so the service path is distinct but the JPL DE family is not independent of the local ephemeris lineage.',
    independentAnalyticCorroboration: 'ERFA/SOFA moon98 is a separate analytic implementation with a separate BSD-licensed code path; its documented accuracy is insufficient for True Node authority and it is admitted only as a negative control.',
    deterministicDerivation: 'Node longitudes are derived from the raw state vectors by the existing cross-product candidate and an explicit J2000 ecliptic rotation; the Horizons OM/vector check is a raw-output consistency diagnostic.',
    inference: 'The Horizons corpus tests whether a distinct JPL service path materially changes the local residual, while the source-defined Swiss default precession model remains a separate frame hypothesis.',
    unresolved: 'No independent high-precision semantic True Node authority has been established. TLS verification was explicitly bypassed for this read-only public request, exact Swiss source checkout/license packaging remains open, and no production or readiness decision is authorized.',
  },
  inputArtifacts: {
    de405Candidate: { path: relative(root, inputPath), sha256: sha256Bytes(readFileSync(inputPath)), schemaVersion: inputArtifact.schemaVersion, role: 'inherited_candidate_only' },
    swissFrameDiagnostic: { path: relative(root, framePath), sha256: sha256Bytes(readFileSync(framePath)), schemaVersion: frameArtifact.schemaVersion, role: 'mean_equinox_no_nutation_reference_only' },
  },
  corpus: {
    rowCount: rows.length,
    sampleIndices,
    coverage: 'eight deterministic points spanning the inherited 1900-2101 DE405 service interval; not a full raw-oracle sweep',
    epochs: 'Horizons vectors/elements requested at JDTDB; local date-frame transforms use the inherited paired TT value; no historical UTC conversion is asserted',
  },
  sourceIdentity: {
    horizons: {
      provider: 'NASA/JPL Solar System Dynamics Horizons API',
      apiUrl: horizonsApiUrl,
      apiSignature: { ...vectorsRaw.response.signature },
      rawResponseHeaders: { vectors: responseHeader(vectorsRaw.response), elements: responseHeader(elementsRaw.response) },
      target: 'Moon (301)',
      center: 'Earth (399)',
      sourceFamily: 'DE441',
      rawFiles: [
        { path: relative(root, vectorRawPath), kind: 'VECTORS', sizeBytes: vectorsRaw.bytes.byteLength, sha256: sha256Bytes(vectorsRaw.bytes) },
        { path: relative(root, elementsRawPath), kind: 'ELEMENTS', sizeBytes: elementsRaw.bytes.byteLength, sha256: sha256Bytes(elementsRaw.bytes) },
      ],
      vectorQuery: requestParams('vectors', tlist),
      elementQuery: requestParams('elements', tlist),
      outputSemantics: { vectors: 'geometric ICRF Cartesian state, JDTDB, km and km/s, VEC_CORR=NONE', elements: 'geometric osculating elements, JDTDB, ecliptic of J2000.0, OM=longitude of ascending node, no corrections' },
      transport: { method: 'curl', tlsVerification: 'disabled_explicitly_for_local_certificate_chain', credentialUsed: false, rawResponseAdmission: 'direct_bytes_with_transport_limitation' },
      role: 'same_family_jpl_service_corroboration_not_independent_authority',
    },
    swissReference: { engineVersion: frameArtifact.sourceIdentity.swissReference.engineVersion, files: swissFiles, target: 'SE_TRUE_NODE=11', effectiveFlags: 322, frame: 'mean equinox of date, no nutation, speed requested', role: 'comparison_reference_only' },
    swissSource: { repository: 'https://github.com/aloistr/swisseph', commit: '59ac051b5a5812c684973ca0fcedb1c8c3e9c5dc', officialSourceInspection: 'lunar_osc_elem, swi_plan_for_osc_elem, swi_ldp_peps and default Vondrak-2011 model were read locally; source checkout is not copied into this repository artifact' },
    erfa: { project: 'ERFA / PyERFA', sourceRepository: 'https://github.com/liberfa/erfa', sourceFile: 'src/moon98.c', officialSourceUrl: 'https://raw.githubusercontent.com/liberfa/erfa/master/src/moon98.c', license: 'BSD-3-Clause', runtime: erfa.runtime, role: 'independent_analytic_negative_control_not_high_precision_authority' },
    publicDocumentation: [
      { title: 'Swiss Ephemeris Documentation: Lunar and Planetary Nodes and Apsides', provider: 'Astrodienst / Swiss Ephemeris', url: 'https://www.astro.com/swisseph-download/doc/swisseph.pdf', accessDate, locator: 'section 3, pp. 18-19', admission: 'definition_corroboration_only' },
      { title: 'Swiss Ephemeris Programmer\'s Manual', provider: 'Astrodienst / Swiss Ephemeris', url: 'https://www.astro.com/swisseph/swephprg.pdf', accessDate, locator: 'SEFLG_NONUT and SE_TRUE_NODE tables', admission: 'convention_metadata_only' },
      { title: 'NASA/JPL Horizons API documentation', provider: 'NASA/JPL Solar System Dynamics', url: 'https://ssd-api.jpl.nasa.gov/doc/horizons.html', accessDate, locator: 'EPHEM_TYPE, REF_PLANE, TIME_TYPE, VEC_CORR and VEC_TABLE parameters', admission: 'raw_oracle_interface_provenance' },
      { title: 'ERFA moon98 source', provider: 'IAU SOFA-derived ERFA', url: 'https://raw.githubusercontent.com/liberfa/erfa/master/src/moon98.c', accessDate, locator: 'eraMoon98 documentation and implementation header', admission: 'independent_algorithm_accuracy_boundary' },
    ],
  },
  oracleAssessment: {
    horizons: { independence: 'same_family_corroboration', positive: ['distinct public service endpoint', 'raw state and element output', 'DE441 versus local DE405'], limitingFacts: ['same JPL DE ephemeris family', 'not a direct Swiss-equivalent True Node field', 'transport certificate verification unverified'] },
    erfaMoon98: { independence: 'independent_analytic_negative_control', positive: ['separate ERFA/SOFA implementation and data model', 'does not call Swiss or local DE405'], limitingFacts: ['official source documents arcsecond-to-tens-of-arcseconds Moon accuracy', 'not a canonical True Node output', 'not suitable for semantic authority'] },
    swiss: { independence: 'comparison_reference_only', limitingFacts: ['the local result is the quantity being explained, not an independent oracle'] },
  },
  hypotheses: [
    { id: 'node-definition-algebra', status: 'bounded_supported', observation: 'Swiss lunar_osc_elem uses the geocentric Moon state and tangent/ecliptic-plane intersection; this is algebraically direction-equivalent to k x (r x v) when the z velocity is nonzero.', admission: 'source_inspection_and_deterministic_derivation_not_semantic_identity' },
    { id: 'tt-ut', status: 'insufficient', observation: 'The inherited argument-shift diagnostic changes Swiss by at most 0.687765504426352 arcsec, below the inherited 18.635712528976 arcsec maximum.', admission: 'local_diagnostic_only' },
    { id: 'nutation-and-equinox', status: 'major_contributor', observation: 'The inherited 7342-row mean-equinox/no-nutation comparison reduces the maximum from 18.635712528976 to 1.8031521231023362 arcsec.', admission: 'local_diagnostic_only' },
    { id: 'swiss-default-vondrak-2011', status: 'supported_as_remaining_frame_hypothesis', observation: 'Pinned Swiss source inspection shows the default Vondrak-2011 precession/obliquity path; a bounded eight-row DE441 state experiment materially lowers several IAU-2006 residuals but does not uniformly eliminate them.', admission: 'direct_source_inspection_plus_local_experiment_not_authority' },
    { id: 'light-time', status: 'insufficient_alone', observation: 'Swiss source applies a Moon light-time correction unless SEFLG_TRUEPOS is set; its source comment bounds the node effect at milliarcsecond scale, so it cannot alone explain the former multi-arcsecond frame residual.', admission: 'official_source_inspection' },
  ],
  comparison: {
    numericStatus: 'diagnostic_only_no_tolerance_pass',
    rows,
    summaries: {
      localDe405VsSwiss: summarize(rows, 'localDe405VsSwissAbsoluteDifferenceArcseconds'),
      horizonsDateVsSwiss: summarize(rows, 'horizonsDateVsSwissAbsoluteDifferenceArcseconds'),
      erfaMoon98VsSwiss: summarize(rows, 'erfaMoon98VsSwissAbsoluteDifferenceArcseconds'),
      horizonsDateVsLocalDe405: summarize(rows, 'horizonsDateVsLocalDe405AbsoluteDifferenceArcseconds'),
      horizonsElementVectorConsistency: summarize(rows, 'horizonsElementVectorDifferenceArcseconds'),
    },
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
    generatedWithoutCredentials: true,
    generatedFromPinnedRawInputsWhenProvided: Boolean(process.env.DE405_TRUE_NODE_HORIZONS_VECTORS_RAW_INPUT || process.env.DE405_TRUE_NODE_HORIZONS_ELEMENTS_RAW_INPUT),
  },
}

const output = { ...payload, payloadCanonicalSha256: canonicalSha256(payload) }
mkdirSync(artifactDirectory, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, payloadCanonicalSha256: output.payloadCanonicalSha256, rowCount: rows.length, summaries: output.comparison.summaries }, null, 2))
