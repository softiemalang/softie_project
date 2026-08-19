#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  artifactPayloadSha256,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  CLAIM_ADJUDICATION_ARTIFACT_PATH,
  CLAIM_ADJUDICATION_INTEGRITY_PATH,
  CLAIM_MATERIALIZER_PATH,
  CLAIM_MODULE_PATH,
  SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA,
  SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION,
  SOURCE_FRONTIER_ARTIFACT_PATH,
  SOURCE_FRONTIER_INTEGRITY_PATH,
  TIMING_AUTHORITY_ARTIFACT_PATH,
  TIMING_AUTHORITY_INTEGRITY_PATH,
  buildProvenanceSnapshot,
  buildTimingAuthorityRelation,
  checkSajuFiveClassicsClaimProvenanceClosure,
} from '../src/interpretationPrep/sajuFiveClassicsClaimProvenanceClosure.js'
import {
  checkSajuFiveClassicsClaimAdjudication,
} from '../src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'
import {
  checkSajuTimingAuthorityFrontier,
} from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'
import {
  INPUT_PATHS as CLAIM_INPUT_PATHS,
} from './materialize-saju-five-classics-claim-adjudication-v0.mjs'
import {
  checkArtifact as checkSourceArtifact,
} from './check-saju-five-classics-source-identity-frontier-v0.mjs'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  SCHEMA,
  VERSION,
} from './materialize-saju-five-classics-claim-provenance-closure-v0.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

const SNAPSHOT_SPECS = Object.freeze({
  claimAdjudication: {
    artifactPath: CLAIM_ADJUDICATION_ARTIFACT_PATH,
    integrityPath: CLAIM_ADJUDICATION_INTEGRITY_PATH,
    artifactId: 'saju-five-classics-claim-adjudication-v0',
    materializerPath: CLAIM_MATERIALIZER_PATH,
    materializerVersion: '0.1.0',
  },
  sourceFrontier: {
    artifactPath: SOURCE_FRONTIER_ARTIFACT_PATH,
    integrityPath: SOURCE_FRONTIER_INTEGRITY_PATH,
    artifactId: 'saju-five-classics-source-identity-frontier-v0',
    materializerPath: 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
    materializerVersion: '0.1.0',
  },
  timingAuthority: {
    artifactPath: TIMING_AUTHORITY_ARTIFACT_PATH,
    integrityPath: TIMING_AUTHORITY_INTEGRITY_PATH,
    artifactId: 'saju-timing-authority-frontier-v0',
    materializerPath: 'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
    materializerVersion: '0.1.0',
  },
})

const CLOSURE_SPEC = {
  artifactPath: ARTIFACT_PATH,
  integrityPath: `${ARTIFACT_PATH}.integrity.json`,
  artifactId: SCHEMA,
  materializerPath: 'scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs',
  materializerVersion: VERSION,
}

async function readJsonFile(root, path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'))
}

export async function readSnapshot(spec, { root = ROOT } = {}) {
  const [artifactBytes, integrityBytes] = await Promise.all([
    readFile(resolve(root, spec.artifactPath)),
    readFile(resolve(root, spec.integrityPath)),
  ])
  const artifact = JSON.parse(artifactBytes.toString('utf8'))
  const integrity = JSON.parse(integrityBytes.toString('utf8'))
  const snapshot = buildProvenanceSnapshot({
    artifactPath: spec.artifactPath,
    integrityPath: spec.integrityPath,
    artifact,
    artifactBytes,
    integrity,
    integrityBytes,
  })
  const errors = []
  if (integrity.artifactPath !== spec.artifactPath) errors.push(`integrity_path:${spec.artifactPath}`)
  if (integrity.hashScope !== 'exact UTF-8 bytes of complete.json including final LF') errors.push(`integrity_scope:${spec.artifactPath}`)
  if (integrity.artifactByteSha256 !== snapshot.artifactByteSha256 || integrity.byteLength !== snapshot.artifactByteLength) errors.push(`integrity_bytes:${spec.artifactPath}`)
  if (artifact.artifactIdentity?.artifactId !== spec.artifactId) errors.push(`artifact_id:${spec.artifactPath}`)
  errors.push(...checkArtifactIdentity(artifact, {
    root,
    artifactId: spec.artifactId,
    materializerPath: spec.materializerPath,
    materializerVersion: spec.materializerVersion,
    allowGenerationBaseInput: true,
  }))
  if (artifact.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(artifact)) errors.push(`artifact_payload_hash:${spec.artifactPath}`)
  return { artifact, snapshot, errors: [...new Set(errors)].sort() }
}

async function readClosureCodeEvidence(root = ROOT) {
  const [claimMaterializerSource, claimModuleSource, sourceMaterializerSource, sourceModuleSource] = await Promise.all([
    readFile(resolve(root, CLAIM_MATERIALIZER_PATH), 'utf8'),
    readFile(resolve(root, CLAIM_MODULE_PATH), 'utf8'),
    readFile(resolve(root, 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs'), 'utf8'),
    readFile(resolve(root, 'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js'), 'utf8'),
  ])
  return { claimMaterializerSource, claimModuleSource, sourceMaterializerSource, sourceModuleSource }
}

export async function checkArtifact(candidate, {
  root = ROOT,
  mode = 'historical',
  artifactPath = ARTIFACT_PATH,
} = {}) {
  const errors = []
  const historical = mode === 'historical'
  if (!['source', 'historical'].includes(mode)) return ['unknown_mode:' + mode]
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']

  const [claimResult, sourceResult, timingResult, codeEvidence] = await Promise.all([
    readSnapshot(SNAPSHOT_SPECS.claimAdjudication, { root }),
    readSnapshot(SNAPSHOT_SPECS.sourceFrontier, { root }),
    readSnapshot(SNAPSHOT_SPECS.timingAuthority, { root }),
    readClosureCodeEvidence(root),
  ])
  errors.push(...claimResult.errors, ...sourceResult.errors, ...timingResult.errors)

  const timingAuthorityRelation = buildTimingAuthorityRelation({
    claimMaterializerInputPaths: CLAIM_INPUT_PATHS,
    claimMaterializerSource: codeEvidence.claimMaterializerSource,
    claimModuleSource: codeEvidence.claimModuleSource,
    sourceMaterializerSource: codeEvidence.sourceMaterializerSource,
    sourceModuleSource: codeEvidence.sourceModuleSource,
    timingAuthoritySnapshot: timingResult.snapshot,
  })
  errors.push(...checkSajuFiveClassicsClaimProvenanceClosure(candidate, {
    claimAdjudicationSnapshot: claimResult.snapshot,
    sourceFrontierSnapshot: sourceResult.snapshot,
    timingAuthorityRelation,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('closure_artifact_payload_hash')
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: CLOSURE_SPEC.artifactId,
    materializerPath: CLOSURE_SPEC.materializerPath,
    materializerVersion: CLOSURE_SPEC.materializerVersion,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))

  errors.push(...checkSajuFiveClassicsClaimAdjudication(claimResult.artifact, {
    sourceFrontier: sourceResult.artifact,
  }))
  const sourceErrors = await checkSourceArtifact(sourceResult.artifact, {
    root,
    historical,
    artifactPath: SOURCE_FRONTIER_ARTIFACT_PATH,
  })
  errors.push(...sourceErrors)
  errors.push(...checkSajuTimingAuthorityFrontier(timingResult.artifact))

  if (artifactPath) {
    try {
      const bytes = await readFile(resolve(root, artifactPath))
      const integrity = await readJsonFile(root, `${artifactPath}.integrity.json`)
      if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('closure_integrity_sidecar')
    } catch {
      errors.push('closure_integrity_sidecar_missing_or_invalid')
    }
  }

  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const mode = process.argv.includes('--source') ? 'source' : process.argv.includes('--historical') ? 'historical' : null
  if (!mode) throw new Error('explicit mode required: --source or --historical')
  const artifactPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) || ARTIFACT_PATH
  const artifact = await readJsonFile(ROOT, artifactPath)
  const errors = await checkArtifact(artifact, { mode, artifactPath })
  const sourceProfile = mode === 'source'
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    mode,
    historicalSnapshotMode: mode === 'historical',
    sourceProfile,
    externalPdfRead: sourceProfile,
    sourceBytesReverified: sourceProfile && errors.length === 0,
    timingAuthorityGenerationDependency: artifact.timingAuthorityRelation?.generationDependency ?? null,
    claimArtifactByteSha256: artifact.claimAdjudication?.artifactByteSha256 || null,
    sourceArtifactByteSha256: artifact.sourceFrontierPredecessor?.artifactByteSha256 || null,
    readiness: artifact.readiness || null,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}
