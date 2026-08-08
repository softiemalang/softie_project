import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { checkArtifactIdentity, matchesFileByteIdentity } from '../src/artifactIdentity.js'
import { checkTriSystemReadinessContract, isSafeTriSystemRelativePath, triSystemReadinessContentSha256 } from '../src/interpretationPrep/triSystemReadinessContract.js'
import { ARTIFACT_PATH, INPUT_PATHS, MATERIALIZER_VERSION, buildArtifact } from './materialize-astrology-v1-local-integration-milestone-v1.mjs'

const root = resolve(new URL('../', import.meta.url).pathname)
const artifactPath = resolve(root, process.argv[2] || ARTIFACT_PATH)
const bytes = await readFile(artifactPath)
const artifact = JSON.parse(bytes)
const artifactIsObject = artifact && typeof artifact === 'object' && !Array.isArray(artifact)
const errors = artifactIsObject ? checkTriSystemReadinessContract(artifact, { root }) : ['artifact_shape_invalid']
if (artifactIsObject) {
  const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const generationBaseHead = artifact.artifactIdentity?.generation?.baseHead || artifact.basisHead
  const isCurrentSnapshot = generationBaseHead === currentHead
  errors.push(...checkArtifactIdentity(artifact, { root, artifactId: 'tri-system-readiness-handoff-v1', materializerPath: 'scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs', materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true }))
  if (JSON.stringify(artifact?.artifactIdentity?.inputs?.map(item => item.path)) !== JSON.stringify([...INPUT_PATHS].sort())) errors.push('input_manifest_mismatch')
  if (isCurrentSnapshot) {
    const expected = await buildArtifact()
    if (artifact.contentSha256 !== expected.contentSha256) errors.push('current_materialized_content_drift')
  }
  for (const domain of artifact.domains || []) for (const ref of domain.evidenceRefs || []) {
    if (!isSafeTriSystemRelativePath(ref.path)) continue
    if (!matchesFileByteIdentity(root, ref.path, ref.byteSha256, { generationBaseHead })) errors.push(`evidence_byte_drift:${ref.path}`)
  }
}
const integrityPath = `${artifactPath}.integrity.json`
try {
  const integrity = JSON.parse(await readFile(integrityPath, 'utf8'))
  if (integrity.artifactByteSha256 !== createHash('sha256').update(bytes).digest('hex')) errors.push('integrity_byte_hash_mismatch')
  if (integrity.byteLength !== bytes.length) errors.push('integrity_byte_length_mismatch')
} catch { errors.push('integrity_sidecar_missing_or_invalid') }
const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const result = { pass: errors.length === 0, basisHead: artifact?.basisHead || null, currentHead: head, domainStatuses: Object.fromEntries((artifact?.domains || []).map(domain => [domain.id, { status: domain.status, readiness: domain.readiness.status, availableForInterpretation: domain.readiness.availableForInterpretation }])), blockedDomains: artifact?.propagation?.blockedDomains || [], errors: [...new Set(errors)].sort() }
console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exitCode = 1
