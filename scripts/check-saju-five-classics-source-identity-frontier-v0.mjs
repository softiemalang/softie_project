#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  artifactPayloadSha256,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from '../src/interpretationPrep/sajuLocalSourceCorpusEvidence.js'
import {
  buildSajuFiveClassicsSourceIdentityFrontier,
  checkSajuFiveClassicsSourceIdentityFrontier,
} from '../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  SCHEMA,
  VERSION,
  readLocalDocuments,
} from './materialize-saju-five-classics-source-identity-frontier-v0.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
const contentSha256 = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

const withoutVolatileIdentity = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return copy
}

async function checkIntegritySidecar({ root, artifactPath }) {
  try {
    const bytes = await readFile(resolve(root, artifactPath))
    const integrity = JSON.parse(await readFile(resolve(root, `${artifactPath}.integrity.json`), 'utf8'))
    if (integrity.artifactPath !== artifactPath) return ['integrity_sidecar_artifact_path']
    if (integrity.hashScope !== 'exact UTF-8 bytes of complete.json including final LF') return ['integrity_sidecar_hash_scope']
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) return ['integrity_sidecar']
  } catch {
    return ['integrity_sidecar_missing_or_invalid']
  }
  return []
}

export async function checkArtifact(candidate, {
  root = ROOT,
  sourceRoot = SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  historical = false,
  artifactPath = ARTIFACT_PATH,
} = {}) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  errors.push(...checkSajuFiveClassicsSourceIdentityFrontier(candidate, { expectedLocalDocuments: SAJU_LOCAL_SOURCE_DOCUMENTS }))

  if (historical) {
    errors.push(...checkArtifactIdentity(candidate, {
      root,
      artifactId: SCHEMA,
      materializerPath: 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
      materializerVersion: VERSION,
      allowGenerationBaseInput: true,
      verifierInputPaths: INPUT_PATHS,
    }))
    if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
    errors.push(...await checkIntegritySidecar({ root, artifactPath }))
    return [...new Set(errors)].sort()
  }

  let localDocuments
  try {
    localDocuments = await readLocalDocuments(sourceRoot)
  } catch (error) {
    errors.push(`local_source_read:${error.message}`)
  }
  if (localDocuments) {
    const expected = buildSajuFiveClassicsSourceIdentityFrontier({ basisHead: candidate.basisHead, localDocuments })
    expected.contentSha256 = contentSha256(expected)
    if (canonicalIdentityJson(withoutVolatileIdentity(candidate)) !== canonicalIdentityJson(withoutVolatileIdentity(expected))) errors.push('materialized_content')
    if (candidate.contentSha256 !== expected.contentSha256) errors.push('content_hash_drift')
  }

  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  errors.push(...await checkIntegritySidecar({ root, artifactPath }))
  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactArgument = process.argv.slice(2).find(argument => !argument.startsWith('--'))
  const artifactPath = artifactArgument || ARTIFACT_PATH
  const historical = process.argv.includes('--historical')
  const artifact = JSON.parse(await readFile(resolve(ROOT, artifactPath), 'utf8'))
  const errors = await checkArtifact(artifact, { historical, artifactPath })
  const sourceReadFailed = errors.some(error => error.startsWith('local_source_read:'))
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    historicalSnapshotMode: historical,
    sourceProfile: !historical,
    externalPdfRead: !historical,
    sourceBytesReverified: !historical && !sourceReadFailed,
    sourceBytesRequiredForCurrentReplay: true,
    schema: artifact.schemaVersion || null,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    workCount: artifact.works?.length || 0,
    sourceCount: artifact.sources?.length || 0,
    localTextWitnessCount: artifact.inventory?.counts?.localTextWitnesses || 0,
    pageObservationCount: artifact.pageObservations?.length || 0,
    claimRelationCount: artifact.claimRelations?.length || 0,
    lineageRelationCount: artifact.lineageRelations?.length || 0,
    blockerCount: artifact.blockers?.length || 0,
    readiness: artifact.readiness || null,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
