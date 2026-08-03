import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const materializer = join(root, 'scripts/materialize-ziwei-readiness-baseline-v1.mjs')
const checker = join(root, 'scripts/check-ziwei-readiness-baseline-v1.mjs')

test('ziwei readiness baseline materializes byte-identically and passes its checker', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-baseline-'))
  try {
    const first = join(dir, 'first.json')
    const second = join(dir, 'second.json')
    assert.equal(spawnSync(process.execPath, [materializer, first], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, second], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(first), await readFile(second))
    const checked = spawnSync(process.execPath, [checker, first], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    const result = JSON.parse(checked.stdout)
    assert.equal(result.pass, true)
    assert.equal(result.layerCount, 11)
    assert.equal(result.evidenceCount, 12)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
