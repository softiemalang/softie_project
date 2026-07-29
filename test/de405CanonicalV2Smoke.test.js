import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { validateBytes } from '../scripts/lib/de405-canonical-v2-io.mjs'
import { sha256 } from '../scripts/lib/de405-canonical-v2-hash.mjs'

const root = resolve('.')
const smokeTemplate = join(root, 'test/fixtures/astrology/de405/canonical-v2/smoke-manifest.template.json')
const fullTemplate = join(root, 'test/fixtures/astrology/de405/canonical-v2/manifest.template.json')
const fakeRunner = join(root, 'test/helpers/fake-de405-cspice-runner.mjs')
const generator = join(root, 'scripts/generate-de405-canonical-v2.mjs')
const validator = join(root, 'scripts/validate-de405-canonical-v2.mjs')

async function fixtureRoot() {
  const dir = await mkdtemp(join(tmpdir(), 'de405-v2-smoke-test-'))
  const manifest = join(dir, 'smoke-manifest.json')
  const full = join(dir, 'full-manifest.json')
  const spk = join(dir, 'de405.bsp')
  const smoke = JSON.parse(await readFile(smokeTemplate, 'utf8'))
  await writeFile(full, await readFile(fullTemplate))
  await writeFile(spk, 'test-only SPK placeholder')
  smoke.sourceFiles.spk.sizeBytes = (await stat(spk)).size
  smoke.sourceFiles.spk.sha256 = await sha256(spk)
  smoke.runner.binarySha256 = await sha256(fakeRunner)
  await writeFile(manifest, JSON.stringify(smoke, null, 2) + '\n')
  return { dir, manifest, full, spk }
}

function run(command, args, env = {}) {
  return spawnSync(process.execPath, [command, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } })
}

async function generateSmoke(ctx, name, env = {}) {
  const outputDir = join(ctx.dir, name)
  const result = run(generator, ['--manifest', ctx.manifest, '--spk', ctx.spk, '--runner', fakeRunner, '--output-dir', outputDir], env)
  assert.equal(result.status, 0, result.stderr)
  const output = join(outputDir, 'de405-canonical-v2-overlap-smoke.jsonl')
  const generatedManifest = join(outputDir, 'manifest.json')
  const validation = run(validator, ['--manifest', generatedManifest, '--input', output])
  assert.equal(validation.status, 0, validation.stderr)
  return { outputDir, output, generatedManifest, digest: JSON.parse(validation.stdout).sha256 }
}

test('real smoke profile generates 10 rows and independent validator accepts it', async () => {
  const ctx = await fixtureRoot()
  try {
    const result = await generateSmoke(ctx, 'run-1')
    const manifest = JSON.parse(await readFile(result.generatedManifest, 'utf8'))
    assert.equal(manifest.materializationProfile, 'cspice-overlap-smoke')
    assert.equal(manifest.sourceRole, 'independent_cross_reference')
    assert.equal(manifest.coverageRole, 'overlap_only')
    assert.equal(manifest.canonicalEligible, false)
    assert.equal(manifest.requestedStartEt, '0.0000000000000000e+00')
    assert.equal(manifest.canonical, false)
    assert.equal(manifest.status, 'smoke_verified')
    assert.equal(manifest.provenanceStatus, 'test_only')
    assert.equal(manifest.output.rowCount, 10)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('two smoke generations are byte-identical', async () => {
  const ctx = await fixtureRoot()
  try {
    const first = await generateSmoke(ctx, 'run-1')
    const second = await generateSmoke(ctx, 'run-2')
    assert.deepEqual(await readFile(first.output), await readFile(second.output))
    assert.equal(first.digest, second.digest)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('smoke contract rejects wrong row counts, start ET, target omission, order, and ID 3', async () => {
  const ctx = await fixtureRoot()
  try {
    const result = await generateSmoke(ctx, 'valid')
    const manifest = JSON.parse(await readFile(ctx.manifest, 'utf8'))
    const valid = (await readFile(result.output, 'utf8')).trimEnd().split('\n')
    for (const count of [9, 11]) { const rows = count === 11 ? [...valid, valid[9]] : valid.slice(0, count); await rejectsBytes(ctx.dir, rows.join('\n') + '\n', manifest, /row count mismatch/) }
    const wrongStart = [...valid]; wrongStart[0] = wrongStart[0].replace('0.0000000000000000e+00', '1.0000000000000000e+00')
    await rejectsBytes(ctx.dir, wrongStart.join('\n') + '\n', manifest, /start ET mismatch/)
    const omitted = [...valid]; omitted[9] = omitted[8]
    await rejectsBytes(ctx.dir, omitted.join('\n') + '\n', manifest, /ordering mismatch|duplicate pair/)
    const reordered = [...valid]; [reordered[0], reordered[1]] = [reordered[1], reordered[0]]
    await rejectsBytes(ctx.dir, reordered.join('\n') + '\n', manifest, /ordering mismatch/)
    const id3 = [...valid]; id3[0] = id3[0].replace('"targetId":1', '"targetId":3')
    await rejectsBytes(ctx.dir, id3.join('\n') + '\n', manifest, /target mismatch/)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('smoke and full profiles cannot approve each other or become canonical', async () => {
  const ctx = await fixtureRoot()
  try {
    const smoke = await generateSmoke(ctx, 'smoke')
    const full = JSON.parse(await readFile(ctx.full, 'utf8'))
    full.status = 'verified'; full.provenanceStatus = 'verified'; full.output = { file: 'x', sizeBytes: 0, rowCount: 10, sha256: 'x', generatedByRunnerSha256: 'x' }
    await assert.rejects(() => validateBytes(smoke.output, full), /JPL full-range regular-grid invariant mismatch|row count mismatch/)
    const smokeManifest = JSON.parse(await readFile(ctx.manifest, 'utf8'))
    const fullOutput = await writeTemp(ctx.dir, Array.from({ length: 10 }, () => '{}').join('\n') + '\n')
    await assert.rejects(() => validateBytes(fullOutput, smokeManifest), /key order mismatch|row count mismatch/)
    const promoted = { ...smokeManifest, canonical: true, canonicalEligible: true, status: 'verified', provenanceStatus: 'verified' }
    await assert.rejects(() => validateBytes(smoke.output, promoted), /source-role contract mismatch|smoke invariant mismatch/)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('smoke validator rejects negative zero, non-finite values, CRLF, and missing final LF', async () => {
  const ctx = await fixtureRoot()
  try {
    const result = await generateSmoke(ctx, 'valid')
    const manifest = JSON.parse(await readFile(ctx.manifest, 'utf8'))
    const text = await readFile(result.output, 'utf8')
    await rejectsBytes(ctx.dir, text.replace('0.0000000000000000e+00', '-0.0000000000000000e+00'), manifest, /numeric serialization mismatch/)
    await rejectsBytes(ctx.dir, text.replace('0.0000000000000000e+00', 'NaN'), manifest, /numeric serialization mismatch/)
    await rejectsBytes(ctx.dir, text.replaceAll('\n', '\r\n'), manifest, /CRLF forbidden/)
    await rejectsBytes(ctx.dir, text.slice(0, -1), manifest, /trailing LF required/)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('generator removes partial output after runner failure', async () => {
  const ctx = await fixtureRoot()
  try {
    const outputDir = join(ctx.dir, 'failed')
    const result = run(generator, ['--manifest', ctx.manifest, '--spk', ctx.spk, '--runner', fakeRunner, '--output-dir', outputDir], { FAKE_DE405_MODE: 'exit-nonzero' })
    assert.notEqual(result.status, 0)
    await assert.rejects(() => stat(outputDir))
    assert.deepEqual((await readdir(ctx.dir)).filter(name => name.startsWith('.canonical-v2-staging-')), [])
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('JPL full-range profile cannot execute through the CSPICE generator', async () => {
  const ctx = await fixtureRoot()
  try {
    const outputDir = join(ctx.dir, 'jpl-attempt')
    const result = run(generator, ['--manifest', ctx.full, '--spk', ctx.spk, '--runner', fakeRunner, '--output-dir', outputDir])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /jpl_official_reader_not_implemented|fake runner supports overlap smoke only|JPL generator failed/)
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('overlap manifest rejects role, canonical, fallback, and coverage mutations', async () => {
  const ctx = await fixtureRoot()
  try {
    const valid = JSON.parse(await readFile(ctx.manifest, 'utf8'))
    for (const mutation of [
      { sourceRole: 'primary_oracle' },
      { canonical: true, canonicalEligible: true },
      { fallbackAllowed: true },
      { coverageVerified: false },
      { sourceCoverageStartEt: '-1.5778799588160590e+09' },
      { requestedStartEt: '-3.1557168000000000e+09', requestedEndExclusiveEt: '-3.1557168000000000e+09' },
    ]) {
      await assert.rejects(() => validateBytes(join(ctx.dir, 'missing.jsonl'), { ...valid, ...mutation }), /ENOENT|source-role contract mismatch|coverage metadata missing or invalid|CSPICE source coverage mismatch|requested ET range mismatch/)
    }
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

test('generator rejects SPK and runner hash mismatches before invoking CSPICE', async () => {
  const ctx = await fixtureRoot()
  try {
    for (const field of ['sourceFiles', 'runner']) {
      const manifestValue = JSON.parse(await readFile(ctx.manifest, 'utf8'))
      if (field === 'sourceFiles') manifestValue.sourceFiles.spk.sha256 = '0'.repeat(64)
      else manifestValue.runner.binarySha256 = '0'.repeat(64)
      const manifestPath = join(ctx.dir, `${field}-mismatch.json`)
      await writeFile(manifestPath, JSON.stringify(manifestValue) + '\n')
      const result = run(generator, ['--manifest', manifestPath, '--spk', ctx.spk, '--runner', fakeRunner, '--output-dir', join(ctx.dir, `${field}-output`)])
      assert.notEqual(result.status, 0)
      assert.match(result.stderr, field === 'sourceFiles' ? /SPK source hash or size mismatch/ : /runner hash mismatch/)
    }
  } finally { await rm(ctx.dir, { recursive: true, force: true }) }
})

async function writeTemp(dir, content) {
  const file = join(dir, `candidate-${Math.random().toString(16).slice(2)}.jsonl`)
  await writeFile(file, content)
  return file
}

async function rejectsBytes(dir, content, manifest, pattern) {
  const file = await writeTemp(dir, content)
  await assert.rejects(() => validateBytes(file, manifest), pattern)
}
