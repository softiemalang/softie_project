import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ARTIFACT_ID,
  BASELINE_HEAD,
  COMPANIONS,
  DEFAULT_DIRECTORY,
  EMIL_REVISION,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  ROOT,
  VERDICT,
  buildCleanupPayload,
} from './materialize-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const add = (errors, condition, message) => { if (!condition) errors.push(message) }
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function gitText(args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
}

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) return null
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1 }
}

function textRefMatches(reference, bytes) {
  if (bytes.byteLength !== reference.byteLength || sha256(bytes) !== reference.byteSha256) return false
  const location = lineLocation(bytes.toString('utf8'), reference.quote)
  return Boolean(location) && location.lineStart === reference.lineStart && location.lineEnd === reference.lineEnd
}

function verifyTextRef(errors, reference, generationBaseHead) {
  if (!reference?.path || !reference?.quote || !['working_tree_text', 'git_commit_text'].includes(reference.kind)) {
    errors.push(`invalid_text_ref:${reference?.path || 'missing'}`)
    return
  }
  const candidates = []
  if (reference.kind === 'git_commit_text') {
    try { candidates.push(gitBytes(reference.commit, reference.path)) } catch {}
  } else {
    try { candidates.push(readFileSync(join(ROOT, reference.path))) } catch {}
    if (generationBaseHead) {
      try { candidates.push(gitBytes(generationBaseHead, reference.path)) } catch {}
      const commits = gitText(['rev-list', '--ancestry-path', `${generationBaseHead}..HEAD`, '--', reference.path])?.split('\n').filter(Boolean) || []
      for (const commit of commits) {
        try { candidates.push(gitBytes(commit, reference.path)) } catch {}
      }
    }
  }
  add(errors, candidates.some((bytes) => textRefMatches(reference, bytes)), `text_snapshot_unverified:${reference.path}`)
}

function jsonPointer(value, pointer) {
  if (!pointer.startsWith('#/')) return undefined
  return pointer.slice(2).split('/').map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~')).reduce((current, part) => current?.[part], value)
}

function verifyHistoricalRef(errors, reference) {
  const path = join(ROOT, reference.path || '')
  if (reference.kind !== 'historical_artifact_json' || !existsSync(path)) {
    errors.push(`invalid_historical_ref:${reference.path || 'missing'}`)
    return
  }
  const bytes = readFileSync(path)
  add(errors, bytes.byteLength === reference.byteLength, `historical_length:${reference.path}`)
  add(errors, sha256(bytes) === reference.byteSha256, `historical_hash:${reference.path}`)
  let value
  try { value = JSON.parse(bytes.toString('utf8')) } catch { errors.push(`historical_json:${reference.path}`); return }
  for (const assertion of reference.assertions || []) {
    add(errors, JSON.stringify(jsonPointer(value, assertion.path)) === JSON.stringify(assertion.equals), `historical_assertion:${reference.path}:${assertion.path}`)
  }
}

function verifyRefs(errors, value, generationBaseHead) {
  if (Array.isArray(value)) return value.forEach((child) => verifyRefs(errors, child, generationBaseHead))
  if (!value || typeof value !== 'object') return
  if (value.kind === 'working_tree_text' || value.kind === 'git_commit_text') verifyTextRef(errors, value, generationBaseHead)
  if (value.kind === 'historical_artifact_json') verifyHistoricalRef(errors, value)
  Object.values(value).forEach((child) => verifyRefs(errors, child, generationBaseHead))
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
  add(errors, integrity.completeArtifactPath === `artifacts/${ARTIFACT_ID}/complete.json`, 'integrity_complete_path')
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

  const corpus = artifact?.provenanceLineage?.emilCorpus
  add(errors, corpus?.revision === EMIL_REVISION, 'emil_revision')
  add(errors, corpus?.independentAuthorityCount === 1, 'emil_independent_count')
  add(errors, corpus?.installationIsAdoption === false, 'emil_installation_boundary')
  add(errors, artifact?.provenanceLineage?.historicalBytesPreserved === true, 'historical_bytes_preserved')

  const expectedDecisions = {
    'FRONTIER-NONSEMANTIC-ACTIONS': 'fix',
    'FRONTIER-FOCUS-VISIBLE': 'fix',
    'FRONTIER-LEGACY-REDUCED-MOTION': 'fix',
    'FRONTIER-TOUCH-KEYBOARD-STATE-SEMANTICS': 'fix',
    'FRONTIER-TRANSITION-PROPERTY-COHERENCE': 'fix',
    'FRONTIER-SCHEDULER-SYNC-TOAST-GLASS': 'fix',
    'FRONTIER-LEGACY-HOVER-GATING': 'fix',
    'FRONTIER-LEAD-SHEET-DENSE-OVERLAYS': 'hold',
  }
  const frontiers = artifact?.frontierDecisionLedger?.frontiers || []
  add(errors, frontiers.length === Object.keys(expectedDecisions).length, 'frontier_count')
  const actualDecisions = Object.fromEntries(frontiers.map((frontier) => [frontier.frontierId, frontier.decision]))
  add(errors, JSON.stringify(actualDecisions) === JSON.stringify(expectedDecisions), 'frontier_decisions')
  add(errors, frontiers.every((frontier) => (frontier.evidence?.product_device_evidence || []).length === 0), 'device_evidence_inflation')

  add(errors, artifact?.nonGeneralization?.async200ms?.includes('not reused'), 'async_200_boundary')
  add(errors, artifact?.nonGeneralization?.pressPilot?.includes('not promoted'), 'press_pilot_boundary')
  add(errors, artifact?.nonGeneralization?.syncToastLifecycle?.includes('not a motion duration'), 'toast_lifecycle_boundary')
  add(errors, artifact?.validationBlockerLedger?.validations?.find((item) => item.id === 'VAL-FULL-NON-PDF')?.failureCount === 0, 'non_pdf_failure_count')
  add(errors, artifact?.validationBlockerLedger?.blockers?.find((item) => item.blockerId === 'BLK-LEAD-SHEET-DEVICE-LAYOUT')?.status === 'open', 'lead_sheet_hold_boundary')

  verifyRefs(errors, artifact, artifact?.artifactIdentity?.generation?.baseHead)
  verifyCompanions(errors, artifact, directory)
  verifyIntegrity(errors, directory)
  const completePath = join(directory, 'complete.json')
  if (existsSync(completePath)) add(errors, readFileSync(completePath, 'utf8') === canonicalIdentityJson(artifact), 'complete_not_canonical')
  return [...new Set(errors)]
}

export async function checkMaterialized(directory = DEFAULT_DIRECTORY) {
  const completePath = join(directory, 'complete.json')
  if (!existsSync(completePath)) return ['complete_missing']
  let artifact
  try { artifact = readJson(completePath) } catch { return ['complete_invalid_json'] }
  const errors = checkArtifact(artifact, directory)
  const currentHead = gitText(['rev-parse', 'HEAD'])
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0 && currentHead === BASELINE_HEAD) {
    add(errors, stableArtifactContentEqual(artifact, buildCleanupPayload()), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
