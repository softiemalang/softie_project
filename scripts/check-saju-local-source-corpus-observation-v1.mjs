import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import {
  SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_CORPUS_SCHEMA,
  SAJU_LOCAL_SOURCE_CORPUS_VERSION,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'
import { ARTIFACT_PATH, INPUT_PATHS, buildArtifact } from './materialize-saju-local-source-corpus-observation-v1.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

function pdfPageCount(path) {
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' })
  const match = info.match(/^Pages:\s+(\d+)$/m)
  return match ? Number(match[1]) : null
}

function contentSha256(value) {
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalJson(copy)))
}

export async function checkArtifact(candidate, { root = ROOT, sourceRoot = SAJU_LOCAL_SOURCE_CORPUS_ROOT } = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  if (candidate.schemaVersion !== SAJU_LOCAL_SOURCE_CORPUS_SCHEMA || candidate.version !== SAJU_LOCAL_SOURCE_CORPUS_VERSION) fail('schema_or_version')
  if (candidate.verdictToken !== 'partial_saju_local_source_corpus_observation_advanced_uncommitted') fail('verdict')
  if (candidate.scope?.claimPromotion !== false || candidate.scope?.readinessMutation !== false || candidate.scope?.activationMutation !== false || candidate.scope?.historicalArtifactsRewritten !== false) fail('scope_boundary')
  if (candidate.observationMethod?.scanFirst !== true || candidate.observationMethod?.ocrCanonical !== false || candidate.observationMethod?.directVisualReview !== true) fail('scan_first_boundary')
  if (candidate.observationMethod?.renderProvenance?.renderer !== 'pdftoppm' || candidate.observationMethod?.renderProvenance?.rendererVersion !== '26.05.0' || candidate.observationMethod?.renderProvenance?.renderBytesRetained !== false || candidate.observationMethod?.renderProvenance?.renderHash !== 'not_retained; reproducible from source byte hash and render command') fail('render_provenance_boundary')
  if (canonicalJson(candidate.observationMethod?.sourceEvidenceAdmission) !== canonicalJson(SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY)) fail('admission_boundary')
  if (candidate.readiness?.status !== 'blocked_unchanged' || candidate.readiness?.availableForInterpretation !== false || candidate.readiness?.stableClaimBoundary !== 0 || candidate.readiness?.productionActivation !== 'blocked') fail('readiness_promoted')
  if (candidate.corpus?.inventoryScope !== 'five_prioritized_saju_texts_named_by_the_work_order') fail('inventory_scope')
  if (candidate.corpus?.documents?.length !== SAJU_LOCAL_SOURCE_DOCUMENTS.length) fail('document_count')

  const documentsById = new Map()
  for (const expected of SAJU_LOCAL_SOURCE_DOCUMENTS) {
    const actual = candidate.corpus?.documents?.find(document => document.sourceId === expected.sourceId)
    if (!actual) { fail(`document_missing:${expected.sourceId}`); continue }
    documentsById.set(actual.sourceId, actual)
    for (const field of ['fileName', 'observedTitle', 'sourceForm', 'pageCount', 'byteLength', 'expectedByteSha256', 'editionIdentity']) if (actual[field] !== expected[field]) fail(`document_metadata:${expected.sourceId}:${field}`)
    if (actual.corpusRoot !== sourceRoot || actual.byteObservation !== 'actual_local_file_bytes_sha256') fail(`document_provenance:${expected.sourceId}`)
    if (actual.editionIdentity !== 'unresolved_edition') fail(`edition_promoted:${expected.sourceId}`)
    try {
      const bytes = await readFile(join(sourceRoot, expected.fileName))
      const fileStat = await stat(join(sourceRoot, expected.fileName))
      if (fileStat.size !== expected.byteLength || sha256(bytes) !== expected.expectedByteSha256) fail(`source_byte_drift:${expected.sourceId}`)
      if (actual.byteSha256 !== sha256(bytes) || actual.byteLength !== fileStat.size || actual.pageCountObserved !== pdfPageCount(join(sourceRoot, expected.fileName))) fail(`observed_byte_identity:${expected.sourceId}`)
    } catch { fail(`source_unreadable:${expected.sourceId}`) }
  }

  const baselinePath = 'artifacts/saju-v1-local-frontier-v0/complete.json'
  let baseline = null
  try {
    const baselineBytes = await readFile(resolve(root, baselinePath))
    baseline = JSON.parse(baselineBytes)
    if (candidate.canonicalBaseline?.path !== baselinePath || candidate.canonicalBaseline?.byteSha256 !== sha256(baselineBytes)) fail('canonical_baseline_identity')
    if (candidate.canonicalBaseline?.claimCount !== baseline.scope?.canonicalClaimCount || candidate.canonicalBaseline?.occurrenceCount !== baseline.scope?.canonicalOccurrenceCount) fail('canonical_baseline_counts')
  } catch { fail('canonical_baseline_unreadable') }
  const packetIds = new Set((baseline?.acquisitionPackets || []).map(packet => packet.packetId))
  const claimIds = new Set((baseline?.acquisitionPackets || []).flatMap(packet => packet.claimIds || []))
  const observedIds = new Set()
  for (const item of candidate.observations || []) {
    if (observedIds.has(item.observationId)) fail(`duplicate_observation:${item.observationId}`)
    observedIds.add(item.observationId)
    if (!documentsById.has(item.sourceId)) fail(`observation_source_missing:${item.observationId}`)
    if (item.locator?.pageLocatorStatus !== 'direct_visual_scan_reviewed' || item.locator?.pdfPage !== item.locator?.printedPage && typeof item.locator?.pdfPage !== 'number') fail(`locator_invalid:${item.observationId}`)
    const document = documentsById.get(item.sourceId)
    if (document && (item.locator.pdfPage < 1 || item.locator.pdfPage > document.pageCount)) fail(`locator_out_of_range:${item.observationId}`)
    for (const packetId of item.claimPacketIds || []) if (!packetIds.has(packetId)) fail(`unknown_packet:${item.observationId}:${packetId}`)
    for (const packetId of item.claimPacketIds || []) {
      const packet = baseline?.acquisitionPackets?.find(candidatePacket => candidatePacket.packetId === packetId)
      for (const claimId of packet?.claimIds || []) if (!claimIds.has(claimId)) fail(`unknown_claim:${item.observationId}:${claimId}`)
    }
    if (item.evidenceLayers?.inheritedEvidence !== 'not_used' || item.admission?.canonicalTranscription !== false || item.admission?.claimVerification !== 'not_promoted' || item.admission?.independentAuthority !== 'not_established' || item.admission?.allowedUse !== 'locator_candidate_only') fail(`observation_promoted:${item.observationId}`)
  }
  const coverage = candidate.claimPacketCoverage || []
  for (const packet of baseline?.acquisitionPackets || []) {
    const entry = coverage.find(candidatePacket => candidatePacket.packetId === packet.packetId)
    if (!entry || JSON.stringify(entry.claimIds) !== JSON.stringify([...packet.claimIds].sort())) fail(`coverage_missing:${packet.packetId}`)
    if (entry?.sourceIdentityStatus !== SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY.sourceIdentity || entry?.claimVerification !== 'not_promoted') fail(`coverage_promoted:${packet.packetId}`)
  }

  const identityErrors = checkArtifactIdentity(candidate, { root, artifactId: SAJU_LOCAL_SOURCE_CORPUS_SCHEMA, materializerPath: 'scripts/materialize-saju-local-source-corpus-observation-v1.mjs', materializerVersion: SAJU_LOCAL_SOURCE_CORPUS_VERSION, allowGenerationBaseInput: true })
  errors.push(...identityErrors)
  const expectedHead = currentHead()
  if (candidate.basisHead === expectedHead && candidate.artifactIdentity?.generation?.baseHead === expectedHead) {
    const expected = await buildArtifact()
    if (canonicalJson(candidate) !== canonicalJson(expected)) fail('materialized_content')
  }
  if (candidate.contentSha256 !== contentSha256(candidate)) fail('content_hash')

  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = resolve(ROOT, process.argv[2] || ARTIFACT_PATH)
  const artifact = JSON.parse(await readFile(artifactPath))
  const errors = await checkArtifact(artifact)
  try {
    const bytes = await readFile(artifactPath)
    const integrity = JSON.parse(await readFile(`${artifactPath}.integrity.json`, 'utf8'))
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar')
  } catch { errors.push('integrity_sidecar_missing_or_invalid') }
  console.log(JSON.stringify({ pass: errors.length === 0, basisHead: artifact.basisHead || null, currentHead: currentHead(), sourceCount: artifact.corpus?.documents?.length || 0, observationCount: artifact.observations?.length || 0, observedPackets: (artifact.claimPacketCoverage || []).filter(packet => packet.observedLocatorCount > 0).length, errors }, null, 2))
  if (errors.length) process.exitCode = 1
}
