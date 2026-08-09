#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import { SAJU_LOCAL_SOURCE_CORPUS_ROOT, SAJU_LOCAL_SOURCE_DOCUMENTS } from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'
import { ARTIFACT_PATH, INPUT_PATHS, PREDECESSOR_PATH, SCHEMA, VERSION, buildArtifact } from './materialize-saju-source-claim-observation-v1.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

function pdfPageCount(path) {
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' })
  return Number(info.match(/^Pages:\s+(\d+)$/m)?.[1] || 0)
}

export async function checkArtifact(candidate, { root = ROOT, sourceRoot = SAJU_LOCAL_SOURCE_CORPUS_ROOT } = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  if (candidate.schemaVersion !== SCHEMA || candidate.version !== VERSION) fail('schema_or_version')
  if (candidate.verdictToken !== 'partial_saju_source_claim_observation_advanced_uncommitted') fail('verdict')
  if (candidate.scope?.claimPromotion !== false || candidate.scope?.readinessMutation !== false || candidate.scope?.activationMutation !== false || candidate.scope?.historicalArtifactsRewritten !== false) fail('scope_boundary')
  if (candidate.scope?.ocrCanonical !== false || candidate.observationMethod?.scanFirst !== true || candidate.observationMethod?.directVisualReview !== true) fail('scan_first_boundary')
  if (candidate.sourceIdentity?.editionIdentity !== 'unresolved_edition') fail('edition_promoted')
  if (candidate.claimBoundary?.stableClaimCount !== 0 || candidate.claimBoundary?.repositoryRuleSelection !== 'not_performed' || candidate.claimBoundary?.conflictWinner !== 'not_selected') fail('claim_boundary')
  if (candidate.readiness?.status !== 'blocked_unchanged' || candidate.readiness?.availableForInterpretation !== false || candidate.readiness?.stableClaimBoundary !== 0 || candidate.readiness?.productionActivation !== 'blocked') fail('readiness_promoted')
  if (candidate.predecessor?.artifact !== PREDECESSOR_PATH || candidate.predecessor?.historicalArtifactRewritten !== false) fail('predecessor_boundary')
  const expectedDocument = SAJU_LOCAL_SOURCE_DOCUMENTS.find(document => document.sourceId === candidate.sourceIdentity?.sourceId)
  if (!expectedDocument) fail('source_document_unknown')
  const observation = candidate.observations?.[0]
  if (candidate.observations?.length !== 1 || observation?.locator?.pdfPage !== 5 || observation?.claimPacketId !== 'saju-source-packet-rule-branch-relations-v0') fail('observation_scope')
  if (observation?.admission?.canonicalTranscription !== false || observation?.admission?.claimVerification !== 'not_promoted' || observation?.admission?.independentAuthority !== 'not_established') fail('observation_promoted')
  const expectedTranscription = '刑者，三刑也，子卯巳申寅之类也。\n冲者，六冲也，子午卯酉之类是也。\n会者，三会也，申子辰之类是也。\n合者，六合也，子与丑合之类是也。\n此皆以地支宫分而言，系对射之意也。\n三方为会，朋友之意也。并对为合，比邻之意也。'
  if (observation?.directObservation?.transcription !== expectedTranscription) fail('transcription_drift')
  if (observation?.directObservation?.exampleTablesTranscription !== 'not_admitted_due_layout_and_table-cell_boundary_uncertainty') fail('table_uncertainty_boundary')
  if (expectedDocument) {
    const sourcePath = join(sourceRoot, expectedDocument.fileName)
    try {
      const [bytes, sourceStat] = await Promise.all([readFile(sourcePath), stat(sourcePath)])
      if (sourceStat.size !== expectedDocument.byteLength || sha256(bytes) !== expectedDocument.expectedByteSha256) fail('source_byte_drift')
      if (candidate.sourceIdentity.byteSha256 !== sha256(bytes) || candidate.sourceIdentity.byteLength !== sourceStat.size || candidate.sourceIdentity.pageCountObserved !== pdfPageCount(sourcePath)) fail('source_identity_observation_drift')
    } catch { fail('source_unreadable') }
  }
  try {
    const predecessorBytes = await readFile(resolve(root, PREDECESSOR_PATH))
    if (candidate.predecessor?.byteSha256 !== sha256(predecessorBytes)) fail('predecessor_byte_drift')
  } catch { fail('predecessor_unreadable') }
  if (candidate.contentSha256 !== (() => { const copy = structuredClone(candidate); delete copy.contentSha256; delete copy.artifactIdentity; return sha256(Buffer.from(canonicalJson(copy))) })()) fail('content_hash')
  if (candidate.artifactIdentity?.inputs?.map(item => item.path).sort().join('\n') !== [...INPUT_PATHS].sort().join('\n')) fail('input_manifest')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-saju-source-claim-observation-v1.mjs', materializerVersion: VERSION, allowGenerationBaseInput: true }))
  if (candidate.basisHead === currentHead()) {
    const expected = await buildArtifact()
    if (canonicalJson(candidate) !== canonicalJson(expected)) fail('materialized_content')
  }
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || ARTIFACT_PATH)
  const candidate = JSON.parse(await readFile(path, 'utf8'))
  const failures = await checkArtifact(candidate)
  console.log(JSON.stringify({ pass: failures.length === 0, basisHead: candidate.basisHead, currentHead: currentHead(), failures }, null, 2))
  if (failures.length) process.exitCode = 1
}
