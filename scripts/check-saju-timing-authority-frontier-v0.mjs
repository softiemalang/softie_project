import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { artifactPayloadSha256, canonicalIdentityJson, checkArtifactIdentity } from '../src/artifactIdentity.js'
import { checkSajuTimingAuthorityFrontier } from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'
import { ARTIFACT_PATH, buildArtifact, INTEGRITY_PATH, SCHEMA, VERSION } from './materialize-saju-timing-authority-frontier-v0.mjs'

const root = resolve(new URL('../', import.meta.url).pathname)
const artifactPath = resolve(root, ARTIFACT_PATH)
const integrityPath = resolve(root, INTEGRITY_PATH)
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const historical = process.argv.includes('--historical')
const errors = [
  ...checkSajuTimingAuthorityFrontier(artifact),
  ...checkArtifactIdentity(artifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
  }),
]
if (artifact.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(artifact)) errors.push('artifact payload hash mismatch')

const currentHead = execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'],
  { cwd: root, encoding: 'utf8' },
).trim()
let isCurrentSnapshot = false
if (!historical) {
  const expected = buildArtifact()
  isCurrentSnapshot = artifact.artifactIdentity?.generation?.baseHead === currentHead
  if (isCurrentSnapshot && canonicalIdentityJson(artifact) !== canonicalIdentityJson(expected)) errors.push('materialized content drift')
  if (!isCurrentSnapshot && artifact.contentSha256 !== expected.contentSha256) errors.push('historical stable content drift')
}

const bytes = fs.readFileSync(artifactPath)
const integrity = JSON.parse(fs.readFileSync(integrityPath, 'utf8'))
if (integrity.artifactByteSha256 !== createHash('sha256').update(bytes).digest('hex')) errors.push('artifact byte hash mismatch')
if (integrity.byteLength !== bytes.length) errors.push('artifact byte length mismatch')

console.log(JSON.stringify({
  status: errors.length ? 'fail' : 'pass',
  historicalSnapshotMode: historical,
  head: currentHead,
  basisHead: artifact.artifactIdentity?.generation?.baseHead || null,
  historicalSnapshotAccepted: !isCurrentSnapshot,
  sourceCount: artifact.sources.length,
  observationCount: artifact.observations.length,
  claimCount: artifact.claims.length,
  blockerCount: artifact.blockers.length,
  readiness: artifact.readiness,
  errors: [...new Set(errors)].sort(),
}, null, 2))
if (errors.length) process.exitCode = 1
