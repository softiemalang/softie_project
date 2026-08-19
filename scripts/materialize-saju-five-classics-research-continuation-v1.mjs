import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  PREDECESSOR_ARTIFACT_PATHS,
  SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_SCHEMA,
  SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_VERSION,
  buildSajuFiveClassicsResearchContinuation,
} from '../src/interpretationPrep/sajuFiveClassicsResearchContinuation.js'

export const SCHEMA = SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_SCHEMA
export const VERSION = SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-five-classics-research-continuation-v1/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/boundedContinuationGate.js',
  'src/interpretationPrep/sajuFiveClassicsResearchContinuation.js',
  PREDECESSOR_ARTIFACT_PATHS.sourceFrontier,
  PREDECESSOR_ARTIFACT_PATHS.claimAdjudication,
  PREDECESSOR_ARTIFACT_PATHS.timingAuthority,
  'scripts/materialize-saju-five-classics-research-continuation-v1.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

export async function buildArtifact() {
  const [sourceFrontier, claimAdjudication, timingAuthority] = await Promise.all([
    readJson(PREDECESSOR_ARTIFACT_PATHS.sourceFrontier),
    readJson(PREDECESSOR_ARTIFACT_PATHS.claimAdjudication),
    readJson(PREDECESSOR_ARTIFACT_PATHS.timingAuthority),
  ])
  const basisHead = currentHead()
  const artifact = buildSajuFiveClassicsResearchContinuation({ basisHead, sourceFrontier, claimAdjudication, timingAuthority })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-research-continuation-v1.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalIdentityJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v0`,
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
    activeClaimCount: artifact.claims.length,
    splitClaimCount: artifact.inventory.counts.splitClaims,
    sourceCount: artifact.sources.length,
    observationCount: artifact.observations.length,
    blockerCount: artifact.blockers.length,
    contentSha256: artifact.contentSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
