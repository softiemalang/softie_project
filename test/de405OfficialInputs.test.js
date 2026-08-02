import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
const run = promisify(execFile)
const root = process.cwd()
const archive = process.env.DE405_OFFICIAL_CSPICE_ARCHIVE
const spk = process.env.DE405_OFFICIAL_SPK
test('official NAIF archive and SPK are hash-verified and source-only extracted', { skip: !archive || !spk }, async () => {
  const out = await mkdtemp(join(tmpdir(), 'de405-official-inputs-test-'))
  const result = await run('node', ['scripts/fetch-de405-linux-official-inputs.mjs', '--output', out, '--cspice-archive', archive, '--spk-file', spk], { cwd: root, maxBuffer: 1024 * 1024 })
  const provenance = JSON.parse(await readFile(join(out, 'acquisition-provenance.json'), 'utf8'))
  assert.equal(provenance.cspice.sha256, '60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce')
  assert.equal(provenance.spk.sha256, '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89')
  assert.equal(provenance.inputs.sourceFileCount, 2547)
  assert.match(result.stdout, /sourceManifestSha256/)
})
