import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('claim relation graph materialization is deterministic and fail-closed', async () => {
  const firstDir = await mkdtemp(join(tmpdir(), 'astrology-claim-relation-graph-a-'))
  const secondDir = await mkdtemp(join(tmpdir(), 'astrology-claim-relation-graph-b-'))
  const run = outputDir => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-claim-relation-graph-v1.mjs'], { env: { ...process.env, ASTROLOGY_CLAIM_RELATION_GRAPH_OUTPUT_DIR: outputDir }, encoding: 'utf8' }))
  const first = run(firstDir)
  const second = run(secondDir)
  const firstBytes = await readFile(join(firstDir, 'complete.json'))
  const secondBytes = await readFile(join(secondDir, 'complete.json'))
  assert.deepEqual({ ...first, output: undefined }, { ...second, output: undefined })
  assert.deepEqual(firstBytes, secondBytes)
  assert.equal(first.nodeCount, 53)
  assert.equal(first.graphContentSha256, first.graphContentSha256.toLowerCase())
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-claim-relation-graph-v1.mjs', join(firstDir, 'complete.json')], { encoding: 'utf8' }))
  assert.equal(checked.pass, true)
  assert.equal(checked.activation.availableForInterpretation, false)
})
