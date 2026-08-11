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
  DEFAULT_DIRECTORY,
  GLASS_SCOPE_FIX_COMMIT,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  PILOT_COMMIT,
  VERDICT,
  ROOT,
  buildPromotionPayload,
} from './materialize-design-reference-async-content-enter-200ms-promotion.mjs'

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function gitText(args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function add(errors, condition, message) {
  if (!condition) errors.push(message)
}

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) return null
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1 }
}

function jsonPointer(value, pointer) {
  if (!pointer.startsWith('#/')) return undefined
  return pointer.slice(2).split('/').map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~')).reduce((current, part) => current?.[part], value)
}

function verifyTextRef(errors, reference) {
  if (!reference || !['working_tree_text', 'git_commit_text'].includes(reference.kind) || !reference.path || !reference.quote) {
    errors.push(`invalid_text_source_ref:${JSON.stringify(reference)}`)
    return
  }
  let bytes
  try {
    bytes = reference.kind === 'working_tree_text'
      ? readFileSync(join(ROOT, reference.path))
      : gitBytes(reference.commit, reference.path)
  } catch {
    errors.push(`missing_text_source_ref:${reference.kind}:${reference.commit || 'working_tree'}:${reference.path}`)
    return
  }
  add(errors, bytes.byteLength === reference.byteLength, `text_source_length:${reference.path}`)
  add(errors, sha256(bytes) === reference.byteSha256, `text_source_hash:${reference.path}`)
  const location = lineLocation(bytes.toString('utf8'), reference.quote)
  add(errors, Boolean(location), `text_source_quote:${reference.path}`)
  if (location) {
    add(errors, location.lineStart === reference.lineStart && location.lineEnd === reference.lineEnd, `text_source_locator:${reference.path}:${reference.lineStart}-${reference.lineEnd}`)
  }
}

function verifyArtifactRef(errors, reference) {
  if (!reference || reference.kind !== 'historical_artifact_json' || !reference.path) {
    errors.push(`invalid_artifact_source_ref:${JSON.stringify(reference)}`)
    return
  }
  const path = join(ROOT, reference.path)
  if (!existsSync(path)) {
    errors.push(`missing_historical_artifact:${reference.path}`)
    return
  }
  const bytes = readFileSync(path)
  add(errors, bytes.byteLength === reference.byteLength, `historical_artifact_length:${reference.path}`)
  add(errors, sha256(bytes) === reference.byteSha256, `historical_artifact_hash:${reference.path}`)
  let value
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    errors.push(`historical_artifact_json_invalid:${reference.path}`)
    return
  }
  for (const assertion of reference.jsonAssertions || []) {
    const actual = jsonPointer(value, assertion.path)
    add(errors, JSON.stringify(actual) === JSON.stringify(assertion.equals), `historical_artifact_assertion:${reference.path}:${assertion.path}`)
  }
}

function verifySourceRefs(errors, value) {
  if (Array.isArray(value)) {
    value.forEach((child) => verifySourceRefs(errors, child))
    return
  }
  if (!value || typeof value !== 'object') return
  if (value.kind === 'historical_artifact_json') verifyArtifactRef(errors, value)
  if (value.kind === 'working_tree_text' || value.kind === 'git_commit_text') verifyTextRef(errors, value)
  Object.values(value).forEach((child) => verifySourceRefs(errors, child))
}

function verifyIntegrity(errors, artifact, directory) {
  const completePath = join(directory, 'complete.json')
  const integrityPath = join(directory, 'complete.json.integrity.json')
  if (!existsSync(completePath)) {
    errors.push('missing_complete_json')
    return
  }
  add(errors, readFileSync(completePath, 'utf8') === canonicalIdentityJson(artifact), 'complete_json_not_canonical_or_mismatched')
  if (!existsSync(integrityPath)) {
    errors.push('missing_integrity_sidecar')
    return
  }
  let integrity
  try {
    integrity = readJson(integrityPath)
  } catch {
    errors.push('invalid_integrity_sidecar')
    return
  }
  add(errors, integrity.artifactId === ARTIFACT_ID, 'integrity_artifact_id')
  add(errors, integrity.completeArtifactPath === `artifacts/${ARTIFACT_ID}/complete.json`, 'integrity_complete_path')
  const expected = integrity.files?.[`artifacts/${ARTIFACT_ID}/complete.json`]
  const bytes = readFileSync(completePath)
  add(errors, expected?.byteLength === bytes.byteLength, 'integrity_length:complete.json')
  add(errors, expected?.byteSha256 === sha256(bytes), 'integrity_hash:complete.json')
}

function verifyCommitLineage(errors, artifact) {
  const pilot = artifact.pilot?.implementationCommit
  const fix = artifact.glassScopeFix?.implementationCommit
  add(errors, pilot?.commit === PILOT_COMMIT, 'pilot_commit_identity')
  add(errors, fix?.commit === GLASS_SCOPE_FIX_COMMIT, 'glass_fix_commit_identity')
  add(errors, gitText(['cat-file', '-e', `${PILOT_COMMIT}^{commit}`]) !== null, 'pilot_commit_missing')
  add(errors, gitText(['cat-file', '-e', `${GLASS_SCOPE_FIX_COMMIT}^{commit}`]) !== null, 'glass_fix_commit_missing')
  try {
    execFileSync('git', ['-c', 'core.fsmonitor=false', 'merge-base', '--is-ancestor', PILOT_COMMIT, GLASS_SCOPE_FIX_COMMIT], { cwd: ROOT, stdio: 'ignore' })
  } catch {
    errors.push('pilot_not_ancestor_of_glass_fix')
  }
  for (const record of [pilot, fix]) {
    for (const reference of record?.sourceRefs || []) {
      add(errors, reference.commit === record.commit, `commit_source_ref_mismatch:${record.role}`)
    }
  }
}

export function checkArtifact(artifact, directory = DEFAULT_DIRECTORY) {
  const errors = []
  add(errors, artifact?.schemaVersion === 'design-reference-async-content-enter-200ms-promotion-v1', 'schema')
  add(errors, artifact?.verdict === VERDICT, 'verdict')
  for (const field of ['promotionOnly', 'uiMutation', 'businessDataFlowMutation', 'databaseMutation', 'auditArtifactRewrite', 'skillSourceMutation', 'stagingCommitPush', 'deployment']) {
    add(errors, artifact?.scope?.[field] === (field === 'promotionOnly'), `scope:${field}`)
  }
  add(errors, artifact?.repository?.branch === 'main', 'branch')
  add(errors, artifact?.repository?.anchorCommit === GLASS_SCOPE_FIX_COMMIT, 'anchor_commit')
  add(errors, artifact?.repository?.preExistingChangeBoundary?.includes('-.jpg'), 'preexisting_jpg_boundary')

  const basis = checkHistoricalRepositoryBasis(ROOT, artifact?.artifactIdentity?.generation?.baseHead)
  add(errors, basis.errors.length === 0, `historical_repository_basis:${basis.errors.join(',')}`)
  add(errors, checkArtifactIdentity(artifact, {
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
  }).length === 0, 'artifact_identity')

  const expectedRecipe = {
    durationMs: 200,
    duration: '200ms',
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    properties: ['opacity'],
    artificialDelay: false,
    prohibitedProperties: ['transform', 'translate', 'scale', 'blur', 'filter', 'clip-path', 'layout', 'stagger'],
  }
  for (const [key, value] of Object.entries(expectedRecipe)) add(errors, JSON.stringify(artifact.recipe?.[key]) === JSON.stringify(value), `recipe:${key}`)
  add(errors, artifact.recipe?.role === 'async content enter / conditional content swap', 'recipe_role')
  add(errors, artifact.recipe?.targetBoundary?.includes('never a glass/backdrop-filter surface'), 'recipe_target_boundary')
  add(errors, artifact.recipe?.reducedMotion === 'static/non-movement; no animation', 'recipe_reduced_motion')
  add(errors, artifact.recipe?.generalizationBoundary?.includes('not a universal 200ms rule'), 'recipe_generalization_boundary')

  add(errors, artifact.externalEvidence?.durationEvidence?.directLoadingDurationProvenance === false, 'external_duration_directness')
  add(errors, artifact.externalEvidence?.durationEvidence?.classification === 'adjacent_role_guidance', 'external_duration_classification')
  add(errors, artifact.auditDecision?.incrementalVerdict === 'insufficient_to_prefer', 'audit_duration_verdict')
  add(errors, artifact.auditDecision?.boundedCandidate === '200ms', 'audit_candidate')
  add(errors, artifact.frozenPredecessors?.historicalBytesPreserved === true, 'historical_bytes_preserved')
  add(errors, artifact.promotionDecision?.status === 'promoted', 'promotion_status')
  add(errors, artifact.promotionDecision?.decisionClass === 'product_context_validated_house_rule', 'promotion_decision_class')
  add(errors, artifact.promotionDecision?.gates?.every((gate) => ['pass', 'pass_with_boundary', 'preserved', 'pass_as_product_context_validation'].includes(gate.status)), 'promotion_gates')
  add(errors, artifact.lineage?.notGeneralized?.includes('does not promote 200ms'), 'lineage_non_generalization')
  add(errors, artifact.glassScopeFix?.causalAssessment?.includes('no Safari computed-style or compositor trace is claimed'), 'device_causal_boundary')
  verifyCommitLineage(errors, artifact)
  verifySourceRefs(errors, artifact)
  verifyIntegrity(errors, artifact, directory)
  return [...new Set(errors)]
}

export async function checkMaterialized(directory = DEFAULT_DIRECTORY) {
  const completePath = join(directory, 'complete.json')
  if (!existsSync(completePath)) return ['complete_missing']
  let artifact
  try {
    artifact = readJson(completePath)
  } catch {
    return ['complete_invalid_json']
  }
  const errors = checkArtifact(artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0) {
    add(errors, stableArtifactContentEqual(artifact, buildPromotionPayload()), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
