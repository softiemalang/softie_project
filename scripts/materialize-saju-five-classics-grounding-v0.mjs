#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
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

export const SCHEMA = SAJU_FIVE_CLASSICS_GROUNDING_SCHEMA
export const VERSION = SAJU_FIVE_CLASSICS_GROUNDING_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-five-classics-grounding-v0/complete.json'
export const INPUT_PATHS = [
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  'artifacts/saju-readiness-grounding-v0.json',
  'src/interpretationPrep/sajuFiveClassicsGroundingEvidence.js',
  'src/interpretationPrep/sajuLocalSourceCorpusEvidence.js',
  'scripts/materialize-saju-five-classics-grounding-v0.mjs',
]

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

function pdfPageCount(path) {
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' })
  const match = info.match(/^Pages:\s+(\d+)$/m)
  if (!match) throw new Error(`pdf page count unavailable: ${path}`)
  return Number(match[1])
}

function contentSha256(value) {
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalJson(copy)))
}

async function observeSourceDocument(document) {
  const sourcePath = join(SAJU_LOCAL_SOURCE_CORPUS_ROOT, document.fileName)
  const [bytes, fileStat] = await Promise.all([readFile(sourcePath), stat(sourcePath)])
  const byteSha256 = sha256(bytes)
  const pageCountObserved = pdfPageCount(sourcePath)
  if (fileStat.size !== document.byteLength) throw new Error(`source byte length drift: ${document.fileName}`)
  if (byteSha256 !== document.expectedByteSha256) throw new Error(`source byte hash drift: ${document.fileName}`)
  if (pageCountObserved !== document.pageCount) throw new Error(`source page count drift: ${document.fileName}`)
  return {
    ...document,
    corpusRoot: SAJU_LOCAL_SOURCE_CORPUS_ROOT,
    byteSha256,
    byteLength: fileStat.size,
    pageCountObserved,
    byteObservation: 'actual_local_file_bytes_sha256',
  }
}

function buildClaimGrounding({ baseline, packetAssessments }) {
  const packetByClaimId = new Map()
  for (const packet of baseline.acquisitionPackets || []) {
    for (const claimId of packet.claimIds || []) packetByClaimId.set(claimId, packet)
  }
  const unitById = new Map(SAJU_FIVE_CLASSICS_RESEARCH_UNITS.map(unit => [unit.researchUnitId, unit]))
  return (baseline.claims || []).map(claim => {
    const packet = packetByClaimId.get(claim.claimId)
    if (!packet) throw new Error(`claim packet missing: ${claim.claimId}`)
    const assessment = packetAssessments[packet.packetId]
    if (!assessment) throw new Error(`packet assessment missing: ${packet.packetId}`)
    const units = (assessment.unitIds || []).map(unitId => unitById.get(unitId)).filter(Boolean)
    const observations = units.flatMap(unit => unit.observations || [])
    return {
      claimId: claim.claimId,
      claimText: claim.claimText,
      category: claim.category,
      packetId: packet.packetId,
      occurrenceCount: claim.occurrenceCount,
      groundingStatus: assessment.status,
      sourceIdentityStatus: SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY.sourceIdentity,
      claimVerification: SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY.claimVerification,
      semanticEquivalence: SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY.semanticEquivalence,
      researchUnitIds: assessment.unitIds || [],
      sourceObservationIds: observations.map(item => item.observationId).sort(),
      sourceRefs: [...new Set(observations.flatMap(item => [item.sourceId, `source-observation:${item.observationId}`]))].sort(),
      relationBasis: assessment.reason,
      unresolved: [
        'source edition identity and transmission history remain unresolved',
        'direct observation is not independent authority or claim verification',
        assessment.reason,
      ],
      deterministicBoundary: 'calculation_output_and_implemented_rule_remain_separate_from_classical_source_observation',
    }
  }).sort((a, b) => a.claimId.localeCompare(b.claimId))
}

function summarizeStatuses(records) {
  return records.reduce((summary, record) => {
    summary[record.groundingStatus] = (summary[record.groundingStatus] || 0) + 1
    return summary
  }, {})
}

export async function buildArtifact() {
  const baselinePath = 'artifacts/saju-v1-local-frontier-v0/complete.json'
  const readinessPath = 'artifacts/saju-readiness-grounding-v0.json'
  const [baselineBytes, readinessBytes] = await Promise.all([
    readFile(resolve(root, baselinePath)),
    readFile(resolve(root, readinessPath)),
  ])
  const baseline = JSON.parse(baselineBytes)
  const readiness = JSON.parse(readinessBytes)
  const documents = await Promise.all(SAJU_LOCAL_SOURCE_DOCUMENTS.map(observeSourceDocument))
  const packetAssessments = Object.fromEntries(Object.entries(SAJU_FIVE_CLASSICS_PACKET_BOUNDARIES).map(([packetId, assessment]) => [packetId, {
    packetId,
    ...assessment,
    claimIds: [...(baseline.acquisitionPackets || []).find(packet => packet.packetId === packetId)?.claimIds || []].sort(),
  }]))
  for (const packet of baseline.acquisitionPackets || []) {
    if (!packetAssessments[packet.packetId]) throw new Error(`packet boundary missing: ${packet.packetId}`)
  }
  for (const unit of SAJU_FIVE_CLASSICS_RESEARCH_UNITS) {
    for (const packetId of unit.packetIds) if (!packetAssessments[packetId]) throw new Error(`research unit packet missing: ${unit.researchUnitId}:${packetId}`)
    for (const item of unit.observations) {
      const document = documents.find(candidate => candidate.sourceId === item.sourceId)
      if (!document) throw new Error(`research unit source missing: ${unit.researchUnitId}:${item.sourceId}`)
      if (item.locator.pdfPage < 1 || item.locator.pdfPage > document.pageCount) throw new Error(`research unit locator out of range: ${item.observationId}`)
    }
  }
  for (const item of SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS) {
    if (!documents.some(document => document.sourceId === item.sourceId)) throw new Error(`provenance source missing: ${item.provenanceObservationId}`)
  }

  const claimGrounding = buildClaimGrounding({ baseline, packetAssessments })
  const baselineReadiness = {
    path: readinessPath,
    byteSha256: sha256(readinessBytes),
    claimCount: readiness.readiness?.claimCount ?? null,
    occurrenceCount: readiness.readiness?.occurrenceCount ?? null,
    statusDistribution: readiness.readiness?.statusDistribution || {},
    availableForInterpretation: readiness.readiness?.activation?.availableForInterpretation ?? false,
    integrationStatus: readiness.readiness?.activation?.integrationStatus ?? 'not_connected',
    serviceEligibility: readiness.readiness?.activation?.serviceEligibility ?? 'blocked',
  }
  const artifact = {
    schemaVersion: SCHEMA,
    version: VERSION,
    verdictToken: 'partial_saju_five_classics_claim_grounding_frontier_advanced_uncommitted',
    basisHead: currentHead(),
    scope: {
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
    },
    corpus: {
      root: SAJU_LOCAL_SOURCE_CORPUS_ROOT,
      inventoryScope: 'five_prioritized_saju_texts_named_by_the_work_order',
      documents,
      editionAuthority: 'unresolved_for_all_five_documents',
    },
    admissionBoundary: SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY,
    researchUnits: SAJU_FIVE_CLASSICS_RESEARCH_UNITS,
    provenanceObservations: SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS,
    packetAssessments,
    claimGrounding,
    baseline: {
      canonicalFrontierArtifact: {
        path: 'artifacts/saju-v1-local-frontier-v0/complete.json',
        byteSha256: sha256(baselineBytes),
        claimCount: baseline.scope?.canonicalClaimCount ?? null,
        occurrenceCount: baseline.scope?.canonicalOccurrenceCount ?? null,
        historicalArtifactRewritten: false,
      },
      readiness: baselineReadiness,
    },
    readiness: {
      before: baselineReadiness,
      after: {
        availableForInterpretation: false,
        integrationStatus: 'not_connected',
        serviceEligibility: 'blocked',
        productionActivation: 'blocked',
        stableClaimBoundary: 0,
        status: 'blocked_unchanged',
        reason: 'claim-level source relation assessment advances provenance and scope knowledge but does not establish edition identity, semantic equivalence, or independent verification',
      },
    },
    frontier: {
      localAdvance: 'claim_level_relation_and_scope_assessment_completed_for_all_current_canonical_claims',
      claimCountAssessed: claimGrounding.length,
      occurrenceCountPreserved: baseline.scope?.canonicalOccurrenceCount ?? null,
      groundingStatusDistribution: summarizeStatuses(claimGrounding),
      stableClaimPromotionCount: 0,
      nextFrontier: [
        {
          packetId: 'saju-source-packet-core-candidate-boundary-v0',
          status: 'blocked',
          blocker: 'direct source sentence for missing-time candidate policy and day-boundary treatment is not present in the reviewed pages',
        },
        {
          packetId: 'saju-source-packet-rule-shinsal-v0',
          status: 'blocked',
          blocker: 'exact source locator and reference-axis mapping for the repository shinsal set remain unavailable in the reviewed local pages',
        },
        {
          packetId: 'saju-source-packet-rule-timing-v0',
          status: 'blocked',
          blocker: 'the observed 取運 material does not specify the repository direction/start-age/active-cycle contract',
        },
        {
          packetId: 'all_packets',
          status: 'blocked',
          blocker: 'edition identity, transmission history, independent alternate witness, and semantic authority remain unresolved for all five local files',
        },
      ],
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentSha256(artifact)
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-grounding-v0.mjs',
    materializerVersion: VERSION,
    baseHead: artifact.basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const target = resolve(root, outputPath)
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v1`,
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(`${target}.integrity.json`, canonicalJson(integrity))
  return {
    output: outputPath,
    artifactByteSha256: integrity.artifactByteSha256,
    contentSha256: artifact.contentSha256,
    sourceCount: artifact.corpus.documents.length,
    researchUnitCount: artifact.researchUnits.length,
    claimCount: artifact.claimGrounding.length,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
