import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

test('conversation grounding materialization is deterministic and negative evidence is checked', async () => {
  const firstDir = await mkdtemp(join(tmpdir(), 'astrology-grounding-a-')); const secondDir = await mkdtemp(join(tmpdir(), 'astrology-grounding-b-'))
  const run = outputDir => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-conversation-grounding-v1.mjs'], { env: { ...process.env, ASTROLOGY_GROUNDING_OUTPUT_DIR: outputDir }, encoding: 'utf8' }))
  const first = run(firstDir); const second = run(secondDir)
  assert.equal(first.bundleContentSha256, second.bundleContentSha256)
  assert.equal(first.claimCount, 53); assert.equal(first.relationCount, 1753)
  assert.deepEqual(await readFile(join(firstDir, 'complete.json')), await readFile(join(secondDir, 'complete.json')))
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-conversation-grounding-v1.mjs', join(firstDir, 'complete.json')], { encoding: 'utf8' }))
  assert.equal(checked.pass, true)
  assert.equal(checked.claimCount, 53); assert.equal(checked.relationCount, 1753)
})
