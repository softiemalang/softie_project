#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import {
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'

export const SCHEMA = 'saju-source-claim-observation-v1'
export const VERSION = '1.0.0'
export const ARTIFACT_PATH = 'artifacts/saju-source-claim-observation-v1/complete.json'
export const PREDECESSOR_PATH = 'artifacts/saju-local-source-corpus-observation-v1/complete.json'
export const INPUT_PATHS = [
  PREDECESSOR_PATH,
  'src/interpretationPrep/sajuLocalSourceCorpusEvidence.js',
  'scripts/materialize-saju-source-claim-observation-v1.mjs',
]

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const sourceDocument = SAJU_LOCAL_SOURCE_DOCUMENTS.find(document => document.sourceId === 'saju-source-ziping-zhenquan')

function pdfPageCount(path) {
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' })
  const match = info.match(/^Pages:\s+(\d+)$/m)
  if (!match) throw new Error(`pdf page count unavailable: ${path}`)
  return Number(match[1])
}

const directTranscription = [
  '刑者，三刑也，子卯巳申寅之类也。',
  '冲者，六冲也，子午卯酉之类是也。',
  '会者，三会也，申子辰之类是也。',
  '合者，六合也，子与丑合之类是也。',
  '此皆以地支宫分而言，系对射之意也。',
  '三方为会，朋友之意也。并对为合，比邻之意也。',
].join('\n')

const claimIds = [
  'saju.natal.branch-relation.day-hour-육합',
  'saju.natal.branch-relation.day-hour-충',
  'saju.natal.branch-relation.day-hour-파',
  'saju.natal.branch-relation.day-hour-형',
  'saju.natal.branch-relation.half-trine-목-year-day',
  'saju.natal.branch-relation.half-trine-수-day-hour',
  'saju.natal.branch-relation.half-trine-수-month-hour',
  'saju.natal.branch-relation.month-day-육합',
  'saju.natal.branch-relation.month-day-충',
  'saju.natal.branch-relation.month-day-파',
  'saju.natal.branch-relation.month-day-형',
  'saju.natal.branch-relation.month-hour-육합',
  'saju.natal.branch-relation.month-hour-충',
  'saju.natal.branch-relation.month-hour-형',
  'saju.natal.branch-relation.year-day-육합',
  'saju.natal.branch-relation.year-day-충',
  'saju.natal.branch-relation.year-day-파',
  'saju.natal.branch-relation.year-hour-육합',
  'saju.natal.branch-relation.year-hour-충',
  'saju.natal.branch-relation.year-hour-파',
  'saju.natal.branch-relation.year-month-육합',
  'saju.natal.branch-relation.year-month-파',
  'saju.natal.branch-relation.year-month-형',
]

function contentSha256(value) {
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalJson(copy)))
}

export async function buildArtifact() {
  if (!sourceDocument) throw new Error('source document metadata missing')
  const sourcePath = join(SAJU_LOCAL_SOURCE_CORPUS_ROOT, sourceDocument.fileName)
  const [sourceBytes, predecessorBytes] = await Promise.all([
    readFile(sourcePath),
    readFile(resolve(root, PREDECESSOR_PATH)),
  ])
  const sourceStat = await stat(sourcePath)
  const predecessor = JSON.parse(predecessorBytes)
  const sourceSha256 = sha256(sourceBytes)
  const sourcePageCount = pdfPageCount(sourcePath)
  if (sourceSha256 !== sourceDocument.expectedByteSha256 || sourceStat.size !== sourceDocument.byteLength || sourcePageCount !== sourceDocument.pageCount) {
    throw new Error('source document identity drift')
  }

  const artifact = {
    schemaVersion: SCHEMA,
    version: VERSION,
    verdictToken: 'partial_saju_source_claim_observation_advanced_uncommitted',
    basisHead: currentHead(),
    predecessor: {
      artifact: PREDECESSOR_PATH,
      byteSha256: sha256(predecessorBytes),
      schemaVersion: predecessor.schemaVersion,
      historicalArtifactRewritten: false,
    },
    scope: {
      repositoryOnly: true,
      localCorpusRead: true,
      networkOrSourceAcquisition: false,
      manualVisualTranscription: true,
      ocrCanonical: false,
      claimPromotion: false,
      readinessMutation: false,
      activationMutation: false,
      productionRuleMutation: false,
      historicalArtifactsRewritten: false,
    },
    sourceIdentity: {
      corpusRoot: SAJU_LOCAL_SOURCE_CORPUS_ROOT,
      sourceId: sourceDocument.sourceId,
      fileName: sourceDocument.fileName,
      byteLength: sourceStat.size,
      byteSha256: sourceSha256,
      pageCountObserved: sourcePageCount,
      editionIdentity: 'unresolved_edition',
      sourceForm: sourceDocument.sourceForm,
    },
    observationMethod: {
      scanFirst: true,
      directVisualReview: true,
      transcriptionMethod: 'manual_visual_transcription_from_rendered_page',
      ocrCanonical: false,
      render: {
        renderer: 'pdftoppm',
        rendererVersion: '26.05.0',
        commandTemplate: 'pdftoppm -f 5 -l 5 -r 180 -jpeg -singlefile <source-pdf> <scratch-output-prefix>',
        page: 5,
        outputFormat: 'jpeg',
        renderBytesRetained: false,
        layoutAndGlyphUncertainty: 'sentence glyphs were visually legible; example tables and full edition transmission were not admitted',
      },
    },
    observations: [{
      observationId: 'ziping-p5-branch-relation-definitions-direct-transcription',
      sourceId: sourceDocument.sourceId,
      locator: {
        pdfPage: 5,
        printedPage: '5',
        heading: '七、论刑冲会合解法',
        pageLocatorStatus: 'direct_visual_scan_reviewed',
      },
      claimPacketId: 'saju-source-packet-rule-branch-relations-v0',
      claimIds,
      directObservation: {
        visibleHeading: true,
        visibleDefinitionScope: ['刑', '冲', '会', '合', '三方', '并对'],
        transcription: directTranscription,
        transcriptionStatus: 'direct_observation_candidate_not_canonical_source_text',
        exampleTablesPresent: true,
        exampleTablesTranscription: 'not_admitted_due_layout_and_table-cell_boundary_uncertainty',
      },
      evidenceLayers: {
        directObservation: 'rendered page heading and the adjacent definition sentences were visually reviewed',
        inheritedEvidence: 'the predecessor locator is referenced only as provenance and was not used as a direct observation',
        deterministicRelation: 'the observation names the relation categories represented in the page; it does not validate repository lookup outputs',
        inference: 'the visible sentences are a candidate source locator for the linked branch-relation packet, not a complete rule or semantic authority',
        interpretation: 'not_created',
        unresolved: [
          'local PDF edition identity and transmission history remain unresolved',
          'no independent alternate witness or claim-level edition linkage is admitted',
          'example-table transcription and full relation coverage remain outside this observation',
        ],
      },
      admission: {
        status: 'local_direct_observation_admitted_with_limits',
        canonicalTranscription: false,
        claimVerification: 'not_promoted',
        independentAuthority: 'not_established',
        allowedUse: 'source-locator-and-transcription-candidate_only',
      },
    }],
    claimBoundary: {
      linkedPacket: 'saju-source-packet-rule-branch-relations-v0',
      observedClaimCount: 23,
      stableClaimCount: 0,
      repositoryRuleSelection: 'not_performed',
      conflictWinner: 'not_selected',
      readinessImpact: 'blocked_unchanged',
    },
    readiness: {
      status: 'blocked_unchanged',
      availableForInterpretation: false,
      stableClaimBoundary: 0,
      productionActivation: 'blocked',
      reason: 'direct page observation improves source provenance but does not establish edition identity, complete claim support, semantic equivalence, or independent verification',
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentSha256(artifact)
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-source-claim-observation-v1.mjs',
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
  return { output: outputPath, artifactByteSha256: integrity.artifactByteSha256, contentSha256: artifact.contentSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
