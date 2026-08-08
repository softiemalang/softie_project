import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import {
  SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_CORPUS_SCHEMA,
  SAJU_LOCAL_SOURCE_CORPUS_VERSION,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
  SAJU_LOCAL_SOURCE_OBSERVATIONS,
} from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'

export const SCHEMA = SAJU_LOCAL_SOURCE_CORPUS_SCHEMA
export const VERSION = SAJU_LOCAL_SOURCE_CORPUS_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-local-source-corpus-observation-v1/complete.json'
export const INPUT_PATHS = [
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  'src/interpretationPrep/sajuLocalSourceCorpusEvidence.js',
  'scripts/materialize-saju-local-source-corpus-observation-v1.mjs',
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

async function readSourceDocument(document) {
  const path = join(SAJU_LOCAL_SOURCE_CORPUS_ROOT, document.fileName)
  const bytes = await readFile(path)
  const fileStat = await stat(path)
  const byteSha256 = sha256(bytes)
  const actualPageCount = pdfPageCount(path)
  if (fileStat.size !== document.byteLength) throw new Error(`source byte length drift: ${document.fileName}`)
  if (byteSha256 !== document.expectedByteSha256) throw new Error(`source byte hash drift: ${document.fileName}`)
  if (actualPageCount !== document.pageCount) throw new Error(`source page count drift: ${document.fileName}`)
  return {
    ...document,
    corpusRoot: SAJU_LOCAL_SOURCE_CORPUS_ROOT,
    byteSha256,
    byteLength: fileStat.size,
    pageCountObserved: actualPageCount,
    byteObservation: 'actual_local_file_bytes_sha256',
  }
}

export async function buildArtifact() {
  const baselinePath = 'artifacts/saju-v1-local-frontier-v0/complete.json'
  const baselineBytes = await readFile(resolve(root, baselinePath))
  const baseline = JSON.parse(baselineBytes)
  const packetMap = new Map((baseline.acquisitionPackets || []).map(packet => [packet.packetId, packet]))
  const documents = await Promise.all(SAJU_LOCAL_SOURCE_DOCUMENTS.map(readSourceDocument))
  const observations = SAJU_LOCAL_SOURCE_OBSERVATIONS.map(item => {
    if (!packetMap.has(item.claimPacketIds[0])) throw new Error(`unknown claim packet: ${item.claimPacketIds[0]}`)
    for (const packetId of item.claimPacketIds) if (!packetMap.has(packetId)) throw new Error(`unknown claim packet: ${packetId}`)
    return item
  })
  const claimPacketCoverage = [...packetMap.values()].map(packet => {
    const packetObservations = observations.filter(item => item.claimPacketIds.includes(packet.packetId))
    return {
      packetId: packet.packetId,
      subject: packet.subject,
      claimIds: [...packet.claimIds].sort(),
      observedLocatorCount: packetObservations.length,
      observationIds: packetObservations.map(item => item.observationId).sort(),
      sourceIdentityStatus: SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY.sourceIdentity,
      claimVerification: SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY.claimVerification,
      status: packetObservations.length > 0 ? 'locator_candidates_observed_with_limits' : 'not_observed_in_this_milestone',
    }
  })
  const artifact = {
    schemaVersion: SCHEMA,
    version: VERSION,
    verdictToken: 'partial_saju_local_source_corpus_observation_advanced_uncommitted',
    basisHead: currentHead(),
    scope: {
      repositoryOnly: true,
      localCorpusRead: true,
      networkOrSourceAcquisition: false,
      claimPromotion: false,
      readinessMutation: false,
      activationMutation: false,
      historicalArtifactsRewritten: false,
    },
    corpus: {
      root: SAJU_LOCAL_SOURCE_CORPUS_ROOT,
      inventoryScope: 'five_prioritized_saju_texts_named_by_the_work_order',
      documents,
    },
    observationMethod: {
      scanFirst: true,
      ocrCanonical: false,
      directVisualReview: true,
      renderedPageLocator: 'PDF page and printed page are retained separately',
      renderProvenance: {
        renderer: 'pdftoppm',
        rendererVersion: '26.05.0',
        outputFormat: 'jpeg',
        scaleTo: 1400,
        renderBytesRetained: false,
        renderHash: 'not_retained; reproducible from source byte hash and render command',
        layoutAndGlyphUncertainty: 'headings and nearby prose were visually legible; full-body transcription, table-cell boundaries, and edition-level glyph authority were not admitted',
      },
      sourceEvidenceAdmission: SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
    },
    observations,
    claimPacketCoverage,
    canonicalBaseline: {
      path: baselinePath,
      byteSha256: sha256(baselineBytes),
      claimCount: baseline.scope?.canonicalClaimCount,
      occurrenceCount: baseline.scope?.canonicalOccurrenceCount,
      classicalVerification: 'not_established_unchanged',
      historicalArtifactRewritten: false,
    },
    admissionReview: {
      directObservation: 'admitted_with_limits',
      inheritedEvidence: 'not_used_as_direct_observation',
      inference: 'packet_locator_candidate_only',
      unresolved: [
        'all five local files have verified current bytes but edition identity remains unresolved',
        'modern/web-derived exports and source warnings prevent treating the files as independent primary authority',
        'no claim-level source sentence has been promoted to repository rule authority',
        'no cross-edition conflict winner or independent oracle was selected',
      ],
    },
    readiness: {
      status: 'blocked_unchanged',
      availableForInterpretation: false,
      stableClaimBoundary: 0,
      productionActivation: 'blocked',
      reason: 'local locator observation improves provenance but does not establish edition, semantic equivalence, or independent verification',
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentSha256(artifact)
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-local-source-corpus-observation-v1.mjs',
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
  return { output: outputPath, artifactByteSha256: integrity.artifactByteSha256, contentSha256: artifact.contentSha256, observationCount: artifact.observations.length }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
