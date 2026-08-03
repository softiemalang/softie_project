import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

test('readiness materialization is byte deterministic and independently checked', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-interpretation-readiness-contract-'))
  const firstDir = join(root, 'first')
  const secondDir = join(root, 'second')
  const run = outputDir => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-interpretation-readiness-v1.mjs'], { env: { ...process.env, INTERPRETATION_READINESS_OUTPUT_DIR: outputDir }, encoding: 'utf8' }))
  const first = run(firstDir)
  const second = run(secondDir)
  const firstBytes = await readFile(join(firstDir, 'complete.json'))
  const secondBytes = await readFile(join(secondDir, 'complete.json'))
  assert.deepEqual(firstBytes, secondBytes)
  assert.equal(first.artifactByteSha256, sha256(firstBytes))
  assert.equal(second.artifactByteSha256, sha256(secondBytes))
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-interpretation-readiness-boundary.mjs', join(firstDir, 'complete.json')], { encoding: 'utf8' }))
  assert.equal(checked.pass, true)
  assert.equal(checked.decisions.localInterpretationResearch, 'eligible_for_local_interpretation_research')
  assert.equal(checked.decisions.userDelivery, 'not_eligible_for_user_delivery')
  assert.equal(checked.decisions.productionActivation, 'production_activation_blocked')
})
