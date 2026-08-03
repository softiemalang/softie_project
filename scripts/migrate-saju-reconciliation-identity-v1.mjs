import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { attachArtifactIdentity, buildArtifactIdentity, fileByteIdentity } from '../src/artifactIdentity.js'

const root = process.cwd()
const path = 'artifacts/saju-verification-reconciliation-v1.json'
const artifact = JSON.parse(execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }))
const inputPaths = artifact.sourceIdentityInventory.map(entry => entry.path)
const tri = artifact.sourceIdentityInventory.find(entry => entry.path === 'artifacts/tri-system-readiness-v1/inventory.json')
tri.sha256 = fileByteIdentity(root, tri.path).byteSha256
const migrated = attachArtifactIdentity(artifact, buildArtifactIdentity({
  root,
  artifactId: 'saju-verification-reconciliation-v1',
  materializerPath: 'scripts/migrate-saju-reconciliation-identity-v1.mjs',
  materializerVersion: '1.1.0',
  baseHead: artifact.generatedFromHead,
  inputs: inputPaths,
}))
writeFileSync(path, `${JSON.stringify(migrated, null, 2)}\n`)
console.log(JSON.stringify({ path, baseHead: artifact.generatedFromHead, artifactPayloadSha256: migrated.artifactIdentity.artifactPayloadSha256 }, null, 2))
