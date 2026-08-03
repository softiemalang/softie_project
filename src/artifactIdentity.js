import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const ARTIFACT_IDENTITY_CONTRACT_VERSION = 'artifact-identity-v1'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
}
export const canonicalIdentityJson = (value) => `${JSON.stringify(stable(value), null, 2)}\n`

export function fileByteIdentity(root, path) {
  return { path, byteSha256: sha256(readFileSync(`${root}/${path}`)) }
}

export function artifactPayloadWithoutIdentity(artifact) {
  const payload = structuredClone(artifact)
  delete payload.artifactIdentity
  return payload
}

export function artifactPayloadSha256(artifact) {
  return sha256(canonicalIdentityJson(artifactPayloadWithoutIdentity(artifact)))
}

export function buildArtifactIdentity({ root, artifactId, materializerPath, materializerVersion, baseHead, inputs = [] }) {
  if (!/^[0-9a-f]{40}$/.test(baseHead || '')) throw new Error(`invalid generation base HEAD for ${artifactId}`)
  return {
    contractVersion: ARTIFACT_IDENTITY_CONTRACT_VERSION,
    artifactId,
    generation: {
      baseHead,
      baseHeadSource: 'git rev-parse HEAD at materialization',
      includedCommit: null,
      includedCommitSource: 'unknown_at_generation; artifact may be included by a later commit',
    },
    inputs: inputs.map((path) => fileByteIdentity(root, path)).sort((a, b) => a.path.localeCompare(b.path)),
    materializer: { path: materializerPath, version: materializerVersion },
  }
}

export function attachArtifactIdentity(payload, identity) {
  const artifact = { ...payload, artifactIdentity: { ...identity } }
  artifact.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(artifact)
  return artifact
}

export function checkArtifactIdentity(artifact, { root, artifactId, materializerPath, materializerVersion, allowCurrentHeadDifference = true } = {}) {
  const errors = []
  const identity = artifact?.artifactIdentity
  if (!identity || identity.contractVersion !== ARTIFACT_IDENTITY_CONTRACT_VERSION) errors.push('identity contract version mismatch')
  if (identity?.artifactId !== artifactId) errors.push('artifact identity mismatch')
  if (identity?.materializer?.path !== materializerPath || identity?.materializer?.version !== materializerVersion) errors.push('materializer identity mismatch')
  if (!/^[0-9a-f]{40}$/.test(identity?.generation?.baseHead || '')) errors.push('generation base identity missing or invalid')
  if (identity?.generation?.includedCommit !== null || identity?.generation?.includedCommitSource !== 'unknown_at_generation; artifact may be included by a later commit') errors.push('included commit must remain unknown at generation')
  if (identity?.artifactPayloadSha256 !== artifactPayloadSha256(artifact)) errors.push('artifact payload identity mismatch')
  for (const input of identity?.inputs || []) {
    try {
      const actual = fileByteIdentity(root, input.path).byteSha256
      if (input.byteSha256 !== actual) errors.push(`input byte identity mismatch:${input.path}`)
    } catch { errors.push(`input missing:${input.path}`) }
  }
  if (!identity?.inputs?.length) errors.push('input provenance missing')
  return errors
}
