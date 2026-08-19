#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import {
  artifactPayloadSha256,
  attachArtifactIdentity,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  buildSajuFiveClassicsResearchContinuation,
  checkSajuFiveClassicsResearchContinuation,
  PREDECESSOR_ARTIFACT_PATHS,
} from '../src/interpretationPrep/sajuFiveClassicsResearchContinuation.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from './materialize-saju-five-classics-research-continuation-v1.mjs'

export const HISTORICAL_CHECKER_PATH = 'scripts/check-saju-five-classics-research-continuation-v1-historical.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = root => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'],
  { cwd: root, encoding: 'utf8' },
).trim()

const unique = values => [...new Set(values)].sort()

export function verifyIntegritySidecar({ artifactPath, bytes, integrity }) {
  const errors = []
  if (!integrity || typeof integrity !== 'object' || Array.isArray(integrity)) {
    return [`integrity_sidecar_missing_or_invalid:${artifactPath}`]
  }
  if (typeof integrity.schemaVersion !== 'string' || !integrity.schemaVersion.endsWith('-integrity-v0')) {
    errors.push(`integrity_schema:${artifactPath}`)
  }
  if (integrity.hashScope !== 'exact UTF-8 bytes of complete.json including final LF') {
    errors.push(`integrity_hash_scope:${artifactPath}`)
  }
  if (integrity.artifactPath !== artifactPath) errors.push(`integrity_artifact_path:${artifactPath}`)
  if (integrity.artifactByteSha256 !== sha256(bytes)) errors.push(`integrity_artifact_byte_sha256:${artifactPath}`)
  if (integrity.byteLength !== bytes.length) errors.push(`integrity_artifact_byte_length:${artifactPath}`)
  return unique(errors)
}

async function readJson(root, artifactPath) {
  return JSON.parse(await readFile(resolve(root, artifactPath), 'utf8'))
}

async function readArtifactWithSidecar(root, artifactPath) {
  const errors = []
  let bytes = null
  let artifact = null
  let integrity = null
  try {
    bytes = await readFile(resolve(root, artifactPath))
  } catch {
    errors.push(`artifact_missing:${artifactPath}`)
  }
  if (bytes) {
    try {
      artifact = JSON.parse(bytes.toString('utf8'))
    } catch {
      errors.push(`artifact_json_invalid:${artifactPath}`)
    }
  }
  try {
    integrity = JSON.parse(await readFile(resolve(root, `${artifactPath}.integrity.json`), 'utf8'))
  } catch {
    errors.push(`integrity_sidecar_missing_or_invalid:${artifactPath}`)
  }
  if (bytes && integrity) errors.push(...verifyIntegritySidecar({ artifactPath, bytes, integrity }))
  return {
    artifact,
    artifactByteSha256: bytes ? sha256(bytes) : null,
    bytes,
    errors: unique(errors),
    integrity,
  }
}

export async function checkHistoricalArtifact(
  candidate,
  { root = ROOT, artifactPath = ARTIFACT_PATH } = {},
) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {
      artifactSidecar: { status: 'fail', errors: ['artifact_shape_invalid'] },
      errors: ['artifact_shape_invalid'],
      historicalReplay: false,
      predecessorSidecars: [],
    }
  }

  const stored = await readArtifactWithSidecar(root, artifactPath)
  errors.push(...stored.errors)
  if (stored.artifact && canonicalIdentityJson(stored.artifact) !== canonicalIdentityJson(candidate)) {
    errors.push('candidate_file_mismatch')
  }

  const predecessorEntries = await Promise.all(Object.entries(PREDECESSOR_ARTIFACT_PATHS).map(async ([name, path]) => ({
    name,
    path,
    ...(await readArtifactWithSidecar(root, path)),
  })))
  const predecessorSidecars = predecessorEntries.map(entry => ({
    artifactByteSha256: entry.artifactByteSha256,
    errors: entry.errors,
    name: entry.name,
    path: entry.path,
    status: entry.errors.length ? 'fail' : 'pass',
  }))
  for (const entry of predecessorEntries) errors.push(...entry.errors)

  const sourceFrontier = predecessorEntries.find(entry => entry.name === 'sourceFrontier')?.artifact
  const claimAdjudication = predecessorEntries.find(entry => entry.name === 'claimAdjudication')?.artifact
  const timingAuthority = predecessorEntries.find(entry => entry.name === 'timingAuthority')?.artifact
  if (sourceFrontier && claimAdjudication && timingAuthority) {
    errors.push(...checkSajuFiveClassicsResearchContinuation(candidate, {
      claimAdjudication,
      sourceFrontier,
      timingAuthority,
    }))
  } else {
    errors.push('predecessor_artifact_missing_or_invalid')
  }

  errors.push(...checkArtifactIdentity(candidate, {
    allowGenerationBaseInput: true,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-research-continuation-v1.mjs',
    materializerVersion: VERSION,
    root,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.basisHead !== candidate.artifactIdentity?.generation?.baseHead) {
    errors.push('basis_head_identity')
  }
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) {
    errors.push('artifact_payload_hash')
  }

  let historicalReplay = false
  if (sourceFrontier && claimAdjudication && timingAuthority && candidate.artifactIdentity) {
    const replayPayload = buildSajuFiveClassicsResearchContinuation({
      basisHead: candidate.basisHead,
      claimAdjudication,
      sourceFrontier,
      timingAuthority,
    })
    const replay = attachArtifactIdentity(replayPayload, candidate.artifactIdentity)
    historicalReplay = canonicalIdentityJson(replay) === canonicalIdentityJson(candidate)
    if (!historicalReplay) errors.push('historical_replay_content')
  }

  return {
    artifactByteSha256: stored.artifactByteSha256,
    artifactSidecar: {
      artifactByteSha256: stored.artifactByteSha256,
      errors: stored.errors,
      path: artifactPath,
      status: stored.errors.length ? 'fail' : 'pass',
    },
    errors: unique(errors),
    historicalReplay,
    predecessorSidecars,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) || ARTIFACT_PATH
  let artifact = null
  const loadErrors = []
  try {
    artifact = await readJson(ROOT, artifactPath)
  } catch {
    loadErrors.push(`artifact_json_invalid:${artifactPath}`)
  }
  const result = artifact
    ? await checkHistoricalArtifact(artifact, { artifactPath, root: ROOT })
    : {
        artifactSidecar: { status: 'fail', errors: loadErrors },
        errors: loadErrors,
        historicalReplay: false,
        predecessorSidecars: [],
      }
  const errors = unique(result.errors)
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    mode: 'historical',
    historicalSnapshotMode: true,
    historicalReplay: result.historicalReplay,
    externalPdfRead: false,
    basisHead: artifact?.basisHead || null,
    currentHead: currentHead(ROOT),
    artifactByteSha256: result.artifactByteSha256 || null,
    artifactSidecar: result.artifactSidecar,
    predecessorSidecars: result.predecessorSidecars,
    readiness: artifact?.readiness || null,
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
