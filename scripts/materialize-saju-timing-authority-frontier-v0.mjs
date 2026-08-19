import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'
import { buildSajuTimingAuthorityFrontier } from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'

export const SCHEMA = 'saju-timing-authority-frontier-v0'
export const VERSION = '0.1.0'
const root = resolve(new URL('../', import.meta.url).pathname)
export const ARTIFACT_PATH = 'artifacts/saju-timing-authority-frontier-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
const inputPaths = [
  'src/interpretationPrep/sajuTimingAuthorityFrontier.js',
  'src/saju/engine/fourPillars.js',
  'src/saju/engine/solarTerms.js',
  'src/saju/engine/solarTime.js',
  'src/interpretationPrep/sajuTimingRules.js',
  'src/interpretationPrep/sajuAdapter.js',
  'artifacts/saju-five-classics-grounding-v0/complete.json',
  'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
]

const currentHead = () => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'],
  { cwd: root, encoding: 'utf8' },
).trim()

export function buildArtifact() {
  const basisHead = currentHead()
  const payload = buildSajuTimingAuthorityFrontier({ basisHead })
  return attachArtifactIdentity(payload, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: inputPaths,
  }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifact = buildArtifact()
  const text = canonicalIdentityJson(artifact)
  const bytes = Buffer.from(text, 'utf8')
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v0`,
    artifactPath: ARTIFACT_PATH,
    artifactByteSha256: createHash('sha256').update(bytes).digest('hex'),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  mkdirSync(resolve(root, 'artifacts/saju-timing-authority-frontier-v0'), { recursive: true })
  fs.writeFileSync(resolve(root, ARTIFACT_PATH), text)
  fs.writeFileSync(resolve(root, INTEGRITY_PATH), canonicalIdentityJson(integrity))
  console.log(JSON.stringify({
    status: 'materialized',
    artifactPath: ARTIFACT_PATH,
    sourceCount: artifact.sources.length,
    observationCount: artifact.observations.length,
    claimCount: artifact.claims.length,
    blockerCount: artifact.blockers.length,
    artifactByteSha256: integrity.artifactByteSha256,
  }, null, 2))
}
