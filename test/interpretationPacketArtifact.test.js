import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { packetContentSha256 } from '../src/astrology/interpretationPacket.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

test('interpretation packet materializer and checker expose separate hash scopes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-interpretation-packet-contract-'))
  const outputDir = join(root, 'artifact')
  const materialized = JSON.parse(execFileSync(process.execPath, ['scripts/materialize-interpretation-packet-v1.mjs'], {
    env: { ...process.env, INTERPRETATION_PACKET_OUTPUT_DIR: outputDir }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }))
  const artifactPath = join(outputDir, 'complete.json')
  const bytes = await readFile(artifactPath)
  const evidence = JSON.parse(bytes)
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-interpretation-packet-boundary.mjs', artifactPath], { encoding: 'utf8' }))

  assert.equal(materialized.artifactByteSha256, sha256(bytes))
  assert.equal(checked.artifactByteSha256, sha256(bytes))
  assert.equal(evidence.packetContentSha256, evidence.packet.packetContentSha256)
  assert.equal(evidence.packetContentSha256, packetContentSha256(evidence.packet))
  assert.equal(checked.packetContentSha256, evidence.packetContentSha256)
  assert.notEqual(sha256(bytes), evidence.packetContentSha256)
  assert.equal(evidence.packet.activation.availableForInterpretation, false)
  assert.equal(evidence.packet.activation.integrationStatus, 'not_connected')
  assert.equal(evidence.packet.activation.serviceEligibility, 'blocked')
})
