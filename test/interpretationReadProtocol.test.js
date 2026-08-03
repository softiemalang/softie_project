import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

test('read protocol materialization is byte deterministic and fail-closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-interpretation-read-protocol-'))
  const firstDir = join(root, 'first'); const secondDir = join(root, 'second')
  const run = outputDir => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-interpretation-read-protocol-v1.mjs'], { env: { ...process.env, ASTROLOGY_READ_PROTOCOL_OUTPUT_DIR: outputDir }, encoding: 'utf8' }))
  const first = run(firstDir); const second = run(secondDir)
  const firstBytes = await readFile(join(firstDir, 'complete.json')); const secondBytes = await readFile(join(secondDir, 'complete.json'))
  assert.deepEqual(firstBytes, secondBytes)
  assert.equal(first.artifactByteSha256, sha256(firstBytes)); assert.equal(second.artifactByteSha256, sha256(secondBytes))
  const evidence = JSON.parse(firstBytes)
  assert.equal(evidence.protocol.protocolStatus, 'complete')
  assert.deepEqual(evidence.protocol.claimCounts, { total: 53, observedOrCalculated: 20, deterministicallyDerived: 33 })
  assert.equal(evidence.protocol.claimSourceTrace.length, 53)
  assert.equal(evidence.protocol.decisions.localResearch, 'eligible_for_local_interpretation_research')
  assert.equal(evidence.protocol.decisions.userDelivery, 'blocked')
  assert.equal(evidence.protocol.decisions.productionActivation, 'blocked')
  assert.equal(evidence.protocol.activation.availableForInterpretation, false)
  assert.equal(evidence.protocol.connected, false)
  assert.equal(evidence.protocol.interpretationBoundary.noMeaningBeforeExperience, true)
  for (const item of evidence.negativeEvidence) for (const code of item.expectedReasonCodes) assert.ok(item.observedReasonCodes.includes(code), `${item.caseId}: ${code}`)
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-interpretation-read-protocol-v1.mjs', join(firstDir, 'complete.json')], { encoding: 'utf8' }))
  assert.equal(checked.pass, true)
})
