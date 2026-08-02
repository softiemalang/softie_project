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
  const provenance = name => ({ expectedHead: 'a'.repeat(40), githubRef: 'refs/heads/main', workflowIdentity: '.github/workflows/de405-legacy-native-matrix.yml', officialInputs: { spkSha256: 'spk', cspiceArchiveSha256: 'cspice', sourceManifestSha256: 'source' }, controls: { flags: ['same'], locale: 'C.UTF-8', timezone: 'UTC', wrapper: 'same', serialization: 'JSONL LF final newline', sourceHashes: { runner: 'same' } }, result: { rowCount: 1 }, userspace: { family: name === 'ubuntu-gcc' ? 'ubuntu-24.04-glibc' : 'alpine-3.22.1-musl' } })
  for (const [name, value] of [['ubuntu-gcc', '0x3ff0000000000000'], ['alpine-gcc', '0x3ff0000000000001'], ['alpine-clang', '0x3ff0000000000002']]) { await writeFile(join(fixture, `${name}.jsonl`), row('s0', [value, '0x0', '0x0', '0x0', '0x0', '0x0'])); await writeFile(join(fixture, `${name}.provenance.json`), JSON.stringify(provenance(name))) }
  const manifest = { schemaVersion: 1, recordType: 'de405_legacy_matrix_manifest', expectedRowCount: 1, historicalBaselineHead: '33e8215f1349860e6166f7d1c779b6d36b6a9624', root: fixture, referenceVariant: 'ubuntu-gcc', controlTaxonomy: { requiredIdentical: {} }, variants: ['ubuntu-gcc', 'alpine-gcc', 'alpine-clang'].map(id => ({ id, output: { path: `${id}.jsonl` } })) }; const manifestPath = join(base, 'manifest.json'); await writeFile(manifestPath, JSON.stringify(manifest))
  const analysisPath = join(base, 'analysis.json'); const summary1 = join(base, 'summary.json'); const summary2 = join(base, 'summary2.json'); const md1 = join(base, 'summary.md'); const md2 = join(base, 'summary2.md')
  await run('node', ['scripts/analyze-de405-legacy-matrix.mjs', '--manifest', manifestPath, '--output', analysisPath], { cwd: root }); const analysis = JSON.parse(await readFile(analysisPath)); assert.equal(analysis.comparisons[0].differingRows, 1); assert.equal(analysis.comparisons[0].firstDivergence.stage, 'canonical_v2_result')
  await run('node', ['scripts/materialize-de405-legacy-matrix.mjs', '--input', analysisPath, '--json', summary1, '--markdown', md1], { cwd: root }); await run('node', ['scripts/materialize-de405-legacy-matrix.mjs', '--input', analysisPath, '--json', summary2, '--markdown', md2], { cwd: root }); assert.equal(await readFile(summary1, 'utf8'), await readFile(summary2, 'utf8')); assert.equal(await readFile(md1, 'utf8'), await readFile(md2, 'utf8'))
})

test('legacy analyzer fail-closes userspace/compiler control mismatch while retaining arithmetic comparison', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-legacy-controls-')); const fixture = join(base, 'fixture'); await mkdir(fixture, { recursive: true })
  for (const [name, libc] of [['ubuntu-gcc', 'glibc'], ['alpine-gcc', 'musl']]) { await writeFile(join(fixture, `${name}.jsonl`), row('s0', ['0x3ff0000000000000', '0x0', '0x0', '0x0', '0x0', '0x0'])); await writeFile(join(fixture, `${name}.provenance.json`), JSON.stringify({ expectedHead: 'a'.repeat(40), githubRef: 'refs/heads/main', userspace: { libc }, controls: { flags: ['same'] } })) }
  const manifest = { schemaVersion: 1, recordType: 'de405_legacy_matrix_manifest', expectedRowCount: 1, historicalBaselineHead: '33e8215f1349860e6166f7d1c779b6d36b6a9624', root: fixture, referenceVariant: 'ubuntu-gcc', controlTaxonomy: { requiredIdentical: ['userspace.libc', 'controls.flags'] }, variants: ['ubuntu-gcc', 'alpine-gcc'].map(id => ({ id, output: { path: `${id}.jsonl` } })) }; const manifestPath = join(base, 'manifest.json'); const output = join(base, 'analysis.json'); await writeFile(manifestPath, JSON.stringify(manifest)); await run('node', ['scripts/analyze-de405-legacy-matrix.mjs', '--manifest', manifestPath, '--output', output], { cwd: root }); const analysis = JSON.parse(await readFile(output)); assert.equal(analysis.comparisons[0].classification, 'blocked_legacy_matrix_control_mismatch'); assert.equal(analysis.comparisons[0].differingComponents, 0)
})
