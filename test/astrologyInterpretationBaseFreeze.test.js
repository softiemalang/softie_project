import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

test('interpretation base freeze manifest is byte-stable and fail-closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-interpretation-base-freeze-'))
  const first = join(root, 'first.json'); const second = join(root, 'second.json')
  const materialize = output => execFileSync(process.execPath, ['scripts/materialize-astrology-interpretation-base-v1-freeze.mjs'], { env: { ...process.env, ASTROLOGY_BASE_FREEZE_OUTPUT: output }, encoding: 'utf8' })
  materialize(first); materialize(second)
  assert.deepEqual(await readFile(first), await readFile(second))
  const checked = execFileSync(process.execPath, ['scripts/check-astrology-interpretation-base-v1-freeze.mjs', first], { encoding: 'utf8' })
  assert.equal(JSON.parse(checked).pass, true)
  const tampered = JSON.parse(await readFile(first, 'utf8')); tampered.manifestContentSha256 = '0'.repeat(64)
  const tamperedPath = join(root, 'tampered.json'); await writeFile(tamperedPath, `${JSON.stringify(tampered, null, 2)}\n`)
  assert.throws(() => execFileSync(process.execPath, ['scripts/check-astrology-interpretation-base-v1-freeze.mjs', tamperedPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), /manifest_content_hash_mismatch/)
})
