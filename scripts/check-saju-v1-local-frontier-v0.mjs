import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { artifactPayloadSha256, canonicalIdentityJson, checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildArtifact, SCHEMA, VERSION } from './materialize-saju-v1-local-frontier-v0.mjs'
import { checkSajuV1LocalFrontier } from '../src/interpretationPrep/sajuV1LocalFrontier.js'

const root = resolve(new URL('../', import.meta.url).pathname)
const artifactPath = resolve(root, 'artifacts/saju-v1-local-frontier-v0/complete.json')
const integrityPath = resolve(root, 'artifacts/saju-v1-local-frontier-v0/complete.json.integrity.json')
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const provenance = JSON.parse(fs.readFileSync(resolve(root, 'artifacts/saju-claim-provenance-v0.json'), 'utf8'))
const errors = [
  ...checkSajuV1LocalFrontier(artifact, provenance),
  ...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-saju-v1-local-frontier-v0.mjs', materializerVersion: VERSION, allowGenerationBaseInput: true }),
]
if (artifact.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(artifact)) errors.push('artifact payload hash mismatch')
const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const expected = buildArtifact()
const isCurrentSnapshot = artifact.artifactIdentity?.generation?.baseHead === currentHead
if (isCurrentSnapshot && canonicalIdentityJson(artifact) !== canonicalIdentityJson(expected)) errors.push('materialized content drift')
if (!isCurrentSnapshot && artifact.contentSha256 !== expected.contentSha256) errors.push('historical stable content drift')
const bytes = fs.readFileSync(artifactPath)
const integrity = JSON.parse(fs.readFileSync(integrityPath, 'utf8'))
if (integrity.artifactByteSha256 !== createHash('sha256').update(bytes).digest('hex')) errors.push('artifact byte hash mismatch')
if (integrity.byteLength !== bytes.length) errors.push('artifact byte length mismatch')
console.log(JSON.stringify({ status: errors.length ? 'fail' : 'pass', head: currentHead, basisHead: artifact.artifactIdentity?.generation?.baseHead || null, historicalSnapshotAccepted: !isCurrentSnapshot, claimCount: artifact.claims.length, occurrenceCount: artifact.scope.canonicalOccurrenceCount, taxonomy: artifact.taxonomy.distribution, errors }, null, 2))
if (errors.length) process.exitCode = 1
