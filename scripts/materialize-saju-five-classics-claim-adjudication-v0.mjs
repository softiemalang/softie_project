import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  buildSajuFiveClassicsClaimAdjudication,
} from '../src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'
import {
  buildArtifact as buildSourceFrontierArtifact,
} from './materialize-saju-five-classics-source-identity-frontier-v0.mjs'

export const SCHEMA = 'saju-five-classics-claim-adjudication-v0'
export const VERSION = '0.1.0'
export const ARTIFACT_PATH = 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json'
export const INTEGRITY_PATH = ARTIFACT_PATH + '.integrity.json'
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js',
  'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js',
  'src/interpretationPrep/sajuLocalSourceCorpusEvidence.js',
  'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs',
  'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
]

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

export async function buildArtifact() {
  const basisHead = currentHead()
  const sourceFrontier = await buildSourceFrontierArtifact()
  const payload = buildSajuFiveClassicsClaimAdjudication({ basisHead, sourceFrontier })
  return attachArtifactIdentity(payload, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const target = resolve(root, outputPath)
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalIdentityJson(artifact))
  const integrity = {
    schemaVersion: SCHEMA + '-integrity-v0',
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(resolve(root, outputPath + '.integrity.json'), canonicalIdentityJson(integrity))
  return {
    status: 'materialized',
    artifactPath: outputPath,
    claimCount: artifact.claims.length,
    externalRecordCount: artifact.externalRecordObservations.length,
    sourceFrontierObservationCount: artifact.inventory.counts.sourceFrontierEvidenceObservationIds,
    readiness: artifact.readiness,
    contentSha256: artifact.contentSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
