#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  artifactPayloadSha256,
  attachArtifactIdentity,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  buildSajuGeminiWitnessDossierAdjudication,
  checkSajuGeminiWitnessDossierAdjudication,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudication.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  PREDECESSOR_PATH,
  ROOT,
  SCHEMA,
  VERSION,
} from './materialize-saju-gemini-witness-dossier-adjudication-v1.mjs'
import {
  checkHistoricalArtifact as checkTypedHistoricalArtifact,
  verifyIntegritySidecar,
} from './check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'

export const HISTORICAL_CHECKER_PATH = 'scripts/check-saju-gemini-witness-dossier-adjudication-v1-historical.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const unique = values => [...new Set(values)].sort()
const currentHead = root => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'],
  { cwd: root, encoding: 'utf8' },
).trim()

async function readJson(root, path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'))
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

function predecessorReference(typedReadiness) {
  return {
    artifactPath: PREDECESSOR_PATH,
    schemaVersion: typedReadiness?.schemaVersion || null,
    version: typedReadiness?.version || null,
    basisHead: typedReadiness?.basisHead || null,
    contentSha256: typedReadiness?.contentSha256 || null,
    artifactPayloadSha256: typedReadiness?.artifactIdentity?.artifactPayloadSha256 || null,
    readiness: typedReadiness?.readiness || null,
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
      typedPredecessor: null,
    }
  }

  const stored = await readArtifactWithSidecar(root, artifactPath)
  errors.push(...stored.errors)
  if (stored.artifact && canonicalIdentityJson(stored.artifact) !== canonicalIdentityJson(candidate)) {
    errors.push('candidate_file_mismatch')
  }

  const typedStored = await readArtifactWithSidecar(root, PREDECESSOR_PATH)
  errors.push(...typedStored.errors)
  let typedResult = null
  if (typedStored.artifact) {
    typedResult = await checkTypedHistoricalArtifact(typedStored.artifact, {
      artifactPath: PREDECESSOR_PATH,
      root,
    })
    errors.push(...typedResult.errors.map(error => `typed:${error}`))
  } else {
    errors.push('typed_predecessor_missing_or_invalid')
  }

  const typedReadiness = typedStored.artifact
  if (typedReadiness) {
    errors.push(...checkSajuGeminiWitnessDossierAdjudication(candidate))
    if (canonicalIdentityJson(candidate.predecessorReadinessReference) !== canonicalIdentityJson(predecessorReference(typedReadiness))) {
      errors.push('predecessor_identity')
    }
  }

  errors.push(...checkArtifactIdentity(candidate, {
    allowGenerationBaseInput: true,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-gemini-witness-dossier-adjudication-v1.mjs',
    materializerVersion: VERSION,
    root,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.basisHead !== candidate.artifactIdentity?.generation?.baseHead) errors.push('basis_head_identity')
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) {
    errors.push('artifact_payload_hash')
  }
  const predecessorInput = candidate.artifactIdentity?.inputs?.find(input => input.path === PREDECESSOR_PATH)
  if (typedStored.bytes && predecessorInput?.byteSha256 !== sha256(typedStored.bytes)) {
    errors.push('predecessor_byte_identity')
  }

  let historicalReplay = false
  if (typedReadiness && candidate.artifactIdentity) {
    const replayPayload = buildSajuGeminiWitnessDossierAdjudication({
      basisHead: candidate.basisHead,
      typedReadinessReference: predecessorReference(typedReadiness),
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
    typedPredecessor: typedResult
      ? {
          artifactByteSha256: typedResult.artifactByteSha256,
          errors: typedResult.errors,
          historicalReplay: typedResult.historicalReplay,
          status: typedResult.errors.length ? 'fail' : 'pass',
        }
      : null,
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
        typedPredecessor: null,
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
    typedPredecessor: result.typedPredecessor,
    readiness: artifact?.readinessOverlay?.parentVerified || null,
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
