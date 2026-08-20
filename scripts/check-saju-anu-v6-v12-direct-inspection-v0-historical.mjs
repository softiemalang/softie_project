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
  buildSajuAnuV6V12DirectInspection,
  checkSajuAnuV6V12DirectInspection,
} from '../src/interpretationPrep/sajuAnuV6V12DirectInspection.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from './materialize-saju-anu-v6-v12-direct-inspection-v0.mjs'
import { verifyIntegritySidecar } from './check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'

export const HISTORICAL_CHECKER_PATH = 'scripts/check-saju-anu-v6-v12-direct-inspection-v0-historical.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const unique = values => [...new Set(values)].sort()
const currentHead = root => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'],
  { cwd: root, encoding: 'utf8' },
).trim()

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
  }
}

const claimStatusCounts = claims => Object.fromEntries(
  ['kept', 'corrected', 'rejected', 'unresolved'].map(status => [status, (claims || []).filter(claim => claim.status === status).length]),
)

function parentReference(artifact, artifactPath) {
  return {
    artifactPath,
    schemaVersion: artifact?.schemaVersion || null,
    version: artifact?.version || null,
    basisHead: artifact?.basisHead || null,
    contentSha256: artifact?.contentSha256 || null,
    artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
    claimCount: artifact?.claims?.length || 0,
    statusCounts: claimStatusCounts(artifact?.claims),
    unchanged: true,
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
      predecessors: {},
    }
  }

  const stored = await readArtifactWithSidecar(root, artifactPath)
  errors.push(...stored.errors)
  if (stored.artifact && canonicalIdentityJson(stored.artifact) !== canonicalIdentityJson(candidate)) {
    errors.push('candidate_file_mismatch')
  }

  const predecessorStored = Object.fromEntries(await Promise.all(
    PREDECESSOR_PATHS.map(async predecessorPath => [
      predecessorPath,
      await readArtifactWithSidecar(root, predecessorPath),
    ]),
  ))
  const predecessorResults = {}
  for (const predecessorPath of PREDECESSOR_PATHS) {
    const predecessor = predecessorStored[predecessorPath]
    const predecessorErrors = [...predecessor.errors]
    if (!predecessor.artifact) {
      predecessorResults[predecessorPath] = {
        artifactByteSha256: predecessor.artifactByteSha256,
        errors: unique(predecessorErrors),
        historicalSnapshotMode: false,
        status: 'fail',
      }
      errors.push(...predecessorErrors.map(error => `predecessor:${error}`))
      continue
    }
    if (predecessorPath === PREDECESSOR_PATHS[0]) {
      const actual = candidate.sourceClaimReconciliation?.parentArtifact
      if (canonicalIdentityJson(actual) !== canonicalIdentityJson(parentReference(predecessor.artifact, predecessorPath))) {
        predecessorErrors.push(`predecessor_identity:${predecessorPath}`)
      }
    }
    const input = candidate.artifactIdentity?.inputs?.find(entry => entry.path === predecessorPath)
    if (input?.byteSha256 !== sha256(predecessor.bytes)) predecessorErrors.push(`predecessor_byte_identity:${predecessorPath}`)
    const normalized = unique(predecessorErrors)
    predecessorResults[predecessorPath] = {
      artifactByteSha256: predecessor.artifactByteSha256,
      errors: normalized,
      historicalSnapshotMode: true,
      status: normalized.length ? 'fail' : 'pass',
    }
    errors.push(...normalized.map(error => `predecessor:${error}`))
  }

  errors.push(...checkSajuAnuV6V12DirectInspection(candidate))
  errors.push(...checkArtifactIdentity(candidate, {
    allowGenerationBaseInput: true,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs',
    materializerVersion: VERSION,
    root,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.basisHead !== candidate.artifactIdentity?.generation?.baseHead) errors.push('basis_head_identity')
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')

  let historicalReplay = false
  const parentV7 = predecessorStored[PREDECESSOR_PATHS[0]]?.artifact
  const typedReadinessBaseline = predecessorStored[PREDECESSOR_PATHS[1]]?.artifact
  if (candidate.artifactIdentity && parentV7 && typedReadinessBaseline) {
    const replayPayload = buildSajuAnuV6V12DirectInspection({
      basisHead: candidate.basisHead,
      parentV7,
      typedReadinessBaseline,
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
    predecessors: predecessorResults,
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
        predecessors: {},
      }
  const errors = unique(result.errors)
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    mode: 'historical',
    historicalSnapshotMode: true,
    historicalReplay: result.historicalReplay,
    externalPdfRead: false,
    externalCandidateRead: false,
    basisHead: artifact?.basisHead || null,
    currentHead: currentHead(ROOT),
    artifactByteSha256: result.artifactByteSha256 || null,
    artifactSidecar: result.artifactSidecar,
    predecessors: result.predecessors,
    directVolumeCount: artifact?.summary?.directVolumeCount || 0,
    directTimingObservationCount: artifact?.summary?.directTimingObservationCount || 0,
    printedFolioClosedCount: artifact?.summary?.printedFolioClosedCount || 0,
    readiness: artifact?.readiness || null,
    promotion: artifact?.promotion || null,
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
