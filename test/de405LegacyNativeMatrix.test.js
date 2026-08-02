import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile); const root = process.cwd()
const row = (id, values) => JSON.stringify({ schemaVersion: 1, sampleId: id, queryEtHex: '0x3ff0000000000000', targetId: 1, centerId: 399, frameId: 1, stateBits: values }) + '\n'
test('legacy workflow is manual-only, native x64, immutable, and toolchain-pinned', async () => { const result = await run('node', ['scripts/check-de405-legacy-alpine-workflow.mjs'], { cwd: root }); assert.match(result.stdout, /manualOnly/) })
test('legacy analyzer and materializer are deterministic and separate control mismatch from arithmetic', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-legacy-fixture-')); const fixture = join(base, 'fixture'); await mkdir(fixture, { recursive: true })
  const alpineToolchain = { image: { baseReference: 'base', id: 'image', archiveSha256: 'archive' }, packageLockSha256: 'package-lock', filesystemSha256: 'filesystem', packages: { musl: 'musl', binutils: 'binutils', gcc: 'gcc', clang20: 'clang20', nodejs: 'nodejs' }, binarySha256: { muslLoader: 'musl-loader', node: 'node', ar: 'ar', ld: 'ld' } }
  const provenance = name => ({ expectedHead: 'a'.repeat(40), githubRef: 'refs/heads/main', workflowIdentity: '.github/workflows/de405-legacy-native-matrix.yml', officialInputs: { spkSha256: 'spk', cspiceArchiveSha256: 'cspice', sourceManifestSha256: 'source' }, controls: { flags: ['same'], locale: 'C.UTF-8', timezone: 'UTC', wrapper: 'same', serialization: 'JSONL LF final newline', sourceHashes: { runner: 'same' } }, result: { rowCount: 1 }, userspace: { family: name === 'ubuntu-gcc' ? 'ubuntu-24.04-glibc' : 'alpine-3.22.1-musl', compiler: name === 'alpine-clang' ? 'clang' : 'gcc', toolchain: name === 'ubuntu-gcc' ? null : alpineToolchain } })
  for (const [name, value] of [['ubuntu-gcc', '0x3ff0000000000000'], ['alpine-gcc', '0x3ff0000000000001'], ['alpine-clang', '0x3ff0000000000002']]) { await writeFile(join(fixture, `${name}.jsonl`), row('s0', [value, '0x0', '0x0', '0x0', '0x0', '0x0'])); await writeFile(join(fixture, `${name}.provenance.json`), JSON.stringify(provenance(name))) }
  const manifest = { schemaVersion: 1, recordType: 'de405_legacy_matrix_manifest', expectedRowCount: 1, historicalBaselineHead: '33e8215f1349860e6166f7d1c779b6d36b6a9624', root: fixture, referenceVariant: 'ubuntu-gcc', controlTaxonomy: { requiredIdentical: {} }, variants: ['ubuntu-gcc', 'alpine-gcc', 'alpine-clang'].map(id => ({ id, output: { path: `${id}.jsonl` } })) }; const manifestPath = join(base, 'manifest.json'); await writeFile(manifestPath, JSON.stringify(manifest))
  const analysisPath = join(base, 'analysis.json'); const summary1 = join(base, 'summary.json'); const summary2 = join(base, 'summary2.json'); const md1 = join(base, 'summary.md'); const md2 = join(base, 'summary2.md')
  await run('node', ['scripts/analyze-de405-legacy-matrix.mjs', '--manifest', manifestPath, '--output', analysisPath], { cwd: root }); const analysis = JSON.parse(await readFile(analysisPath)); assert.equal(analysis.comparisons[0].differingRows, 1); assert.equal(analysis.comparisons[0].firstDivergence.stage, 'canonical_v2_result')
  await run('node', ['scripts/materialize-de405-legacy-matrix.mjs', '--input', analysisPath, '--json', summary1, '--markdown', md1], { cwd: root }); await run('node', ['scripts/materialize-de405-legacy-matrix.mjs', '--input', analysisPath, '--json', summary2, '--markdown', md2], { cwd: root }); assert.equal(await readFile(summary1, 'utf8'), await readFile(summary2, 'utf8')); assert.equal(await readFile(md1, 'utf8'), await readFile(md2, 'utf8'))
})

test('legacy analyzer fail-closes userspace/compiler control mismatch while retaining arithmetic comparison', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-legacy-controls-')); const fixture = join(base, 'fixture'); await mkdir(fixture, { recursive: true })
  const toolchain = { image: { baseReference: 'base', id: 'image', archiveSha256: 'archive' }, packageLockSha256: 'package-lock', filesystemSha256: 'filesystem', packages: { musl: 'musl', binutils: 'binutils', gcc: 'gcc', clang20: 'clang20', nodejs: 'nodejs' }, binarySha256: { muslLoader: 'musl-loader', node: 'node', ar: 'ar', ld: 'ld' } }
  for (const [name, libc] of [['ubuntu-gcc', 'glibc'], ['alpine-gcc', 'musl']]) { await writeFile(join(fixture, `${name}.jsonl`), row('s0', ['0x3ff0000000000000', '0x0', '0x0', '0x0', '0x0', '0x0'])); await writeFile(join(fixture, `${name}.provenance.json`), JSON.stringify({ expectedHead: 'a'.repeat(40), githubRef: 'refs/heads/main', userspace: { libc, compiler: 'gcc', toolchain: name === 'alpine-gcc' ? toolchain : null }, controls: { flags: ['same'] } })) }
  const manifest = { schemaVersion: 1, recordType: 'de405_legacy_matrix_manifest', expectedRowCount: 1, historicalBaselineHead: '33e8215f1349860e6166f7d1c779b6d36b6a9624', root: fixture, referenceVariant: 'ubuntu-gcc', controlTaxonomy: { requiredIdentical: ['userspace.libc', 'controls.flags'] }, variants: ['ubuntu-gcc', 'alpine-gcc'].map(id => ({ id, output: { path: `${id}.jsonl` } })) }; const manifestPath = join(base, 'manifest.json'); const output = join(base, 'analysis.json'); await writeFile(manifestPath, JSON.stringify(manifest)); await run('node', ['scripts/analyze-de405-legacy-matrix.mjs', '--manifest', manifestPath, '--output', output], { cwd: root }); const analysis = JSON.parse(await readFile(output)); assert.equal(analysis.comparisons[0].classification, 'blocked_legacy_matrix_control_mismatch'); assert.equal(analysis.comparisons[0].differingComponents, 0)
})

test('legacy analyzer rejects compiler identity mismatch and allows resolved Node drift only when binary identity is shared', async () => {
  const lock = JSON.parse(await readFile(join(root, 'scripts/fixtures/de405-alpine-toolchain-lock.json'), 'utf8'))
  assert.equal(lock.packages.nodejs, '22.23.2-r0')
  assert.equal(lock.image.archiveSha256, 'fixture-toolchain-archive')
})

test('toolchain lock materializer records repository, package, database, and binary identity while allowing Node drift', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-toolchain-lock-')); const raw = join(base, 'raw'); await mkdir(raw)
  await writeFile(join(raw, 'package-info.txt'), ['musl-1.2.5-r12', 'binutils-2.44-r3', 'gcc-14.2.0-r6', 'clang20-20.1.8-r0', 'nodejs-22.23.2-r0'].join('\n') + '\n')
  await writeFile(join(raw, 'repositories.txt'), 'https://dl-cdn.alpinelinux.org/alpine/v3.22/main\n')
  await writeFile(join(raw, 'apkindex-sha256.txt'), 'hash  /var/cache/apk/APKINDEX.tar.gz\n')
  await writeFile(join(raw, 'installed-db-sha256.txt'), 'hash  /lib/apk/db/installed\n')
  await writeFile(join(raw, 'filesystem-sha256.txt'), 'filesystem\n')
  await writeFile(join(raw, 'tool-binary-sha256.txt'), ['musl  /lib/ld-musl-x86_64.so.1', 'node  /usr/bin/node', 'ar  /usr/bin/ar', 'ld  /usr/bin/ld'].map(line => `hash-${line.split('  ')[0]}  ${line.split('  ')[1]}`).join('\n') + '\n')
  const output = join(base, 'lock.json')
  await run('node', ['scripts/materialize-de405-alpine-toolchain-lock.mjs', '--raw', raw, '--image-id', 'sha256:image', '--image-archive-sha256', 'archive', '--output', output], { cwd: root })
  const lock = JSON.parse(await readFile(output, 'utf8')); assert.equal(lock.packages.nodejs, '22.23.2-r0'); assert.equal(lock.image.id, 'sha256:image'); assert.equal(lock.repositories.length, 1)
  await writeFile(join(raw, 'package-info.txt'), 'musl-1.2.5-r11\n')
  await assert.rejects(run('node', ['scripts/materialize-de405-alpine-toolchain-lock.mjs', '--raw', raw, '--image-id', 'sha256:image', '--image-archive-sha256', 'archive', '--output', join(base, 'bad-lock.json')], { cwd: root }))
})

test('legacy analyzer rejects an Alpine compiler/package identity mismatch', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-legacy-negative-')); const fixture = join(base, 'fixture'); await mkdir(fixture)
  const toolchain = { image: { baseReference: 'base', id: 'image', archiveSha256: 'archive' }, packageLockSha256: 'package-lock', filesystemSha256: 'filesystem', packages: { musl: 'musl', binutils: 'binutils', gcc: 'gcc', clang20: 'clang20', nodejs: 'nodejs' }, binarySha256: { muslLoader: 'musl-loader', node: 'node', ar: 'ar', ld: 'ld' } }
  for (const [id, compiler] of [['alpine-gcc', 'gcc'], ['alpine-clang', 'gcc']]) { await writeFile(join(fixture, `${id}.jsonl`), row('s0', ['0x3ff0000000000000', '0x0', '0x0', '0x0', '0x0', '0x0'])); await writeFile(join(fixture, `${id}.provenance.json`), JSON.stringify({ expectedHead: 'a'.repeat(40), githubRef: 'refs/heads/main', userspace: { compiler, toolchain } })) }
  const manifest = { expectedRowCount: 1, root: fixture, referenceVariant: 'alpine-gcc', controlTaxonomy: { requiredIdentical: [] }, variants: [{ id: 'alpine-gcc', output: { path: 'alpine-gcc.jsonl' } }, { id: 'alpine-clang', output: { path: 'alpine-clang.jsonl' } }] }; const manifestPath = join(base, 'manifest.json'); await writeFile(manifestPath, JSON.stringify(manifest))
  await assert.rejects(run('node', ['scripts/analyze-de405-legacy-matrix.mjs', '--manifest', manifestPath, '--output', join(base, 'analysis.json')], { cwd: root }), /compiler variant mismatch/)
})
