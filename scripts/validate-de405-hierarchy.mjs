#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const ALLOWED_STATUSES = ['passed', 'failed', 'needs_calibration', 'not_evaluated']
const EXPECTED_SCHEMA_VERSION = 1
const LEGACY_UNVERIFIED_STATUSES = new Set(['legacy_unverified', 'historical_evidence', 'provenance_incomplete'])
const REQUIRED_BASELINE_FIELDS = [
  'sampleCount', 'statusMismatch', 'positionComponentKm', 'positionNormKm',
  'velocityComponentKmPerSec', 'velocityNormKmPerSec', 'worstEpochJd',
  'worstPositionResidualKm', 'positionNormSegmentMaxKm', 'fittedDriftKmPerDay',
  'segmentBoundaryDiscontinuityDetected',
]

function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function hasValue(value) { return value !== null && value !== undefined && value !== '' }
function issue(code, pathName, message) { return { code, path: pathName, message } }
function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b) }
function finiteNumber(value) { return typeof value === 'number' && Number.isFinite(value) }

function validateManifestShape(manifest) {
  const issues = []
  if (!isObject(manifest) || manifest.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    issues.push(issue('schema_version_mismatch', 'schemaVersion', 'manifest schemaVersion must be 1'))
    return issues
  }
  if (!isObject(manifest.artifacts) || !isObject(manifest.artifacts.jplDe405Binary) || !isObject(manifest.artifacts.naifDe405Spk)) {
    issues.push(issue('missing_required_field', 'artifacts', 'both DE405 artifacts are required'))
  } else {
    for (const name of ['jplDe405Binary', 'naifDe405Spk']) {
      for (const field of ['sha256', 'sizeBytes']) if (!hasValue(manifest.artifacts[name][field])) issues.push(issue('missing_verified_fixture_value', `artifacts.${name}.${field}`, 'verified artifact value is required'))
    }
  }
  if (!isObject(manifest.timestamps)) issues.push(issue('missing_required_field', 'timestamps', 'timestamps contract is required'))
  else for (const field of ['sha256', 'sampleCount']) if (!hasValue(manifest.timestamps[field])) issues.push(issue('missing_verified_fixture_value', `timestamps.${field}`, 'verified timestamp value is required'))
  if (!isObject(manifest.officialReader)) issues.push(issue('missing_required_field', 'officialReader', 'official reader contract is required'))
  else for (const field of ['testRowCount', 'failureCount', 'toleranceAu', 'maxResidualAu', 'o0OutputSha256', 'o2OutputSha256']) if (!hasValue(manifest.officialReader[field])) issues.push(issue('missing_verified_fixture_value', `officialReader.${field}`, 'verified official-reader value is required'))
  for (const field of ['artifactIntegrityEvidence', 'productionEquivalence', 'crossReferenceStructure']) if (!isObject(manifest[field])) issues.push(issue('missing_required_field', field, `${field} evidence is required`))
  return issues
}

function compareArtifactEvidence(manifest) {
  const issues = []
  const observed = manifest.artifactIntegrityEvidence
  if (!isObject(observed)) return [issue('missing_required_field', 'artifactIntegrityEvidence', 'artifact evidence is required')]
  for (const name of ['jplDe405Binary', 'naifDe405Spk']) {
    const expected = manifest.artifacts[name]
    const actual = observed[name]
    if (!isObject(actual)) { issues.push(issue('missing_required_field', `artifactIntegrityEvidence.${name}`, 'observed artifact evidence is required')); continue }
    if (actual.sha256 !== expected.sha256) issues.push(issue('hash_mismatch', `artifacts.${name}.sha256`, 'artifact SHA-256 differs from manifest'))
    if (actual.sizeBytes !== expected.sizeBytes) issues.push(issue('size_mismatch', `artifacts.${name}.sizeBytes`, 'artifact size differs from manifest'))
    if (expected.md5 && actual.md5 !== expected.md5) issues.push(issue('hash_mismatch', `artifacts.${name}.md5`, 'artifact MD5 differs from manifest'))
  }
  for (const [field, expected] of Object.entries(manifest.timestamps)) {
    if (field === 'coverage') continue
    if (observed.timestamps?.[field] !== expected) issues.push(issue(field === 'sha256' ? 'hash_mismatch' : 'count_mismatch', `timestamps.${field}`, 'timestamp evidence differs from manifest'))
  }
  for (const field of ['coverage', 'metadata', 'fixtureSampleCount']) if (!hasValue(observed[field])) issues.push(issue('missing_required_field', `artifactIntegrityEvidence.${field}`, 'artifact integrity evidence is required'))
  if (manifest.timestamps.coverage && !sameJson(observed.coverage, manifest.timestamps.coverage)) issues.push(issue('coverage_mismatch', 'timestamps.coverage', 'coverage differs from manifest'))
  if (observed.fixtureSampleCount !== manifest.timestamps.sampleCount) issues.push(issue('count_mismatch', 'fixtureSampleCount', 'fixture sample count differs from timestamp sample count'))
  return issues
}

function gateA(manifest) { const issues = [...validateManifestShape(manifest), ...compareArtifactEvidence(manifest)]; return { status: issues.length ? 'failed' : 'passed', issues } }

function provenanceGate(manifest) {
  const issues = []
  if (!LEGACY_UNVERIFIED_STATUSES.has(manifest.fixtureStatus)) issues.push(issue('invalid_fixture_status', 'fixtureStatus', 'legacy fixture must remain explicitly unverified'))
  if (manifest.canonical !== false) issues.push(issue('legacy_marked_canonical', 'canonical', 'legacy fixture cannot be canonical'))
  if (manifest.legacyDisposition !== 'historical_evidence') issues.push(issue('invalid_legacy_disposition', 'legacyDisposition', 'legacy fixture disposition must be historical_evidence'))
  return { status: issues.length ? 'failed' : 'needs_verification', issues: issues.length ? issues : [issue('provenance_incomplete', 'fixtureStatus', 'legacy evidence is not eligible for verified or canonical use')] }
}

function gateB(manifest) {
  const issues = []
  const r = manifest.officialReader
  const e = manifest.officialReaderEvidence
  if (!isObject(e)) return { status: 'failed', issues: [issue('missing_required_field', 'officialReaderEvidence', 'versioned official-reader evidence is required')] }
  for (const field of ['testRowCount', 'failureCount', 'toleranceAu', 'maxResidualAu', 'o0OutputSha256', 'o2OutputSha256']) if (!hasValue(e[field])) issues.push(issue('missing_verified_fixture_value', `officialReaderEvidence.${field}`, 'evidence value is required'))
  if (e.testRowCount !== r.testRowCount) issues.push(issue('count_mismatch', 'officialReader.testRowCount', 'testpo row count differs'))
  if (e.failureCount !== r.failureCount || r.failureCount !== 0) issues.push(issue('failure_count', 'officialReader.failureCount', 'official reader failures must be zero'))
  if (e.toleranceAu !== r.toleranceAu || r.toleranceAu !== 1e-13) issues.push(issue('tolerance_mismatch', 'officialReader.toleranceAu', 'official reader tolerance differs'))
  if (e.maxResidualAu !== r.maxResidualAu || r.maxResidualAu !== 5.3291e-14) issues.push(issue('residual_mismatch', 'officialReader.maxResidualAu', 'official reader max residual differs'))
  if (e.o0OutputSha256 !== r.o0OutputSha256 || e.o2OutputSha256 !== r.o2OutputSha256 || r.o0OutputSha256 !== r.o2OutputSha256) issues.push(issue('output_hash_mismatch', 'officialReader', 'O0/O2 output hashes must match'))
  return { status: issues.length ? 'failed' : 'passed', issues }
}

function gateC(manifest) {
  const e = manifest.productionEquivalence
  if (!isObject(e)) return { status: 'failed', issues: [issue('missing_required_field', 'productionEquivalence', 'production equivalence evidence is required')] }
  const checks = { positionComponentBitIdentical: true, velocityComponentBitIdentical: true, statusMismatch: 0, sampleCount: manifest.timestamps?.sampleCount, timestampSha256: manifest.timestamps?.sha256, coverage: manifest.timestamps?.coverage }
  const issues = []
  for (const [field, expected] of Object.entries(checks)) {
    if (!hasValue(e[field])) issues.push(issue('missing_required_field', `productionEquivalence.${field}`, 'equivalence evidence is required'))
    else if (!sameJson(e[field], expected)) issues.push(issue(field === 'statusMismatch' ? 'status_mismatch' : 'equivalence_mismatch', `productionEquivalence.${field}`, 'production equivalence contract differs'))
  }
  return { status: issues.length ? 'failed' : 'passed', issues }
}

function gateD(manifest, baseline) {
  const e = manifest.crossReferenceStructure
  const issues = []
  if (!isObject(e)) issues.push(issue('missing_required_field', 'crossReferenceStructure', 'cross-reference structure evidence is required'))
  if (!isObject(baseline) || baseline.schemaVersion !== EXPECTED_SCHEMA_VERSION) issues.push(issue('schema_version_mismatch', 'baseline.schemaVersion', 'baseline schemaVersion must be 1'))
  else {
    for (const field of REQUIRED_BASELINE_FIELDS) if (!(field in baseline)) issues.push(issue('missing_required_field', `baseline.${field}`, 'baseline field is required'))
    if (baseline.sampleCount !== manifest.timestamps?.sampleCount) issues.push(issue('count_mismatch', 'baseline.sampleCount', 'baseline sample count differs'))
    if (baseline.statusMismatch !== 0) issues.push(issue('status_mismatch', 'baseline.statusMismatch', 'cross-reference status mismatch must be zero'))
    for (const [metric, values] of Object.entries({ positionComponentKm: baseline.positionComponentKm, positionNormKm: baseline.positionNormKm, velocityComponentKmPerSec: baseline.velocityComponentKmPerSec, velocityNormKmPerSec: baseline.velocityNormKmPerSec })) {
      if (!isObject(values) || !['p95', 'p99', 'max'].every((field) => finiteNumber(values[field]))) issues.push(issue('non_finite_metric', `baseline.${metric}`, 'p95, p99, and max must be finite numbers'))
      else if (!(values.p95 <= values.p99 && values.p99 <= values.max)) issues.push(issue('percentile_order', `baseline.${metric}`, 'p95 must be <= p99 <= max'))
    }
    if (isObject(baseline.positionComponentKm) && isObject(baseline.positionNormKm) && finiteNumber(baseline.positionComponentKm.max) && finiteNumber(baseline.positionNormKm.max) && baseline.positionComponentKm.max > baseline.positionNormKm.max * Math.sqrt(3) + Number.EPSILON) issues.push(issue('norm_relation', 'baseline.positionComponentKm.max', 'component max is inconsistent with vector norm max'))
    if (isObject(baseline.positionNormSegmentMaxKm) && ['start', 'middle', 'end'].some((field) => !finiteNumber(baseline.positionNormSegmentMaxKm[field]))) issues.push(issue('non_finite_metric', 'baseline.positionNormSegmentMaxKm', 'start, middle, and end maxima must be finite numbers'))
    if (!finiteNumber(baseline.fittedDriftKmPerDay)) issues.push(issue('non_finite_metric', 'baseline.fittedDriftKmPerDay', 'fitted drift must be finite'))
  }
  if (e) {
    const required = ['artifactSha256', 'timestampSha256', 'sampleCount', 'statusMismatch', 'start', 'middle', 'end', 'fittedDriftKmPerDay', 'adjacentChange', 'segmentBoundaryDiscontinuityDetected', 'worstEpochJd', 'worstPositionResidualKm', 'baselineSchemaVersion']
    for (const field of required) if (!hasValue(e[field])) issues.push(issue('missing_required_field', `crossReferenceStructure.${field}`, 'structural evidence field is required'))
    if (e.artifactSha256 !== manifest.artifacts.naifDe405Spk.sha256 || e.timestampSha256 !== manifest.timestamps.sha256 || e.sampleCount !== manifest.timestamps.sampleCount || e.statusMismatch !== 0 || e.baselineSchemaVersion !== 1) issues.push(issue('identity_mismatch', 'crossReferenceStructure', 'cross-reference identities do not match manifest'))
  }
  return { status: issues.length ? 'failed' : 'passed', issues }
}

export function validateHierarchy(manifest, baseline) {
  const provenance = provenanceGate(manifest)
  const a = gateA(manifest)
  const b = gateB(manifest)
  const c = gateC(manifest)
  const d = gateD(manifest, baseline)
  const numeric = { status: isObject(baseline) && baseline.numericEnvelope ? 'passed' : 'needs_calibration', issues: [] }
  return { schemaVersion: 1, provenance, artifactIntegrity: a, officialReaderValidation: b, productionEquivalence: c, crossReferenceStructure: d, crossReferenceNumericPolicy: numeric }
}

export function exitCodeForResult(result) { return ['provenance', 'artifactIntegrity', 'officialReaderValidation', 'productionEquivalence', 'crossReferenceStructure'].some((gate) => ['failed', 'needs_verification'].includes(result[gate].status)) ? 1 : 0 }

function parseArgs(argv) {
  const args = { json: false, manifest: 'test/fixtures/astrology/de405/manifest.json', baseline: 'test/fixtures/astrology/de405/baseline.json' }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') args.json = true
    else if (argv[i] === '--manifest') args.manifest = argv[++i]
    else if (argv[i] === '--baseline') args.baseline = argv[++i]
    else throw new Error(`unknown argument: ${argv[i]}`)
  }
  return args
}

function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = validateHierarchy(readJson(args.manifest), readJson(args.baseline))
    if (args.json) console.log(JSON.stringify(result, null, 2))
    else {
      for (const [name, gate] of Object.entries(result)) if (name !== 'schemaVersion') console.log(`${gate.status === 'passed' ? 'PASS' : gate.status === 'needs_calibration' ? 'CALIBRATION' : 'FAIL'} ${name}${gate.issues?.length ? ` (${gate.issues.length} issue(s))` : ''}`)
      console.log(`exitCode=${exitCodeForResult(result)}`)
    }
    process.exitCode = exitCodeForResult(result)
  } catch (error) { console.error(`DE405 validation error: ${error.message}`); process.exitCode = 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
