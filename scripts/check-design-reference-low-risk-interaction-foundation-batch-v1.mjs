import { createHash } from 'node:crypto'
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
  buildFoundationPayload,
} from './materialize-design-reference-low-risk-interaction-foundation-batch-v1.mjs'

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function add(errors, condition, message) {
  if (!condition) errors.push(message)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function jsonPointer(value, pointer) {
  if (!pointer.startsWith('#/')) return undefined
  return pointer.slice(2).split('/').map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((current, part) => current?.[part], value)
}

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) return null
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1 }
}

function verifyTextRef(errors, reference) {
  const path = join(ROOT, reference.path || '')
  if (reference.kind !== 'working_tree_text' || !existsSync(path) || !reference.quote) {
    errors.push(`invalid_text_ref:${reference.path || 'missing'}`)
    return
  }
  const bytes = readFileSync(path)
  add(errors, bytes.byteLength === reference.byteLength, `text_length:${reference.path}`)
  add(errors, sha256(bytes) === reference.byteSha256, `text_hash:${reference.path}`)
  const location = lineLocation(bytes.toString('utf8'), reference.quote)
  add(errors, Boolean(location), `text_quote:${reference.path}`)
  if (location) add(errors, location.lineStart === reference.lineStart && location.lineEnd === reference.lineEnd, `text_locator:${reference.path}`)
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
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    errors.push(`historical_json:${reference.path}`)
    return
  }
  for (const assertion of reference.assertions || []) {
    const actual = jsonPointer(value, assertion.path)
    if ('equals' in assertion) add(errors, JSON.stringify(actual) === JSON.stringify(assertion.equals), `historical_assertion:${reference.path}:${assertion.path}`)
    if ('contains' in assertion) add(errors, typeof actual === 'string' && actual.includes(assertion.contains), `historical_contains:${reference.path}:${assertion.path}`)
  }
}

function verifyRefs(errors, value) {
  if (Array.isArray(value)) return value.forEach((child) => verifyRefs(errors, child))
  if (!value || typeof value !== 'object') return
  if (value.kind === 'working_tree_text') verifyTextRef(errors, value)
  if (value.kind === 'historical_artifact_json') verifyHistoricalRef(errors, value)
  Object.values(value).forEach((child) => verifyRefs(errors, child))
}

function verifyCompanions(errors, artifact, directory) {
  const mapping = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'provenance-lineage.json': artifact.provenanceLineage,
    'frontier-decision-ledger.json': artifact.frontierDecisionLedger,
    'implementation-observation-ledger.json': artifact.implementationObservationLedger,
    'validation-blocker-ledger.json': artifact.validationBlockerLedger,
  }
  for (const name of COMPANIONS) {
    const path = join(directory, name)
    if (!existsSync(path)) {
      errors.push(`missing_companion:${name}`)
      continue
    }
    const bytes = readFileSync(path, 'utf8')
    add(errors, bytes === canonicalIdentityJson(mapping[name]), `companion_mismatch:${name}`)
  }
}

function verifyIntegrity(errors, directory) {
  const integrityPath = join(directory, 'complete.json.integrity.json')
  if (!existsSync(integrityPath)) {
    errors.push('missing_integrity')
    return
  }
  let integrity
  try {
    integrity = readJson(integrityPath)
  } catch {
    errors.push('invalid_integrity')
    return
  }
  add(errors, integrity.artifactId === ARTIFACT_ID, 'integrity_artifact_id')
  add(errors, integrity.completeArtifactPath === `artifacts/${ARTIFACT_ID}/complete.json`, 'integrity_complete_path')
  const expectedNames = ['complete.json', ...COMPANIONS]
  for (const name of expectedNames) {
    const path = join(directory, name)
    const key = `artifacts/${ARTIFACT_ID}/${name}`
    if (!existsSync(path)) {
      errors.push(`integrity_missing_file:${name}`)
      continue
    }
    const bytes = readFileSync(path)
    add(errors, integrity.files?.[key]?.byteLength === bytes.byteLength, `integrity_length:${name}`)
    add(errors, integrity.files?.[key]?.byteSha256 === sha256(bytes), `integrity_hash:${name}`)
  }
  add(errors, Object.keys(integrity.files || {}).length === expectedNames.length, 'integrity_file_set')
}

export function checkArtifact(artifact, directory = DEFAULT_DIRECTORY) {
  const errors = []
  add(errors, artifact?.schemaVersion === 'design-reference-low-risk-interaction-foundation-batch-v1', 'schema')
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
  }).length === 0, 'artifact_identity')

  const corpus = artifact?.provenanceLineage?.emilCorpus
  add(errors, corpus?.revision === EMIL_REVISION, 'emil_revision')
  add(errors, corpus?.installedSkillCount === 10, 'emil_skill_count')
  add(errors, corpus?.independentAuthorityCount === 1, 'emil_independent_count')
  add(errors, corpus?.installationIsAdoption === false, 'emil_installation_boundary')
  add(errors, artifact?.provenanceLineage?.historicalBytesPreserved === true, 'historical_bytes_preserved')

  const allowed = new Set(['adopt', 'pilot', 'hold', 'reject', 'not_applicable'])
  const frontiers = artifact?.frontierDecisionLedger?.frontiers || []
  add(errors, frontiers.length === 6, 'frontier_count')
  add(errors, frontiers.every((frontier) => allowed.has(frontier.decision)), 'frontier_decisions')
  const decision = Object.fromEntries(frontiers.map((frontier) => [frontier.frontierId, frontier]))
  add(errors, decision['FRONTIER-PRESS-FEEDBACK']?.decision === 'pilot', 'press_decision')
  add(errors, decision['FRONTIER-PRESS-FEEDBACK']?.evidence?.product_device_evidence?.length === 0, 'press_device_boundary')
  add(errors, decision['FRONTIER-HOVER-POINTER-GATING']?.decision === 'adopt', 'hover_decision')
  add(errors, decision['FRONTIER-SMALL-OVERLAY-MOTION']?.decision === 'hold', 'overlay_decision')
  add(errors, decision['FRONTIER-REDUCED-MOTION']?.decision === 'adopt', 'reduced_decision')
  add(errors, decision['FRONTIER-MOTION-TOKEN-COHERENCE']?.decision === 'adopt', 'token_decision')
  add(errors, decision['FRONTIER-ANIMATED-GLASS-MATERIAL']?.decision === 'reject', 'glass_decision')
  add(errors, decision['FRONTIER-ANIMATED-GLASS-MATERIAL']?.designPromotion?.includes('work-order safety boundary'), 'glass_authority_boundary')

  add(errors, artifact?.nonGeneralization?.async200ms?.includes('not reused'), 'async_200_non_generalization')
  add(errors, artifact?.nonGeneralization?.roleValues?.includes('not inferred'), 'role_value_non_generalization')
  add(errors, artifact?.validationBlockerLedger?.validations?.find((item) => item.id === 'VAL-DEVICE-FEEL')?.status === 'unverified', 'device_unverified')

  verifyRefs(errors, artifact)
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
  try {
    artifact = readJson(completePath)
  } catch {
    return ['complete_invalid_json']
  }
  const errors = checkArtifact(artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0) {
    add(errors, stableArtifactContentEqual(artifact, buildFoundationPayload()), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
