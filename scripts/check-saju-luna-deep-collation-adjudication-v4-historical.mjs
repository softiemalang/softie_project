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
import { checkSajuTimingAuthorityFrontier } from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'
import {
  buildSajuLunaDeepCollationAdjudicationV4,
  checkSajuLunaDeepCollationAdjudicationV4,
} from '../src/interpretationPrep/sajuLunaDeepCollationAdjudicationV4.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from './materialize-saju-luna-deep-collation-adjudication-v4.mjs'
import {
  SCHEMA as TIMING_SCHEMA,
  VERSION as TIMING_VERSION,
} from './materialize-saju-timing-authority-frontier-v0.mjs'
import {
  checkHistoricalArtifact as checkDossierV1HistoricalArtifact,
} from './check-saju-gemini-witness-dossier-adjudication-v1-historical.mjs'
import {
  checkHistoricalArtifact as checkDossierV2HistoricalArtifact,
} from './check-saju-gemini-witness-dossier-adjudication-v2-historical.mjs'
import {
  checkHistoricalArtifact as checkDossierV3HistoricalArtifact,
} from './check-saju-gemini-witness-dossier-adjudication-v3-historical.mjs'
import {
  checkHistoricalArtifact as checkTypedReadinessHistoricalArtifact,
} from './check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'
import { checkArtifact as checkSourceIdentityArtifact } from './check-saju-five-classics-source-identity-frontier-v0.mjs'
import { verifyIntegritySidecar } from './check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'

export const HISTORICAL_CHECKER_PATH = 'scripts/check-saju-luna-deep-collation-adjudication-v4-historical.mjs'

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

function predecessorReference(artifact, artifactPath) {
  return {
    artifactPath,
    schemaVersion: artifact?.schemaVersion || null,
    version: artifact?.version || null,
    basisHead: artifact?.basisHead || null,
    contentSha256: artifact?.contentSha256 || null,
    artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
    readiness: artifact?.readinessOverlay?.parentVerified || artifact?.readiness || null,
  }
}

function typedReadinessBaseline(typedArtifact) {
  return {
    schemaVersion: typedArtifact.schemaVersion,
    version: typedArtifact.version,
    contentSha256: typedArtifact.contentSha256 || null,
    activeClaimCount: typedArtifact.summary?.activeClaimCount || typedArtifact.claims?.length || 0,
    gateStateCounts: typedArtifact.summary?.gateStateCounts || {},
    readiness: typedArtifact.readiness || {},
    dayunClaims: (typedArtifact.claims || [])
      .filter(claim => String(claim.claimId || claim.id || '').startsWith('claim.sanming-dayun-'))
      .map(claim => ({
        id: claim.claimId || claim.id,
        stability: claim.currentStabilityLevel || claim.stability || null,
        gates: Object.fromEntries(Object.entries(claim.gates || {}).map(([gate, value]) => [gate, value.state || value])),
        promotion: claim.promotion || { ready: false, status: 'blocked' },
      })),
  }
}

function checkTimingSnapshot(artifact, { root }) {
  return [
    ...checkSajuTimingAuthorityFrontier(artifact),
    ...checkArtifactIdentity(artifact, {
      root,
      artifactId: TIMING_SCHEMA,
      materializerPath: 'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
      materializerVersion: TIMING_VERSION,
      allowGenerationBaseInput: true,
    }),
    ...(artifact.artifactIdentity?.artifactPayloadSha256 === artifactPayloadSha256(artifact)
      ? []
      : ['artifact_payload_hash']),
  ]
}

async function checkPredecessor(root, artifactPath, stored) {
  if (!stored.artifact) return {
    artifactByteSha256: stored.artifactByteSha256,
    errors: stored.errors,
    historicalReplay: false,
    historicalSnapshotMode: false,
    status: 'fail',
  }

  let errors = []
  let historicalReplay = null
  let historicalSnapshotMode = true
  if (artifactPath.includes('saju-gemini-witness-dossier-adjudication-v1')) {
    const result = await checkDossierV1HistoricalArtifact(stored.artifact, { artifactPath, root })
    errors = result.errors
    historicalReplay = result.historicalReplay
  } else if (artifactPath.includes('saju-gemini-witness-dossier-adjudication-v2')) {
    const result = await checkDossierV2HistoricalArtifact(stored.artifact, { artifactPath, root })
    errors = result.errors
    historicalReplay = result.historicalReplay
  } else if (artifactPath.includes('saju-gemini-witness-dossier-adjudication-v3')) {
    const result = await checkDossierV3HistoricalArtifact(stored.artifact, { artifactPath, root })
    errors = result.errors
    historicalReplay = result.historicalReplay
  } else if (artifactPath.includes('saju-five-classics-typed-readiness-contract-v0')) {
    const result = await checkTypedReadinessHistoricalArtifact(stored.artifact, { artifactPath, root })
    errors = result.errors
    historicalReplay = result.historicalReplay
  } else if (artifactPath.includes('saju-five-classics-source-identity-frontier-v0')) {
    errors = await checkSourceIdentityArtifact(stored.artifact, {
      artifactPath,
      historical: true,
      root,
    })
  } else if (artifactPath === 'artifacts/saju-timing-authority-frontier-v0/complete.json') {
    errors = checkTimingSnapshot(stored.artifact, { root })
  } else {
    errors = [`unsupported_predecessor:${artifactPath}`]
    historicalSnapshotMode = false
  }

  const combinedErrors = unique([...stored.errors, ...errors])
  return {
    artifactByteSha256: stored.artifactByteSha256,
    errors: combinedErrors,
    historicalReplay,
    historicalSnapshotMode,
    status: combinedErrors.length ? 'fail' : 'pass',
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
    const result = await checkPredecessor(root, predecessorPath, predecessorStored[predecessorPath])
    predecessorResults[predecessorPath] = result
    errors.push(...result.errors.map(error => `predecessor:${error}`))
    const storedPredecessor = predecessorStored[predecessorPath].artifact
    const actualReference = candidate.predecessorReferences?.[predecessorPath]
    if (storedPredecessor && canonicalIdentityJson(actualReference) !== canonicalIdentityJson(predecessorReference(storedPredecessor, predecessorPath))) {
      errors.push(`predecessor_identity:${predecessorPath}`)
    }
    const input = candidate.artifactIdentity?.inputs?.find(entry => entry.path === predecessorPath)
    const bytes = predecessorStored[predecessorPath].bytes
    if (bytes && input?.byteSha256 !== sha256(bytes)) errors.push(`predecessor_byte_identity:${predecessorPath}`)
  }

  errors.push(...checkSajuLunaDeepCollationAdjudicationV4(candidate))
  errors.push(...checkArtifactIdentity(candidate, {
    allowGenerationBaseInput: true,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-luna-deep-collation-adjudication-v4.mjs',
    materializerVersion: VERSION,
    root,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) {
    errors.push('artifact_payload_hash')
  }

  let historicalReplay = false
  const typedPath = 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json'
  const typedArtifact = predecessorStored[typedPath]?.artifact
  if (candidate.artifactIdentity && typedArtifact && PREDECESSOR_PATHS.every(path => predecessorStored[path].artifact)) {
    const replayPayload = buildSajuLunaDeepCollationAdjudicationV4({
      basisHead: candidate.basisHead,
      predecessorReferences: Object.fromEntries(PREDECESSOR_PATHS.map(predecessorPath => [
        predecessorPath,
        predecessorReference(predecessorStored[predecessorPath].artifact, predecessorPath),
      ])),
      typedReadinessBaseline: typedReadinessBaseline(typedArtifact),
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
    readiness: artifact?.readinessOverlay?.parentVerified || null,
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
