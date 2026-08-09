#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import {
  SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY,
  SAJU_FIVE_CLASSICS_GROUNDING_SCHEMA,
  SAJU_FIVE_CLASSICS_GROUNDING_VERSION,
  SAJU_FIVE_CLASSICS_PACKET_BOUNDARIES,
  SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS,
  SAJU_FIVE_CLASSICS_RESEARCH_UNITS,
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from '../src/interpretationPrep/sajuFiveClassicsGroundingEvidence.js'
import { ARTIFACT_PATH, INPUT_PATHS, buildArtifact, SCHEMA, VERSION } from './materialize-saju-five-classics-grounding-v0.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

function pdfPageCount(path) {
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' })
  return Number(info.match(/^Pages:\s+(\d+)$/m)?.[1] || 0)
}

function sameArray(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export async function checkArtifact(candidate, { root = ROOT, sourceRoot = SAJU_LOCAL_SOURCE_CORPUS_ROOT } = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  if (candidate.schemaVersion !== SCHEMA || candidate.version !== VERSION) fail('schema_or_version')
  if (candidate.verdictToken !== 'partial_saju_five_classics_claim_grounding_frontier_advanced_uncommitted') fail('verdict')
  for (const [key, expected] of Object.entries({
    repositoryOnly: true,
    localCorpusRead: true,
    networkOrSourceAcquisition: false,
    directVisualReview: true,
    ocrCanonical: false,
    claimLevelRelationAssessment: true,
    claimPromotion: false,
    readinessMutation: false,
    activationMutation: false,
    interpretationGeneration: false,
    historicalArtifactRewrite: false,
    productionRuleMutation: false,
  })) if (candidate.scope?.[key] !== expected) fail(`scope:${key}`)
  if (candidate.admissionBoundary?.sourceIdentity !== SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY.sourceIdentity) fail('admission_source_identity')
  if (canonicalJson(candidate.admissionBoundary) !== canonicalJson(SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY)) fail('admission_boundary')
  if (candidate.corpus?.root !== sourceRoot || candidate.corpus?.editionAuthority !== 'unresolved_for_all_five_documents') fail('corpus_boundary')
  if (candidate.corpus?.documents?.length !== SAJU_LOCAL_SOURCE_DOCUMENTS.length) fail('source_document_count')

  const documentsById = new Map()
  for (const expected of SAJU_LOCAL_SOURCE_DOCUMENTS) {
    const actual = candidate.corpus?.documents?.find(document => document.sourceId === expected.sourceId)
    if (!actual) {
      fail(`source_document_missing:${expected.sourceId}`)
      continue
    }
    documentsById.set(actual.sourceId, actual)
    for (const field of ['fileName', 'observedTitle', 'sourceForm', 'pageCount', 'byteLength', 'expectedByteSha256', 'editionIdentity']) {
      if (actual[field] !== expected[field]) fail(`source_document_metadata:${expected.sourceId}:${field}`)
    }
    if (actual.corpusRoot !== sourceRoot || actual.byteObservation !== 'actual_local_file_bytes_sha256' || actual.editionIdentity !== 'unresolved_edition') fail(`source_document_boundary:${expected.sourceId}`)
    try {
      const sourcePath = join(sourceRoot, expected.fileName)
      const [bytes, fileStat] = await Promise.all([readFile(sourcePath), stat(sourcePath)])
      const byteSha256 = sha256(bytes)
      if (fileStat.size !== expected.byteLength || byteSha256 !== expected.expectedByteSha256 || pdfPageCount(sourcePath) !== expected.pageCount) fail(`source_file_drift:${expected.sourceId}`)
      if (actual.byteSha256 !== byteSha256 || actual.byteLength !== fileStat.size || actual.pageCountObserved !== pdfPageCount(sourcePath)) fail(`source_observation_drift:${expected.sourceId}`)
    } catch {
      fail(`source_unreadable:${expected.sourceId}`)
    }
  }

  const unitIds = new Set()
  const observationIds = new Set()
  for (const expectedUnit of SAJU_FIVE_CLASSICS_RESEARCH_UNITS) {
    if (unitIds.has(expectedUnit.researchUnitId)) fail(`duplicate_research_unit:${expectedUnit.researchUnitId}`)
    unitIds.add(expectedUnit.researchUnitId)
    const actualUnit = candidate.researchUnits?.find(unit => unit.researchUnitId === expectedUnit.researchUnitId)
    if (!actualUnit || canonicalJson(actualUnit) !== canonicalJson(expectedUnit)) fail(`research_unit_drift:${expectedUnit.researchUnitId}`)
    for (const expectedObservation of expectedUnit.observations) {
      if (observationIds.has(expectedObservation.observationId)) fail(`duplicate_observation:${expectedObservation.observationId}`)
      observationIds.add(expectedObservation.observationId)
      const document = documentsById.get(expectedObservation.sourceId)
      if (!document || expectedObservation.locator.pdfPage < 1 || expectedObservation.locator.pdfPage > document.pageCount) fail(`locator_invalid:${expectedObservation.observationId}`)
      if (expectedObservation.observationMethod?.directVisualReview !== true || expectedObservation.observationMethod?.ocrCanonical !== false || expectedObservation.admission?.claimVerification !== 'not_promoted' || expectedObservation.admission?.independentAuthority !== 'not_established') fail(`observation_boundary:${expectedObservation.observationId}`)
    }
  }
  if (candidate.researchUnits?.length !== SAJU_FIVE_CLASSICS_RESEARCH_UNITS.length) fail('research_unit_count')

  for (const expectedObservation of SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS) {
    const actual = candidate.provenanceObservations?.find(item => item.provenanceObservationId === expectedObservation.provenanceObservationId)
    if (!actual || canonicalJson(actual) !== canonicalJson(expectedObservation)) fail(`provenance_observation_drift:${expectedObservation.provenanceObservationId}`)
    if (!documentsById.has(expectedObservation.sourceId)) fail(`provenance_source_missing:${expectedObservation.provenanceObservationId}`)
  }
  if (candidate.provenanceObservations?.length !== SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS.length) fail('provenance_observation_count')

  const baselinePath = 'artifacts/saju-v1-local-frontier-v0/complete.json'
  const baselineBytes = await readFile(resolve(root, baselinePath))
  const baseline = JSON.parse(baselineBytes)
  const expectedPacketIds = new Set((baseline.acquisitionPackets || []).map(packet => packet.packetId))
  if (Object.keys(candidate.packetAssessments || {}).sort().join('\n') !== [...expectedPacketIds].sort().join('\n')) fail('packet_assessment_inventory')
  for (const [packetId, expectedAssessment] of Object.entries(SAJU_FIVE_CLASSICS_PACKET_BOUNDARIES)) {
    const actual = candidate.packetAssessments?.[packetId]
    const baselinePacket = (baseline.acquisitionPackets || []).find(packet => packet.packetId === packetId)
    if (!actual || actual.packetId !== packetId || actual.status !== expectedAssessment.status || actual.reason !== expectedAssessment.reason) fail(`packet_assessment:${packetId}`)
    if (!baselinePacket || !sameArray(actual.claimIds, [...baselinePacket.claimIds].sort())) fail(`packet_claim_ids:${packetId}`)
    if (actual.unitIds?.some(unitId => !unitIds.has(unitId))) fail(`packet_unknown_unit:${packetId}`)
  }

  const baselineClaims = new Map((baseline.claims || []).map(claim => [claim.claimId, claim]))
  if (candidate.claimGrounding?.length !== baselineClaims.size) fail('claim_grounding_count')
  for (const record of candidate.claimGrounding || []) {
    const claim = baselineClaims.get(record.claimId)
    if (!claim) {
      fail(`unknown_claim:${record.claimId}`)
      continue
    }
    const assessment = candidate.packetAssessments?.[record.packetId]
    if (!assessment || !assessment.claimIds.includes(record.claimId)) fail(`claim_packet_link:${record.claimId}`)
    if (record.groundingStatus !== assessment?.status || record.claimVerification !== 'not_promoted' || record.semanticEquivalence !== 'not_established' || record.sourceIdentityStatus !== SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY.sourceIdentity) fail(`claim_boundary:${record.claimId}`)
    if (record.occurrenceCount !== claim.occurrenceCount || record.claimText !== claim.claimText) fail(`claim_snapshot:${record.claimId}`)
    if (record.researchUnitIds?.some(unitId => !unitIds.has(unitId))) fail(`claim_unknown_unit:${record.claimId}`)
    if (record.sourceObservationIds?.some(observationId => !observationIds.has(observationId))) fail(`claim_unknown_observation:${record.claimId}`)
  }
  const claimIds = (candidate.claimGrounding || []).map(record => record.claimId).sort()
  if (!sameArray(claimIds, [...baselineClaims.keys()].sort())) fail('claim_grounding_inventory')

  if (candidate.baseline?.canonicalFrontierArtifact?.path !== baselinePath || candidate.baseline?.canonicalFrontierArtifact?.byteSha256 !== sha256(baselineBytes)) fail('baseline_identity')
  if (candidate.baseline?.canonicalFrontierArtifact?.claimCount !== baseline.scope?.canonicalClaimCount || candidate.baseline?.canonicalFrontierArtifact?.occurrenceCount !== baseline.scope?.canonicalOccurrenceCount) fail('baseline_counts')
  if (candidate.readiness?.after?.availableForInterpretation !== false || candidate.readiness?.after?.integrationStatus !== 'not_connected' || candidate.readiness?.after?.serviceEligibility !== 'blocked' || candidate.readiness?.after?.productionActivation !== 'blocked' || candidate.readiness?.after?.stableClaimBoundary !== 0 || candidate.readiness?.after?.status !== 'blocked_unchanged') fail('readiness_promoted')
  if (candidate.frontier?.stableClaimPromotionCount !== 0 || candidate.frontier?.claimCountAssessed !== baselineClaims.size || candidate.frontier?.occurrenceCountPreserved !== baseline.scope?.canonicalOccurrenceCount) fail('frontier_summary')

  if (candidate.contentSha256 !== (() => {
    const copy = structuredClone(candidate)
    delete copy.contentSha256
    delete copy.artifactIdentity
    return sha256(Buffer.from(canonicalJson(copy)))
  })()) fail('content_hash')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-saju-five-classics-grounding-v0.mjs', materializerVersion: VERSION, allowGenerationBaseInput: true }))
  const expected = await buildArtifact()
  if (candidate.artifactIdentity?.generation?.baseHead === currentHead() && canonicalJson(candidate) !== canonicalJson(expected)) fail('materialized_content')
  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = resolve(ROOT, process.argv[2] || ARTIFACT_PATH)
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const errors = await checkArtifact(artifact)
  try {
    const bytes = await readFile(artifactPath)
    const integrity = JSON.parse(await readFile(`${artifactPath}.integrity.json`, 'utf8'))
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar')
  } catch {
    errors.push('integrity_sidecar_missing_or_invalid')
  }
  console.log(JSON.stringify({
    pass: errors.length === 0,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    sourceCount: artifact.corpus?.documents?.length || 0,
    researchUnitCount: artifact.researchUnits?.length || 0,
    claimCount: artifact.claimGrounding?.length || 0,
    groundingStatusDistribution: artifact.frontier?.groundingStatusDistribution || {},
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
