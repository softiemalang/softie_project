#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import {
  TRI_SYSTEM_READINESS_SCHEMA,
  TRI_SYSTEM_READINESS_VERSION,
  canonicalTriSystemReadinessJson,
  triSystemReadinessContentSha256,
} from '../src/interpretationPrep/triSystemReadinessContract.js'
import { INPUT_PATHS as PREDECESSOR_INPUT_PATHS, buildArtifact as buildPredecessorArtifact } from './materialize-astrology-v1-local-integration-milestone-v1.mjs'

export const SCHEMA = TRI_SYSTEM_READINESS_SCHEMA
export const VERSION = '2.0.0'
export const ARTIFACT_PATH = 'artifacts/astrology-v1-local-integration-milestone-v2/complete.json'
export const PREDECESSOR_PATH = 'artifacts/astrology-v1-local-integration-milestone-v1/complete.json'
export const INPUT_PATHS = [...new Set([
  ...PREDECESSOR_INPUT_PATHS,
  PREDECESSOR_PATH,
  'scripts/materialize-astrology-v1-local-integration-milestone-v2.mjs',
  'scripts/check-astrology-v1-local-integration-milestone-v2.mjs',
  'scripts/materialize-saju-source-claim-observation-v1.mjs',
  'scripts/check-saju-source-claim-observation-v1.mjs',
  'artifacts/saju-source-claim-observation-v1/complete.json',
  'artifacts/astrology-true-node-horizons-erfa-v2/complete.json',
  'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json',
])]

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

async function evidenceRef(path, expectedSchema) {
  const bytes = await readFile(resolve(root, path))
  const artifact = JSON.parse(bytes)
  const generationBaseHead = artifact.artifactIdentity?.generation?.baseHead || artifact.artifactIdentity?.baseHead || artifact.basisHead || null
  return {
    path,
    byteSha256: sha256(bytes),
    artifact: {
      schemaVersion: artifact.schemaVersion || null,
      verdictToken: artifact.verdictToken || null,
      generationBaseHead,
      expectedSchema,
    },
    reconciliation: {
      status: generationBaseHead === currentHead() ? 'current_snapshot' : 'historical_snapshot_preserved',
      historicalArtifactRewritten: false,
    },
  }
}

export async function buildArtifact() {
  const predecessorBytes = await readFile(resolve(root, PREDECESSOR_PATH))
  const predecessor = await buildPredecessorArtifact()
  const artifact = structuredClone(predecessor)
  delete artifact.artifactIdentity

  const latest = {
    saju: await evidenceRef('artifacts/saju-source-claim-observation-v1/complete.json', 'saju-source-claim-observation-v1'),
    horizons: await evidenceRef('artifacts/astrology-true-node-horizons-erfa-v2/complete.json', 'astrology-true-node-horizons-erfa-frontier-v2'),
    lightTime: await evidenceRef('artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json', 'astrology-true-node-light-time-diagnostic-v1'),
  }
  const domains = artifact.domains.map(domain => {
    if (domain.id === 'saju') {
      return {
        ...domain,
        evidenceRefs: [...domain.evidenceRefs, latest.saju],
        frontier: {
          latestEvidence: [latest.saju.path],
          sourceObservation: 'direct_visual_transcription_candidate',
          claimVerification: 'not_promoted',
          readinessUnchanged: true,
        },
      }
    }
    if (domain.id === 'astrology') {
      return {
        ...domain,
        evidenceRefs: [...domain.evidenceRefs, latest.horizons, latest.lightTime],
        blockers: domain.blockers.map((blocker, index) => index === 0
          ? { ...blocker, sourceRefs: [...new Set([...blocker.sourceRefs, latest.horizons.path, latest.lightTime.path])] }
          : blocker),
        frontier: {
          latestEvidence: [latest.horizons.path, latest.lightTime.path],
          independentTrueNodeReference: 'pending',
          semanticIdentity: 'blocked_semantic_identity_insufficient',
          numericStatus: 'diagnostic_only_no_tolerance_pass',
          readinessUnchanged: true,
        },
      }
    }
    return domain
  })

  artifact.successor = {
    successorVersion: VERSION,
    predecessor: {
      artifact: PREDECESSOR_PATH,
      byteSha256: sha256(predecessorBytes),
      schemaVersion: predecessor.schemaVersion,
      historicalArtifactRewritten: false,
    },
    purpose: 'attach latest accessible source-observation and Western external-evidence successors without rewriting the historical common handoff',
    latestEvidencePaths: {
      saju: [latest.saju.path],
      astrology: [latest.horizons.path, latest.lightTime.path],
    },
    boundary: {
      calculationFacts: 'separate',
      sourceEvidence: 'separate',
      deterministicRelations: 'separate',
      interpretation: 'not_created',
      semanticAuthority: 'not_promoted',
      readiness: 'unchanged_blocked_or_local_research_only',
    },
  }
  artifact.domains = domains
  artifact.localEvidence = {
    ...artifact.localEvidence,
    latestEvidenceAttached: true,
    latestEvidenceChangesReadiness: false,
    sourceAuthorityPromoted: false,
  }
  artifact.contentSha256 = triSystemReadinessContentSha256(artifact)
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-astrology-v1-local-integration-milestone-v2.mjs',
    materializerVersion: VERSION,
    baseHead: artifact.basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const target = resolve(root, outputPath)
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalTriSystemReadinessJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-successor-integrity-v1`,
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(`${target}.integrity.json`, canonicalTriSystemReadinessJson(integrity))
  return { output: outputPath, artifactByteSha256: integrity.artifactByteSha256, contentSha256: artifact.contentSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))
