import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'
import { canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import { buildSajuV1LocalFrontier } from '../src/interpretationPrep/sajuV1LocalFrontier.js'

export const SCHEMA = 'saju-v1-local-frontier-v0'
export const VERSION = '0.1.0'
const root = resolve(new URL('../', import.meta.url).pathname)
const artifactPath = 'artifacts/saju-v1-local-frontier-v0/complete.json'
const integrityPath = `${artifactPath}.integrity.json`
const inputPaths = [
  'artifacts/saju-claim-provenance-v0.json',
  'src/interpretationPrep/sajuV1LocalFrontier.js',
  'src/saju/engine/constants.js',
  'src/saju/engine/core.js',
  'src/interpretationPrep/sajuProfileRules.js',
  'src/interpretationPrep/sajuTimingRules.js',
  'src/interpretationPrep/sajuAdapter.js',
  'scripts/materialize-saju-v1-local-frontier-v0.mjs',
]

export function buildArtifact() {
  const provenance = JSON.parse(fs.readFileSync(resolve(root, 'artifacts/saju-claim-provenance-v0.json'), 'utf8'))
  const payload = buildSajuV1LocalFrontier({ provenance })
  return attachArtifactIdentity(payload, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-v1-local-frontier-v0.mjs',
    materializerVersion: VERSION,
    baseHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    inputs: inputPaths,
  }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifact = buildArtifact()
  const text = canonicalJson(artifact)
  const bytes = Buffer.from(text, 'utf8')
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v0`,
    artifactPath,
    artifactByteSha256: createHash('sha256').update(bytes).digest('hex'),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  mkdirSync(resolve(root, 'artifacts/saju-v1-local-frontier-v0'), { recursive: true })
  fs.writeFileSync(resolve(root, artifactPath), text)
  fs.writeFileSync(resolve(root, integrityPath), canonicalIdentityJson(integrity))
  console.log(JSON.stringify({ status: 'materialized', artifactPath, claimCount: artifact.claims.length, occurrenceCount: artifact.scope.canonicalOccurrenceCount, taxonomy: artifact.taxonomy.distribution, artifactByteSha256: integrity.artifactByteSha256 }, null, 2))
}
