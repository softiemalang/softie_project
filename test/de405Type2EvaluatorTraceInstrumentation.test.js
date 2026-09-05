import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { instrument, SOURCE_HASHES } from '../tools/de405-type2-evaluator-trace-probe/scripts/instrument-spke02.mjs'

const cspice = process.env.CSPICE_DIR || resolve(homedir(), '.local/share/softie-de405/cspice/N0067')
const sha = async path => createHash('sha256').update(await readFile(path)).digest('hex')

test('instrumentation guards official source identity and preserves originals', async () => {
  const spke02 = resolve(cspice, 'src/cspice/spke02.c'), chbint = resolve(cspice, 'src/cspice/chbint.c')
  const before = { spke02: await sha(spke02), chbint: await sha(chbint) }
  assert.deepEqual(before, SOURCE_HASHES)
  const dir = await mkdtemp(`${tmpdir()}/de405-type2-instrumentation-test.`)
  try {
    const result = await instrument({ cspiceRoot: cspice, outputDir: dir })
    assert.equal((await stat(result.instrumentedPaths.spke02)).isFile(), true)
    assert.equal((await stat(result.instrumentedPaths.chbint)).isFile(), true)
    assert.match(await readFile(result.instrumentedPaths.spke02, 'utf8'), /de405_spke02_trace_/)
    assert.match(await readFile(result.instrumentedPaths.chbint, 'utf8'), /de405_chbint_trace_/)
    assert.deepEqual({ spke02: await sha(spke02), chbint: await sha(chbint) }, before)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
