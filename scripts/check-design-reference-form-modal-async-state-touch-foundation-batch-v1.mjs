import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
  inspectFileByteIdentity,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_ID,
  BASELINE_HEAD,
  COMPANIONS,
  DEFAULT_DIRECTORY,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  ROOT,
  VERDICT,
  buildFoundationArtifact,
} from './materialize-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const add = (errors, condition, message) => { if (!condition) errors.push(message) }
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function jsonPointer(value, pointer) {
  if (!pointer.startsWith('#/')) return undefined
  return pointer.slice(2).split('/').map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~')).reduce((current, part) => current?.[part], value)
}

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) return null
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1 }
}

function verifyReference(errors, reference, generationBaseHead) {
  const path = join(ROOT, reference?.path || '')
  if (!reference?.kind || !reference?.path || !existsSync(path)) {
    errors.push(`invalid_reference:${reference?.path || 'missing'}`)
    return
  }
  if (reference.kind === 'working_tree_text') {
    const identity = inspectFileByteIdentity(ROOT, reference.path, reference.byteSha256, {
      generationBaseHead,
      descendantHead: resolveHead(),
    })
    const matches = identity.currentMatches || identity.historicalMatches || identity.descendantMatches
    add(errors, matches, `reference_hash:${reference.path}`)
    add(errors, matches, `reference_length:${reference.path}`)
    add(errors, matches, `reference_quote:${reference.path}`)
  } else if (reference.kind === 'historical_artifact_json') {
    const bytes = readFileSync(path)
    add(errors, bytes.byteLength === reference.byteLength, `reference_length:${reference.path}`)
    add(errors, sha256(bytes) === reference.byteSha256, `reference_hash:${reference.path}`)
    let value
    try { value = JSON.parse(bytes.toString('utf8')) } catch { errors.push(`reference_json:${reference.path}`); return }
    for (const assertion of reference.assertions || []) {
      add(errors, JSON.stringify(jsonPointer(value, assertion.path)) === JSON.stringify(assertion.equals), `reference_assertion:${reference.path}:${assertion.path}`)
    }
  } else {
    errors.push(`reference_kind:${reference.path}`)
  }
}

function resolveHead() {
  try {
    return process.env.GITHUB_SHA || execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function verifyReferences(errors, value, generationBaseHead) {
  if (Array.isArray(value)) return value.forEach((child) => verifyReferences(errors, child, generationBaseHead))
  if (!value || typeof value !== 'object') return
  if (value.kind === 'working_tree_text' || value.kind === 'historical_artifact_json') verifyReference(errors, value, generationBaseHead)
  Object.values(value).forEach((child) => verifyReferences(errors, child, generationBaseHead))
}

function verifyCompanions(errors, artifact, directory) {
  const map = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'provenance-lineage.json': artifact.provenanceLineage,
    'frontier-decision-ledger.json': artifact.frontierDecisionLedger,
    'implementation-observation-ledger.json': artifact.implementationObservationLedger,
    'validation-blocker-ledger.json': artifact.validationBlockerLedger,
  }
  for (const name of COMPANIONS) {
    const path = join(directory, name)
    if (!existsSync(path)) { errors.push(`missing_companion:${name}`); continue }
    add(errors, readFileSync(path, 'utf8') === canonicalIdentityJson(map[name]), `companion_mismatch:${name}`)
  }
}

function verifyIntegrity(errors, directory) {
  const path = join(directory, 'complete.json.integrity.json')
  if (!existsSync(path)) { errors.push('missing_integrity'); return }
  let integrity
  try { integrity = readJson(path) } catch { errors.push('invalid_integrity'); return }
  add(errors, integrity.artifactId === ARTIFACT_ID, 'integrity_artifact_id')
  const expectedNames = ['complete.json', ...COMPANIONS]
  add(errors, Object.keys(integrity.files || {}).length === expectedNames.length, 'integrity_file_set')
  for (const name of expectedNames) {
    const filePath = join(directory, name)
    const key = `artifacts/${ARTIFACT_ID}/${name}`
    if (!existsSync(filePath)) { errors.push(`integrity_missing:${name}`); continue }
    const bytes = readFileSync(filePath)
    add(errors, integrity.files?.[key]?.byteLength === bytes.byteLength, `integrity_length:${name}`)
    add(errors, integrity.files?.[key]?.byteSha256 === sha256(bytes), `integrity_hash:${name}`)
  }
}

export function checkArtifact(artifact, directory = DEFAULT_DIRECTORY) {
  const errors = []
  add(errors, artifact?.schemaVersion === ARTIFACT_ID, 'schema')
  add(errors, artifact?.verdict === VERDICT, 'verdict')
  add(errors, artifact?.repository?.branch === 'main', 'branch')
  add(errors, artifact?.repository?.baselineHead === BASELINE_HEAD, 'baseline_head')
  add(errors, artifact?.scope?.businessDataAuthApiMutation === false, 'scope_business')
  add(errors, artifact?.scope?.dependencyMutation === false, 'scope_dependency')
  add(errors, artifact?.scope?.frozenArtifactRewrite === false, 'scope_frozen')
  add(errors, artifact?.scope?.stagingCommitPushDeployRemoteMutation === false, 'scope_remote')
  add(errors, artifact?.scope?.preExistingChangeBoundary?.includes('-.jpg'), 'scope_jpg')

  const basis = checkHistoricalRepositoryBasis(ROOT, artifact?.artifactIdentity?.generation?.baseHead)
  add(errors, basis.errors.length === 0, `historical_basis:${basis.errors.join(',')}`)
  add(errors, checkArtifactIdentity(artifact, {
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
    allowDescendantInput: true,
  }).length === 0, 'artifact_identity')

  const expectedDecisions = {
    'FRONTIER-FORM-NATIVE-LABELS': 'fix',
    'FRONTIER-MODAL-DIALOG-NAMES': 'fix',
    'FRONTIER-MODAL-FOCUS-LIFECYCLE': 'hold',
    'FRONTIER-BUSY-DUPLICATE-ACTIONS': 'fix',
    'FRONTIER-ASYNC-STATE-SEPARATION': 'fix',
    'FRONTIER-TOUCH-44': 'fix',
    'FRONTIER-VALIDATION-ASSOCIATION': 'fix',
    'FRONTIER-HISTORICAL-SOURCE-REF-DESCENDANT': 'fix',
    'FRONTIER-NEW-MOTION': 'reject',
    'FRONTIER-LEAD-SHEET-DESTRUCTIVE-ASYNC': 'hold',
    'FRONTIER-INACTIVE-FORTUNE-ROUTE': 'not_applicable',
    'FRONTIER-LAZY-ROUTE-ERROR-BOUNDARY': 'hold',
  }
  const frontiers = artifact?.frontierDecisionLedger?.frontiers || []
  add(errors, frontiers.length === Object.keys(expectedDecisions).length, 'frontier_count')
  add(errors, JSON.stringify(Object.fromEntries(frontiers.map((item) => [item.frontierId, item.decision]))) === JSON.stringify(expectedDecisions), 'frontier_decisions')
  add(errors, artifact?.provenanceLineage?.emilSiblingCorpus?.independentAuthorityCount === 1, 'emil_independent_count')
  add(errors, artifact?.provenanceLineage?.emilSiblingCorpus?.installationIsAdoption === false, 'emil_adoption_boundary')
  add(errors, artifact?.provenanceLineage?.historicalBytesPreserved === true, 'historical_bytes')

  const validations = artifact?.validationBlockerLedger?.validations || []
  add(errors, validations.find((item) => item.id === 'VAL-FULL-NON-PDF-AFTER-REMEDIATION')?.failureCount === 0, 'non_pdf_failure_count')
  add(errors, validations.find((item) => item.id === 'VAL-FULL-PDF-SOURCE')?.expectedFailureCount === 35, 'pdf_failure_count')
  add(errors, validations.find((item) => item.id === 'VAL-BROWSER-KEYBOARD-SCREENREADER')?.status === 'unverified', 'runtime_boundary')
  add(errors, artifact?.nonGeneralization?.modality?.includes('not proof'), 'modality_boundary')
  add(errors, artifact?.nonGeneralization?.motion?.includes('No new motion'), 'motion_boundary')
  add(errors, artifact?.nonGeneralization?.touch?.includes('Softie house target'), 'touch_boundary')

  verifyReferences(errors, artifact, artifact?.artifactIdentity?.generation?.baseHead)
  verifyCompanions(errors, artifact, directory)
  verifyIntegrity(errors, directory)
  const completePath = join(directory, 'complete.json')
  if (existsSync(completePath)) {
    add(errors, readFileSync(completePath, 'utf8') === canonicalIdentityJson(artifact), 'complete_not_canonical')
  }
  return [...new Set(errors)]
}

export async function checkMaterialized(directory = DEFAULT_DIRECTORY) {
  const completePath = join(directory, 'complete.json')
  if (!existsSync(completePath)) return ['complete_missing']
  let artifact
  try { artifact = readJson(completePath) } catch { return ['complete_invalid_json'] }
  const errors = checkArtifact(artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0 && resolveHead() === BASELINE_HEAD) {
    add(errors, canonicalIdentityJson(artifact) === canonicalIdentityJson(buildFoundationArtifact()), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
