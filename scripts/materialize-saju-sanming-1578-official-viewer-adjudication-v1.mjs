#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  PREDECESSOR_ARTIFACT_PATH,
  SAJU_SANMING_1578_OFFICIAL_VIEWER_SCHEMA,
  SAJU_SANMING_1578_OFFICIAL_VIEWER_VERSION,
  buildSajuSanming1578OfficialViewerAdjudication,
} from '../src/interpretationPrep/sajuSanming1578OfficialViewerAdjudicationV1.js'

export const SCHEMA = SAJU_SANMING_1578_OFFICIAL_VIEWER_SCHEMA
export const VERSION = SAJU_SANMING_1578_OFFICIAL_VIEWER_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-sanming-1578-official-viewer-adjudication-v1/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATHS = [PREDECESSOR_ARTIFACT_PATH]
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuSanming1578OfficialViewerAdjudicationV1.js',
  ...PREDECESSOR_PATHS,
  'scripts/materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

const readJson = async path => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))

export async function buildArtifact() {
  const predecessor = await readJson(PREDECESSOR_ARTIFACT_PATH)
  const basisHead = currentHead()
  const artifact = buildSajuSanming1578OfficialViewerAdjudication({ basisHead, predecessor })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalIdentityJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v1`,
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(resolve(ROOT, outputPath)), { recursive: true })
  await writeFile(resolve(ROOT, outputPath), bytes)
  await writeFile(resolve(ROOT, `${outputPath}.integrity.json`), canonicalIdentityJson(integrity))
  return {
    status: 'materialized',
    artifactPath: outputPath,
    screenshotEvidenceCount: artifact.summary.screenshotEvidenceCount,
    identityContextPageCount: artifact.summary.identityContextPageCount,
    volumeSequenceContextCaptureCount: artifact.summary.volumeSequenceContextCaptureCount,
    folioReadabilityCaptureCount: artifact.summary.folioReadabilityCaptureCount,
    folioReadabilityResult: artifact.summary.folioReadabilityResult,
    boundedViewerVolumeSequenceObserved: artifact.summary.boundedViewerVolumeSequenceObserved,
    targetPageCount: artifact.summary.targetPageCount,
    officialPageBytesObtained: artifact.summary.officialPageBytesObtained,
    printedFolioClosed: artifact.summary.printedFolioClosed,
    copyLineageClosed: artifact.summary.copyLineageClosed,
    promotionCount: artifact.summary.promotionCount,
    blockers: artifact.blockers,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
