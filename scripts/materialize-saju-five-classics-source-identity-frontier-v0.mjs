import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'
import {
  SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_SCHEMA,
  SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_VERSION,
  buildSajuFiveClassicsSourceIdentityFrontier,
} from '../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js'

export const SCHEMA = SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_SCHEMA
export const VERSION = SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const INPUT_PATHS = [
  'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js',
  'src/interpretationPrep/sajuLocalSourceCorpusEvidence.js',
  'artifacts/saju-local-source-corpus-observation-v1/complete.json',
  'artifacts/saju-five-classics-grounding-v0/complete.json',
  'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
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

export async function readLocalDocuments(sourceRoot = SAJU_LOCAL_SOURCE_CORPUS_ROOT) {
  return Promise.all(SAJU_LOCAL_SOURCE_DOCUMENTS.map(async document => {
    const path = join(sourceRoot, document.fileName)
    const [bytes, fileStat] = await Promise.all([readFile(path), stat(path)])
    const byteSha256 = sha256(bytes)
    const pageCountObserved = pdfPageCount(path)
    if (fileStat.size !== document.byteLength) throw new Error(`source byte length drift: ${document.fileName}`)
    if (byteSha256 !== document.expectedByteSha256) throw new Error(`source byte hash drift: ${document.fileName}`)
    if (pageCountObserved !== document.pageCount) throw new Error(`source page count drift: ${document.fileName}`)
    return {
      ...document,
      corpusRoot: sourceRoot,
      byteSha256,
      byteLength: fileStat.size,
      pageCountObserved,
      byteObservation: 'actual_local_file_bytes_sha256',
    }
  }))
}

const contentSha256 = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

export async function buildArtifact() {
  const basisHead = currentHead()
  const localDocuments = await readLocalDocuments()
  const artifact = buildSajuFiveClassicsSourceIdentityFrontier({ basisHead, localDocuments })
  artifact.contentSha256 = contentSha256(artifact)
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
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
    schemaVersion: `${SCHEMA}-integrity-v0`,
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(resolve(root, `${outputPath}.integrity.json`), canonicalIdentityJson(integrity))
  return {
    status: 'materialized',
    artifactPath: outputPath,
    workCount: artifact.works.length,
    sourceCount: artifact.sources.length,
    pageObservationCount: artifact.pageObservations.length,
    claimRelationCount: artifact.claimRelations.length,
    lineageRelationCount: artifact.lineageRelations.length,
    blockerCount: artifact.blockers.length,
    contentSha256: artifact.contentSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
