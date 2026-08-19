import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  artifactPayloadSha256,
  checkArtifactIdentity,
  inspectFileByteIdentity,
} from '../../src/artifactIdentity.js'

const SHA256 = /^[0-9a-f]{64}$/

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export async function readHistoricalJson(root, path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'))
}

/**
 * Verify a stored snapshot against its own persisted bytes and identities.
 * This intentionally never invokes a materializer or compares with a
 * current-HEAD regeneration.
 */
export async function verifyHistoricalSnapshot({
  root,
  artifactPath,
  integrityPath = `${artifactPath}.integrity.json`,
  artifactId,
  materializerPath,
  materializerVersion,
  predecessorPaths = [],
}) {
  const artifactBytes = await readFile(resolve(root, artifactPath))
  const integrity = JSON.parse(await readFile(resolve(root, integrityPath), 'utf8'))
  const artifact = JSON.parse(artifactBytes.toString('utf8'))
  const identity = artifact.artifactIdentity

  assert.equal(integrity.artifactPath, artifactPath)
  assert.equal(integrity.hashScope, 'exact UTF-8 bytes of complete.json including final LF')
  assert.equal(integrity.byteLength, artifactBytes.length)
  assert.equal(integrity.artifactByteSha256, sha256(artifactBytes))
  assert.match(integrity.artifactByteSha256, SHA256)

  assert.equal(identity?.artifactId, artifactId)
  assert.equal(identity?.materializer?.path, materializerPath)
  assert.equal(identity?.materializer?.version, materializerVersion)
  assert.match(identity?.generation?.baseHead || '', /^[0-9a-f]{40}$/)
  assert.equal(artifact.basisHead, identity.generation.baseHead)
  assert.match(artifact.contentSha256 || '', SHA256)
  assert.equal(identity.artifactPayloadSha256, artifactPayloadSha256(artifact))

  assert.deepEqual(checkArtifactIdentity(artifact, {
    root,
    artifactId,
    materializerPath,
    materializerVersion,
    allowGenerationBaseInput: true,
  }), [])

  for (const predecessorPath of predecessorPaths) {
    const recorded = identity.inputs?.find(input => input.path === predecessorPath)
    assert.ok(recorded, `missing stored predecessor identity: ${predecessorPath}`)
    assert.match(recorded.byteSha256 || '', SHA256)
    const observed = inspectFileByteIdentity(root, predecessorPath, recorded.byteSha256, {
      generationBaseHead: identity.generation.baseHead,
    })
    assert.equal(
      observed.currentMatches || observed.historicalMatches,
      true,
      `predecessor bytes do not match current or recorded basis: ${predecessorPath}`,
    )
  }

  return { artifact, integrity, artifactBytes }
}

export function assertStoredArtifactReference(reference, predecessor, { artifactPath } = {}) {
  assert.equal(reference?.artifactPath, artifactPath)
  assert.equal(reference?.schemaVersion, predecessor?.schemaVersion)
  assert.equal(reference?.version, predecessor?.version)
  assert.equal(reference?.basisHead, predecessor?.basisHead)
  assert.equal(reference?.contentSha256, predecessor?.contentSha256)
  assert.equal(reference?.artifactPayloadSha256, predecessor?.artifactIdentity?.artifactPayloadSha256)
}
