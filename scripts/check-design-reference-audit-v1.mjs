import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const ARTIFACT_ID = 'design-reference-audit-v1'
const MATERIALIZER_VERSION = 'design-reference-audit-v1-materializer-1'
const DEFAULT_DIR = join(ROOT, 'artifacts', ARTIFACT_ID)
const SKETCH_PATH = process.env.SOFTIE_IOS27_UI_KIT_PATH || '/Users/softie/Documents/softie_design/Apple iOS 27 UI Kit.sketch'
const COMPANIONS = {
  'source-reference-ledger.json': 'sourceReferenceLedger',
  'observation-value-ledger.json': 'observationValueLedger',
  'provenance-lineage.json': 'provenanceLineage',
  'conflict-compatibility-matrix.json': 'conflictCompatibilityMatrix',
  'pilot-candidate-shortlist.json': 'pilotCandidateShortlist',
}
const ALLOWED_TIERS = new Set([
  'apple_official_artifact',
  'apple_official_primary_guidance',
  'apple_official_license_context',
  'apple_derived_guidance',
  'independent_design_engineering_guidance',
  'softie_house_rule',
  'softie_house_rule_observed_code',
  'proposed_candidate',
])
const ALLOWED_STATUSES = new Set(['adopted', 'candidate_for_pilot', 'reference_only', 'not_applicable', 'blocked'])

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function checkAudit(directory = DEFAULT_DIR) {
  const errors = []
  const warnings = []
  const error = (message) => errors.push(message)
  const completePath = join(directory, 'complete.json')
  if (!existsSync(completePath)) return { pass: false, errors: ['missing:complete.json'], warnings }
  let artifact
  try {
    artifact = readJson(completePath)
  } catch (caught) {
    return { pass: false, errors: ['invalid_json:complete.json:' + caught.message], warnings }
  }

  if (artifact.schemaVersion !== 'design-reference-audit-v1') error('schema_version_mismatch')
  if (artifact.verdict !== 'complete_softie_design_reference_audit_v1_uncommitted') error('verdict_mismatch')
  if (artifact.scope && Object.values(artifact.scope).some((value) => value !== true && value !== false)) error('scope_flags_not_boolean')
  for (const key of ['uiMutation', 'cssMutation', 'designMdMutation', 'businessDataFlowMutation', 'externalAcquisition', 'appleAssetsCopied', 'productionActivation', 'readinessPromotion', 'stagingCommitPush']) {
    if (artifact.scope && artifact.scope[key] !== false) error('forbidden_scope_flag_promoted:' + key)
  }

  const identityErrors = checkArtifactIdentity(artifact, {
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: 'scripts/materialize-design-reference-audit-v1.mjs',
    materializerVersion: MATERIALIZER_VERSION,
    allowCurrentHeadDifference: true,
    allowGenerationBaseInput: true,
  })
  identityErrors.forEach((message) => error('artifact_identity:' + message))

  const sourceLedger = artifact.sourceReferenceLedger
  const tierCodes = new Set((sourceLedger && sourceLedger.provenanceTiers || []).map((tier) => tier.code))
  for (const required of ['apple_official_artifact', 'apple_derived_guidance', 'independent_design_engineering_guidance', 'softie_house_rule', 'proposed_candidate']) {
    if (!tierCodes.has(required)) error('missing_provenance_tier:' + required)
  }
  const observationLedger = artifact.observationValueLedger
  const observationIds = new Set((observationLedger && observationLedger.observations || []).map((item) => item.id))
  for (const observation of observationLedger && observationLedger.observations || []) {
    if (!ALLOWED_TIERS.has(observation.tier)) error('observation_invalid_tier:' + observation.id)
    if (!observation.sourceId) error('observation_missing_source:' + observation.id)
  }
  for (const rule of artifact.provenanceLineage && artifact.provenanceLineage.rules || []) {
    for (const id of (rule.from || [])) {
      if (id.startsWith('OBS-') && !observationIds.has(id)) error('lineage_missing_observation:' + id)
    }
  }

  const rows = artifact.conflictCompatibilityMatrix && artifact.conflictCompatibilityMatrix.rows || []
  const requiredAreas = new Set([
    'tap_press_feedback',
    'route_page_transition',
    'async_loading_loaded_reveal',
    'modal_sheet_popover',
    'drag_gesture_spring',
    'reduced_motion',
    'opacity_transform',
    'progress_loading_indicators',
    'material_glass_depth',
    'touch_target_spacing_component_sizing',
    'duration_easing_roles',
  ])
  for (const area of requiredAreas) {
    if (!rows.some((row) => row.area === area)) error('matrix_missing_area:' + area)
  }
  for (const row of rows) {
    if (!ALLOWED_STATUSES.has(row.recommendedStatus)) error('matrix_invalid_status:' + row.id)
    if (!Array.isArray(row.externalEvidence) || row.externalEvidence.length === 0) error('matrix_missing_external_evidence:' + row.id)
  }

  const candidates = artifact.pilotCandidateShortlist && artifact.pilotCandidateShortlist.candidates || []
  if (candidates.length > 3) error('pilot_shortlist_exceeds_three')
  for (const candidate of candidates) {
    if (candidate.status !== 'candidate_for_pilot') error('pilot_status_promoted:' + candidate.id)
    if (!candidate.scope || !candidate.successCriteria || !candidate.failureCriteria) error('pilot_contract_incomplete:' + candidate.id)
  }

  const sketch = artifact.sketchObservation || {}
  if (sketch.status === 'direct_observation_accessible') {
    if (!sketch.sourceByteSha256 || !Number.isInteger(sketch.byteLength)) error('sketch_identity_missing')
    if (!sketch.archive || sketch.archive.pageEntryCount < 1) error('sketch_page_inventory_missing')
    if (!sketch.progress || !sketch.typography || !sketch.materials) error('sketch_component_observation_missing')
  } else {
    warnings.push('sketch_source_not_accessible:' + (sketch.status || 'unknown'))
  }
  if (!sketch.motion || !['none_observed_in_archive_json', 'keys_observed_in_archive_json', 'not_scanned_missing_source'].includes(sketch.motion.status)) {
    error('sketch_motion_status_invalid')
  }
  if (sketch.motion && sketch.motion.status === 'none_observed_in_archive_json' && (sketch.motion.keys || []).length !== 0) error('motion_negative_observation_has_keys')

  for (const [fileName, section] of Object.entries(COMPANIONS)) {
    const path = join(directory, fileName)
    if (!existsSync(path)) {
      error('missing_companion:' + fileName)
      continue
    }
    let companion
    try {
      companion = readJson(path)
    } catch (caught) {
      error('invalid_companion_json:' + fileName + ':' + caught.message)
      continue
    }
    if (canonicalIdentityJson(companion) !== canonicalIdentityJson(artifact[section])) error('companion_content_mismatch:' + fileName)
  }

  const integrityPath = join(directory, 'complete.json.integrity.json')
  if (!existsSync(integrityPath)) {
    error('missing_integrity_sidecar')
  } else {
    let integrity
    try {
      integrity = readJson(integrityPath)
    } catch (caught) {
      error('invalid_integrity_json:' + caught.message)
      integrity = null
    }
    if (integrity) {
      for (const fileName of ['complete.json'].concat(Object.keys(COMPANIONS))) {
        const logicalPath = 'artifacts/' + ARTIFACT_ID + '/' + fileName
        const expected = integrity.files && integrity.files[logicalPath]
        const path = join(directory, fileName)
        if (!expected) {
          error('integrity_missing_entry:' + logicalPath)
        } else if (existsSync(path)) {
          const bytes = readFileSync(path)
          if (bytes.byteLength !== expected.byteLength || sha256(bytes) !== expected.byteSha256) error('integrity_hash_mismatch:' + fileName)
        }
      }
    }
  }

  if (sketch.status === 'direct_observation_accessible') {
    if (!existsSync(SKETCH_PATH)) {
      error('sketch_source_missing_after_materialization')
    } else {
      const bytes = readFileSync(SKETCH_PATH)
      if (bytes.byteLength !== sketch.byteLength || sha256(bytes) !== sketch.sourceByteSha256) error('sketch_source_byte_identity_mismatch')
    }
  }

  const documentPath = join(ROOT, 'docs', 'design-reference-audit-v1.md')
  if (!existsSync(documentPath)) {
    error('missing_audit_document')
  } else {
    const document = readFileSync(documentPath, 'utf8')
    if (!document.includes(artifact.verdict)) error('audit_document_missing_verdict')
    if (!document.includes('Scheduler loading')) error('audit_document_missing_scheduler_recommendation')
    if (!document.endsWith('\n')) error('audit_document_missing_final_lf')
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    artifact: {
      verdict: artifact.verdict,
      sketchStatus: sketch.status,
      observationCount: observationLedger && observationLedger.observations ? observationLedger.observations.length : 0,
      matrixCount: rows.length,
      pilotCount: candidates.length,
    },
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIR
  const result = checkAudit(directory)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (!result.pass) process.exitCode = 1
}

export { checkAudit }
