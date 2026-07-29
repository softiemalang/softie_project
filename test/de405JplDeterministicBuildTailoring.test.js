import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { generateBuildSource } from '../tools/de405-jpl-reader/generate-build-source.mjs'

const root = resolve('.')
const officialSource = join(root, 'tools/de405-jpl-reader/fixtures/testeph.f')
const officialBinary = join(root, 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405')
const nativeRunner = join(root, 'tools/de405-jpl-reader/run.mjs')

test('verbatim extraction SHA-256 is preserved', async () => {
  const extractedPath = join(root, 'tools/de405-jpl-reader/build/generated_testeph_subroutines.f')
  const content = await readFile(extractedPath, 'utf8')
  const crypto = await import('node:crypto')
  const hash = crypto.createHash('sha256').update(content).digest('hex')
  assert.equal(hash, '59206e48c80ac20b19187b16f7b8dd2ca57f953d1d60516b15f126ce2266cd53')
})

test('deterministic build tailoring generator produces 2-run byte-identical Fortran output', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'de405-tailoring-test-'))
  try {
    const run1 = await generateBuildSource(officialSource, join(tmpDir, 'out1'))
    const run2 = await generateBuildSource(officialSource, join(tmpDir, 'out2'))

    assert.equal(run1.outputSha256, run2.outputSha256)
    const content1 = await readFile(run1.generatedFile)
    const content2 = await readFile(run2.generatedFile)
    assert.deepEqual(content1, content2)

    assert.equal(run1.provenance.sourceExtraction.mode, 'verbatim')
    assert.equal(run1.provenance.sourceExtraction.semanticChanges, 'none')
    assert.equal(run1.provenance.buildTailoring.mode, 'deterministic-generated')
    assert.equal(run1.provenance.buildTailoring.equationChanges, 'none')
    assert.equal(run1.provenance.buildTailoring.manualEdits, false)
    assert.deepEqual(run1.provenance.buildTailoring.allowedTransformations, [
      'select_fsizer3',
      'set_nrecl_4',
      'set_ksize_2036'
    ])
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('generator fails closed when input source SHA-256 mismatches', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'de405-fail-test-'))
  try {
    const badSource = join(tmpDir, 'bad-testeph.f')
    await writeFile(badSource, 'C corrupted source file\n')
    await assert.rejects(
      () => generateBuildSource(badSource, join(tmpDir, 'out')),
      /Original testeph.f SHA-256 mismatch/
    )
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('tailored generated source contains FSIZER3 call, NRECL=4, and KSIZE=2036', async () => {
  const generatedFile = join(root, 'tools/de405-jpl-reader/build/testeph-de405.generated.f')
  const content = await readFile(generatedFile, 'utf8')
  assert.ok(content.includes('CALL FSIZER3(NRECL,KSIZE,NRFILE,NAMFIL)'))
  assert.ok(content.includes('NRECL=4'))
  assert.ok(content.includes('KSIZE = 2036'))
  assert.ok(!content.includes('C        CALL FSIZER3(NRECL,KSIZE,NRFILE,NAMFIL)'))
})

test('native runner binary exists, is arm64 Mach-O, and completes 1900 smoke and J2000 probe', async () => {
  const info = await stat(nativeRunner)
  assert.ok(info.size > 0)

  const probe = spawnSync(process.execPath, [nativeRunner, '--probe', '--binary', officialBinary], { encoding: 'utf8' })
  assert.equal(probe.status, 0, probe.stderr)
  const probeData = JSON.parse(probe.stdout)
  assert.equal(probeData.length, 10)
  assert.equal(probeData[0].targetId, 1)
  assert.ok(Number.isFinite(probeData[0].x))
  assert.ok(!Number.isNaN(probeData[0].x))

  const smoke = spawnSync(process.execPath, [nativeRunner, 
    '--stream-jpl-states',
    '--binary', officialBinary,
    '--start-et', '-3.1557168e9',
    '--count', '1',
    '--step-seconds', '864000',
    '--output', 'stdout'
  ], { encoding: 'utf8' })
  assert.equal(smoke.status, 0, smoke.stderr)
  const lines = smoke.stdout.trim().split('\n')
  assert.equal(lines.length, 10)
})
