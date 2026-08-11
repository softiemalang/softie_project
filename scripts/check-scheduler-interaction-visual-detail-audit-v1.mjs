import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { canonicalIdentityJson, checkArtifactIdentity, checkHistoricalRepositoryBasis, inspectFileByteIdentity, stableArtifactContentEqual } from '../src/artifactIdentity.js'
import { ARTIFACT_ID, BASELINE_HEAD, COMPANIONS, DEFAULT_DIRECTORY, MATERIALIZER_PATH, MATERIALIZER_VERSION, ROOT, VERDICT, buildAuditPayload } from './materialize-scheduler-interaction-visual-detail-audit-v1.mjs'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const add = (errors, condition, message) => { if (!condition) errors.push(message) }
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function currentHead() {
  try { return execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return null }
}

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
}

function locate(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) return null
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1 }
}

function refBytesMatch(reference, bytes) {
  if (bytes.byteLength !== reference.byteLength || sha256(bytes) !== reference.byteSha256) return false
  const location = locate(bytes.toString('utf8'), reference.quote)
  return location?.lineStart === reference.lineStart && location?.lineEnd === reference.lineEnd
}

function verifyRef(errors, reference, generationBaseHead) {
  if (reference.kind === 'git_commit_text') {
    let bytes
    try { bytes = gitBytes(reference.commit, reference.path) } catch { errors.push(`git_ref_unreadable:${reference.path}`); return }
    add(errors, refBytesMatch(reference, bytes), `git_ref_mismatch:${reference.path}`)
    return
  }
  if (reference.kind !== 'working_tree_text') return
  const identity = inspectFileByteIdentity(ROOT, reference.path, reference.byteSha256, { generationBaseHead, descendantHead: currentHead() })
  add(errors, identity.currentMatches || identity.historicalMatches || identity.descendantMatches, `working_ref_hash:${reference.path}`)
  if (identity.currentMatches) add(errors, refBytesMatch(reference, readFileSync(join(ROOT, reference.path))), `working_ref_quote:${reference.path}`)
}

function verifyRefs(errors, value, generationBaseHead) {
  if (Array.isArray(value)) return value.forEach((child) => verifyRefs(errors, child, generationBaseHead))
  if (!value || typeof value !== 'object') return
  if (value.kind === 'working_tree_text' || value.kind === 'git_commit_text') verifyRef(errors, value, generationBaseHead)
  Object.values(value).forEach((child) => verifyRefs(errors, child, generationBaseHead))
}

function verifyCompanions(errors, artifact, directory) {
  const map = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'flow-audit-ledger.json': artifact.flowAuditLedger,
    'frontier-decision-ledger.json': artifact.frontierDecisionLedger,
    'motion-review-ledger.json': artifact.motionReviewLedger,
    'validation-blocker-ledger.json': artifact.validationBlockerLedger,
    'device-validation-ledger.json': artifact.deviceValidationLedger,
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
  const names = ['complete.json', ...COMPANIONS]
  add(errors, Object.keys(integrity.files || {}).length === names.length, 'integrity_file_set')
  for (const name of names) {
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
  add(errors, artifact?.scope?.schedulerOnly === true, 'scope_scheduler')
  add(errors, artifact?.scope?.businessDataAuthApiMutation === false, 'scope_business')
  add(errors, artifact?.scope?.designMdMutation === false, 'scope_design')
  add(errors, artifact?.scope?.stagingCommitPushDeployRemoteMutation === false, 'scope_remote')
  add(errors, artifact?.scope?.preExistingChangeBoundary?.includes('-.jpg'), 'scope_jpg')

  const basis = checkHistoricalRepositoryBasis(ROOT, artifact?.artifactIdentity?.generation?.baseHead)
  add(errors, basis.errors.length === 0, `historical_basis:${basis.errors.join(',')}`)
  add(errors, checkArtifactIdentity(artifact, { root: ROOT, artifactId: ARTIFACT_ID, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowDescendantInput: true }).length === 0, 'artifact_identity')

  const expectedFlows = ['FLOW-1-TODAY-LOAD', 'FLOW-2-PUSH-STATUS', 'FLOW-3-EVENT-ACTIONS', 'FLOW-4-RESERVATION-CREATE', 'FLOW-5-RESERVATION-EDIT-DELETE', 'FLOW-6-FILTER-WORK-TIME', 'FLOW-7-WORK-LOG']
  add(errors, JSON.stringify(artifact?.flowAuditLedger?.flows?.map((item) => item.flowId)) === JSON.stringify(expectedFlows), 'flow_coverage')
  const expectedDecisions = {
    'FRONTIER-ASYNC-STATE': 'fix', 'FRONTIER-DUPLICATE-ACTION': 'fix', 'FRONTIER-LIVE-FEEDBACK': 'fix', 'FRONTIER-TOGGLE-GROUP-SEMANTICS': 'fix', 'FRONTIER-DESTRUCTIVE-WORKLOG': 'fix', 'FRONTIER-GLASS-RAW-PRESS-MOTION': 'fix', 'FRONTIER-ACTION-NOW-HIERARCHY': 'pilot', 'FRONTIER-SAVE-DESTINATION': 'hold', 'FRONTIER-MODAL-FOCUS-LIFECYCLE': 'hold', 'FRONTIER-HOURLY-NATIVE-PICKER': 'hold', 'FRONTIER-EVENT-CARD-DENSITY': 'already_good', 'FRONTIER-NEW-SHEET-MOTION': 'reject',
  }
  add(errors, JSON.stringify(Object.fromEntries((artifact?.frontierDecisionLedger?.frontiers || []).map((item) => [item.id, item.decision]))) === JSON.stringify(expectedDecisions), 'frontier_decisions')
  add(errors, artifact?.motionReviewLedger?.verdict === 'approve_bounded_removals_and_role_separation', 'motion_verdict')
  add(errors, artifact?.motionReviewLedger?.reviews?.find((item) => item.id === 'MOTION-SETTING-GLASS')?.decision === 'keep_glass_static', 'glass_motion_boundary')
  add(errors, artifact?.deviceValidationLedger?.evidenceStatus === 'unverified', 'device_evidence_boundary')
  add(errors, artifact?.sourceReferenceLedger?.sources?.find((item) => item.id === 'SRC-EMIL')?.independentAuthorityCount === 1, 'emil_lineage_count')
  const validations = artifact?.validationBlockerLedger?.validations || []
  add(errors, validations.find((item) => item.id === 'VAL-FOCUSED-SCHEDULER-MOTION-A11Y')?.testCount === 38, 'focused_validation')
  add(errors, validations.find((item) => item.id === 'VAL-HISTORICAL-REPLAY-REMEDIATION')?.testCount === 13, 'history_validation')
  add(errors, validations.find((item) => item.id === 'VAL-FULL-PDF-SOURCE-RECONCILIATION')?.expectedFailureCount === 35, 'pdf_blocker_count')
  const finalFullSuite = validations.find((item) => item.id === 'VAL-FULL-SUITE-AFTER-REMEDIATION')
  add(errors, finalFullSuite?.status === 'blocked_environment' && finalFullSuite?.tests === 663 && finalFullSuite?.pass === 626 && finalFullSuite?.fail === 35 && finalFullSuite?.skip === 2 && finalFullSuite?.newNonPdfFailureCount === 0, 'full_rerun_boundary')

  verifyRefs(errors, artifact, artifact?.artifactIdentity?.generation?.baseHead)
  verifyCompanions(errors, artifact, directory)
  verifyIntegrity(errors, directory)
  const completePath = join(directory, 'complete.json')
  if (existsSync(completePath)) add(errors, readFileSync(completePath, 'utf8') === canonicalIdentityJson(artifact), 'complete_not_canonical')
  return [...new Set(errors)]
}

export async function checkMaterialized(directory = DEFAULT_DIRECTORY) {
  const path = join(directory, 'complete.json')
  if (!existsSync(path)) return ['complete_missing']
  let artifact
  try { artifact = readJson(path) } catch { return ['complete_invalid_json'] }
  const errors = checkArtifact(artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0 && currentHead() === BASELINE_HEAD) {
    add(errors, stableArtifactContentEqual(artifact, buildAuditPayload()), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
