#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  canonicalIdentityJson,
  checkArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import {
  buildAuditPayload,
} from './materialize-design-reference-audit-v1-emil10-incremental.mjs'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const ARTIFACT_ID = 'design-reference-audit-v1-emil10-incremental'
export const MATERIALIZER_PATH = 'scripts/materialize-design-reference-audit-v1-emil10-incremental.mjs'
export const MATERIALIZER_VERSION = 'design-reference-audit-v1-emil10-incremental-materializer-1'
export const DEFAULT_DIRECTORY = join(ROOT, 'artifacts', ARTIFACT_ID)
export const VERDICT = 'complete_softie_design_reference_incremental_emil10_audit_uncommitted'
export const CORPUS_REVISION = '78761e1b57f97dce65b983d640c70a68f39e8163'
export const SKILLS = [
  'animate',
  'animation-vocabulary',
  'apple-design',
  'ask-sonner',
  'emil-design-eng',
  'find-animation-opportunities',
  'improve-animations',
  'pick-ui-library',
  'prototype',
  'review-animations',
]
export const NEW_SKILLS = [
  'animation-vocabulary',
  'ask-sonner',
  'emil-design-eng',
  'find-animation-opportunities',
  'improve-animations',
  'pick-ui-library',
  'prototype',
]
export const EXPECTED_FILES = {
  animate: ['RECIPES.md', 'SKILL.md'],
  'animation-vocabulary': ['SKILL.md'],
  'apple-design': ['SKILL.md'],
  'ask-sonner': ['API.md', 'SKILL.md'],
  'emil-design-eng': ['SKILL.md'],
  'find-animation-opportunities': ['SKILL.md'],
  'improve-animations': ['AUDIT.md', 'PLAN-TEMPLATE.md', 'SKILL.md'],
  'pick-ui-library': ['SKILL.md'],
  prototype: ['PICKER.md', 'SKILL.md'],
  'review-animations': ['SKILL.md', 'STANDARDS.md'],
}
export const COMPANION_NAMES = [
  'source-reference-ledger.json',
  'new-skill-observation-ledger.json',
  'provenance-lineage.json',
  'claim-relations.json',
  'duration-easing-candidate-matrix.json',
  'loading-reveal-recommendation.json',
  'scheduler-applicability.json',
  'blockers.json',
]

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

function gitBlobText(revision, path) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${revision}:${path}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

function add(errors, condition, message) {
  if (!condition) errors.push(message)
}

function replayComparable(value) {
  const comparable = structuredClone(value)
  delete comparable.artifactIdentity
  if (comparable.repository) {
    delete comparable.repository.baseHead
    delete comparable.repository.originMainHead
  }
  // repositoryInputIdentities are historical source observations. The
  // artifact identity below still verifies each protected input against the
  // generation-base Git bytes, so a descendant checkout must not be treated
  // as byte-identical while its historical evidence remains protected.
  comparable.sourceReferenceLedger?.repositoryInputIdentities && delete comparable.sourceReferenceLedger.repositoryInputIdentities
  return canonicalIdentityJson(comparable)
}

function textRefMatches(reference, text) {
  const lines = text.split(/\r?\n/)
  return lines.slice(reference.lineStart - 1, reference.lineEnd).join('\n').includes(reference.quote)
}

function verifyTextRef(errors, reference, generationBaseHead) {
  if (!reference || reference.kind !== 'text' || !reference.path || !reference.lineStart || !reference.lineEnd || !reference.quote) {
    errors.push(`invalid_text_ref:${JSON.stringify(reference)}`)
    return
  }
  const path = join(ROOT, reference.path)
  const candidates = []
  if (existsSync(path)) candidates.push(readFileSync(path, 'utf8'))
  if (generationBaseHead) {
    const baseText = gitBlobText(generationBaseHead, reference.path)
    if (baseText !== null) candidates.push(baseText)
    const currentHead = gitText(['rev-parse', 'HEAD'])
    const commits = currentHead
      ? gitText(['rev-list', '--ancestry-path', `${generationBaseHead}..${currentHead}`, '--', reference.path])?.split('\n').filter(Boolean) || []
      : []
    for (const commit of commits) {
      const descendantText = gitBlobText(commit, reference.path)
      if (descendantText !== null) candidates.push(descendantText)
    }
  }
  const historicalSchedulerText = reference.path.startsWith('src/scheduler/')
    ? gitBlobText('e5ce1a426c627a070b80c662edb032792d84a82f', reference.path)
    : null
  if (historicalSchedulerText !== null) candidates.push(historicalSchedulerText)
  if (candidates.length === 0) {
    errors.push(`missing_source_ref:${reference.path}`)
    return
  }
  if (!candidates.some((text) => textRefMatches(reference, text))) {
    errors.push(`source_quote_mismatch:${reference.path}:${reference.lineStart}-${reference.lineEnd}`)
  }
}

function verifyCorpusLock(errors, artifact) {
  const lock = readJson(join(ROOT, 'skills-lock.json'))
  const corpus = artifact.upstreamCorpus
  add(errors, corpus?.repository === 'emilkowalski/skills', 'corpus_repository')
  add(errors, corpus?.sourceRef === 'refs/heads/main', 'corpus_source_ref')
  add(errors, corpus?.sourceRevision === CORPUS_REVISION, 'corpus_revision')
  add(errors, corpus?.exactlyTenSkills === true && corpus.entries?.length === 10, 'corpus_skill_count')
  for (const skill of SKILLS) {
    const entry = corpus.entries?.find((candidate) => candidate.skill === skill)
    const lockEntry = lock.skills?.[skill]
    add(errors, Boolean(entry), `corpus_entry:${skill}`)
    add(errors, Boolean(lockEntry), `lock_entry:${skill}`)
    if (!entry || !lockEntry) continue
    const files = [...(EXPECTED_FILES[skill] || [])].sort()
    const hash = createHash('sha256')
    for (const file of files) {
      const relativePath = `.agents/skills/${skill}/${file}`
      const bytes = readFileSync(join(ROOT, relativePath))
      hash.update(Buffer.from(file, 'utf8'))
      hash.update(bytes)
      const detail = entry.files?.find((candidate) => candidate.relativePath === file)
      add(errors, detail?.byteLength === bytes.byteLength, `corpus_byte_length:${relativePath}`)
      add(errors, detail?.byteSha256 === sha256(bytes), `corpus_byte_sha256:${relativePath}`)
    }
    const actual = hash.digest('hex')
    add(errors, entry.computedHash === lockEntry.computedHash, `artifact_lock_hash:${skill}`)
    add(errors, entry.actualComputedHash === actual, `recomputed_lock_hash:${skill}`)
    add(errors, actual === lockEntry.computedHash, `local_lock_hash:${skill}`)
    add(errors, entry.lockHashMatchesLocalBytes === true, `lock_match_flag:${skill}`)
  }
}

function verifyCompanions(errors, artifact, directory) {
  const expected = new Set(['complete.json', 'complete.json.integrity.json', ...COMPANION_NAMES])
  const actual = new Set(readdirSync(directory))
  for (const name of expected) add(errors, actual.has(name), `missing_artifact_file:${name}`)
  for (const name of actual) add(errors, expected.has(name), `unexpected_artifact_file:${name}`)

  const completeBytes = readFileSync(join(directory, 'complete.json'))
  add(errors, canonicalIdentityJson(artifact) === completeBytes.toString('utf8'), 'complete_json_not_canonical_or_mismatched')
  const companionValues = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'new-skill-observation-ledger.json': artifact.newSkillObservationLedger,
    'provenance-lineage.json': artifact.provenanceLineage,
    'claim-relations.json': artifact.claimRelations,
    'duration-easing-candidate-matrix.json': artifact.durationEasingCandidateMatrix,
    'loading-reveal-recommendation.json': artifact.loadingRevealRecommendation,
    'scheduler-applicability.json': artifact.schedulerApplicability,
    'blockers.json': artifact.blockers,
  }
  for (const [name, value] of Object.entries(companionValues)) {
    const bytes = readFileSync(join(directory, name))
    add(errors, canonicalIdentityJson(value) === bytes.toString('utf8'), `companion_mismatch:${name}`)
  }

  const sidecar = readJson(join(directory, 'complete.json.integrity.json'))
  add(errors, sidecar?.artifactId === ARTIFACT_ID, 'integrity_artifact_id')
  add(errors, sidecar?.completeArtifactPath === `artifacts/${ARTIFACT_ID}/complete.json`, 'integrity_complete_path')
  const sidecarFiles = sidecar?.files || {}
  for (const name of ['complete.json', ...COMPANION_NAMES]) {
    const bytes = readFileSync(join(directory, name))
    const record = sidecarFiles[`artifacts/${ARTIFACT_ID}/${name}`]
    add(errors, record?.byteLength === bytes.byteLength, `integrity_length:${name}`)
    add(errors, record?.byteSha256 === sha256(bytes), `integrity_hash:${name}`)
  }
}

function verifyRelations(errors, artifact) {
  const relations = artifact.claimRelations?.relations || []
  const summary = artifact.claimRelations?.summary
  add(errors, summary?.confirmCount === relations.filter((relation) => relation.type === 'confirm').length, 'relation_confirm_count')
  add(errors, summary?.amendCount === relations.filter((relation) => relation.type === 'amend').length, 'relation_amend_count')
  add(errors, summary?.supersedeCount === 0 && relations.every((relation) => relation.type !== 'supersede'), 'relation_supersede_boundary')
  add(errors, relations.every((relation) => relation.independentEvidenceCount === 1 && relation.independentLineageGroups?.length === 1), 'relation_lineage_deduplication')
  add(errors, relations.some((relation) => relation.id === 'REL-EMIL10-009' && relation.type === 'amend' && relation.supportingCodeObservationIds?.includes('CODE-LOAD-002')), 'loading_text_amend_relation')
}

export function checkArtifact(artifact, directory = DEFAULT_DIRECTORY) {
  const errors = []
  const generationBaseHead = artifact?.artifactIdentity?.generation?.baseHead
  add(errors, artifact?.schemaVersion === 'design-reference-audit-v1-emil10-incremental', 'schema')
  add(errors, artifact?.verdict === VERDICT, 'verdict')
  add(errors, artifact?.scope?.artifactOnly === true, 'artifact_only_scope')
  for (const field of ['uiMutation', 'cssMutation', 'applicationBehaviorMutation', 'designMdMutation', 'v1Mutation', 'skillSourceMutation', 'externalAcquisition', 'stagingCommitPush', 'deployOrRemoteDbMutation']) {
    add(errors, artifact?.scope?.[field] === false, `scope_boundary:${field}`)
  }
  add(errors, artifact?.repository?.branch === 'main', 'branch')
  add(errors, artifact?.repository?.baseHead === artifact?.repository?.originMainHead, 'origin_main_parity_at_materialization')
  add(errors, artifact?.repository?.preExistingChangeBoundary?.includes('-.jpg'), 'preexisting_jpg_boundary')
  add(errors, artifact?.repository?.productCodeChangeAssertion?.includes('No UI/CSS/application behavior'), 'product_change_assertion')
  add(errors, checkHistoricalRepositoryBasis(ROOT, artifact?.artifactIdentity?.generation?.baseHead).errors.length === 0, 'historical_repository_basis')
  verifyCorpusLock(errors, artifact)

  const observations = artifact.newSkillObservationLedger?.observations || []
  const classificationSet = new Set(['direct_role_match', 'adjacent_role_guidance', 'general_guidance', 'not_applicable'])
  add(errors, observations.length > 0, 'observation_inventory')
  for (const skill of NEW_SKILLS) add(errors, observations.some((observation) => observation.skill === skill), `new_skill_observation:${skill}`)
  for (const observation of observations) {
    add(errors, classificationSet.has(observation.classification), `observation_classification:${observation.id}`)
    add(errors, observation.tier === 'independent_design_engineering_guidance', `observation_tier:${observation.id}`)
    add(errors, Array.isArray(observation.sourceRefs) && observation.sourceRefs.length > 0, `observation_source_refs:${observation.id}`)
    for (const reference of observation.sourceRefs || []) verifyTextRef(errors, reference, generationBaseHead)
  }

  const lineageGroups = artifact.provenanceLineage?.lineageGroups || []
  add(errors, lineageGroups.length === 1, 'lineage_group_count')
  const lineageId = lineageGroups[0]?.id
  add(errors, lineageGroups[0]?.sourceRevision === CORPUS_REVISION && lineageGroups[0]?.independentAuthorityCount === 1, 'lineage_authority_count')
  add(errors, observations.every((observation) => observation.lineageGroup === lineageId), 'observation_lineage_membership')
  add(errors, artifact.provenanceLineage?.crossSkillRelations?.length === 3, 'cross_skill_relation_count')
  add(errors, artifact.provenanceLineage?.crossSkillRelations?.every((relation) => relation.independent === false), 'cross_skill_relations_not_independent')
  add(errors, artifact.provenanceLineage?.crossSkillRelations?.some((relation) => relation.skills?.includes('animate') && relation.skills?.includes('review-animations')), 'existing_skill_cross_relation')
  add(errors, artifact.provenanceLineage?.rules?.every((rule) => rule.independent === false), 'lineage_rules_not_independent')
  verifyRelations(errors, artifact)

  const matrix = artifact.durationEasingCandidateMatrix
  add(errors, matrix?.targetRole === 'state-triggered loaded-content enter after async fetch', 'duration_target_role')
  add(errors, matrix?.directLoadingDurationEvidence === false, 'direct_loading_duration_evidence')
  add(errors, matrix?.recommendationClass === 'insufficient_to_prefer', 'duration_recommendation')
  add(errors, Array.isArray(matrix?.decisionClasses?.directly_supported?.values) && matrix.decisionClasses.directly_supported.values.length === 0, 'directly_supported_duration_empty')
  add(errors, matrix?.decisionClasses?.range_supported_candidate?.values?.includes('under-300ms'), 'range_supported_duration_boundary')
  add(errors, matrix?.decisionClasses?.softie_empirical_candidate?.values?.includes('180ms') && matrix.decisionClasses.softie_empirical_candidate.status === 'applied_baseline_device_pass_unverified', 'softie_empirical_duration_boundary')
  add(errors, matrix?.decisionClasses?.insufficient_to_prefer?.selected === true, 'insufficient_duration_boundary')
  add(errors, Array.isArray(matrix?.pilotCandidates) && matrix.pilotCandidates.length <= 2, 'pilot_candidate_count')
  add(errors, matrix?.rows?.every((row) => row.directRoleMatch === false), 'duration_role_boundary')
  add(errors, matrix?.fixedVariablesForPilot?.stagger === 'none' && matrix?.fixedVariablesForPilot?.layoutProperties === 'none', 'pilot_motion_constraints')

  const recommendation = artifact.loadingRevealRecommendation
  add(errors, recommendation?.status === 'candidate_for_pilot', 'loading_candidate_status')
  add(errors, recommendation?.recommendationClass === 'insufficient_to_prefer', 'loading_recommendation_class')
  add(errors, recommendation?.duration?.directLoadingValue === false, 'loading_direct_duration_false')
  add(errors, recommendation?.duration?.pilotPair?.length <= 2, 'loading_pilot_pair_count')
  add(errors, recommendation?.easing?.role === 'ease-out_for_entering_content', 'loading_easing_role')
  add(errors, recommendation?.properties?.stagger === 'do_not_use' && recommendation?.properties?.layoutProperties === 'do_not_animate', 'loading_property_constraints')
  add(errors, recommendation?.reducedMotion?.status === 'required_pilot_gate', 'reduced_motion_gate')

  const scheduler = artifact.schedulerApplicability
  add(errors, scheduler?.opportunityGate?.passesOpportunityCondition === true, 'scheduler_opportunity_gate')
  add(errors, scheduler?.opportunityGate?.implementationPrecondition?.includes('no firstFetch/hasLoaded flag'), 'scheduler_first_fetch_precondition')
  add(errors, scheduler?.codeObservations?.some((observation) => observation.id === 'CODE-LOAD-002' && observation.observed.includes('regardless of hideEmptyText')), 'scheduler_loading_text_semantics')
  for (const observation of scheduler?.codeObservations || []) for (const reference of observation.sourceRefs || []) verifyTextRef(errors, reference, generationBaseHead)
  add(errors, scheduler?.runtimeLimitations?.some((limitation) => limitation.includes('physical-device')), 'scheduler_device_limitation')

  add(errors, checkArtifactIdentity(artifact, {
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    allowGenerationBaseInput: true,
  }).length === 0, 'artifact_identity')
  if (existsSync(join(directory, 'complete.json'))) verifyCompanions(errors, artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY)) {
    const documentPath = join(ROOT, 'docs', 'design-reference-audit-v1-emil10-incremental.md')
    add(errors, existsSync(documentPath), 'document_missing')
    if (existsSync(documentPath)) {
      const document = readFileSync(documentPath, 'utf8')
      add(errors, document.includes(VERDICT), 'document_verdict')
      add(errors, document.includes('insufficient_to_prefer'), 'document_duration_decision')
      add(errors, document.includes('physical-device feel validation pass'), 'document_device_boundary')
    }
  }
  return [...new Set(errors)]
}

export async function checkMaterialized(directory = DEFAULT_DIRECTORY) {
  const completePath = join(directory, 'complete.json')
  if (!existsSync(completePath)) return ['complete_missing']
  const artifact = readJson(completePath)
  const errors = checkArtifact(artifact, directory)
  if (resolve(directory) === resolve(DEFAULT_DIRECTORY) && errors.length === 0) {
    const expected = buildAuditPayload()
    add(errors, replayComparable(artifact) === replayComparable(expected), 'materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  const failures = await checkMaterialized(directory)
  process.stdout.write(`${JSON.stringify({ pass: failures.length === 0, directory, failures }, null, 2)}\n`)
  if (failures.length) process.exitCode = 1
}
