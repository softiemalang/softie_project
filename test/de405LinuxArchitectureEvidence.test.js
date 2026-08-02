import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = process.cwd()

async function makeFixture(dir, overrides = {}) {
  await mkdir(dir, { recursive: true })
  const rows = [
    { schemaVersion: 1, sampleId: 's0', queryEtHex: '0x3ff0000000000000', stateKmKmPerSec: [1, 2, 3, 4, 5, 6] },
    { schemaVersion: 1, sampleId: 's1', queryEtHex: '0x4000000000000000', stateKmKmPerSec: [7, 8, 9, 10, 11, 12] }
  ]
  await writeFile(join(dir, 'result.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n')
  const sourceHashes = { runnerSource: 'a', samples: 'b', spk: 'c', cspiceHeader: 'd', cspiceLibrary: 'e', csupportLibrary: 'f' }
  const provenance = { schemaVersion: 1, evidenceKind: 'de405-linux-architecture', fixture: true, expectedHead: 'fixture', githubSha: 'fixture', githubRef: 'refs/heads/main', workflowIdentity: '.github/workflows/de405-linux-architecture-evidence.yml', architecture: dir.includes('arm') ? 'arm64' : 'x64', runnerLabel: dir.includes('arm') ? 'ubuntu-24.04-arm' : 'ubuntu-24.04', execution: 'fixture', emulation: false, sampleAsset: { archiveSha256: 'fixture', urlSha256: 'fixture' }, officialInputs: { cspiceArchiveSha256: 'fixture', spkSha256: 'fixture', sourceManifestSha256: 'fixture', cspiceUrlSha256: 'fixture', spkUrlSha256: 'fixture', arm64SourcePort: dir.includes('arm') }, host: { imageOS: dir.includes('arm') ? 'fixture-arm-os' : 'fixture-os', imageVersion: dir.includes('arm') ? 'fixture-arm-image' : 'fixture-image', uname: 'fixture', machine: dir.includes('arm') ? 'aarch64' : 'x86_64' }, userspace: { family: 'ubuntu-24.04', osRelease: 'fixture Ubuntu 24.04', libc: 'glibc', compiler: 'gcc', compilerVersion: 'gcc fixture', compilerTarget: dir.includes('arm') ? 'aarch64-linux-gnu' : 'x86_64-linux-gnu', node: process.version }, cspiceBuild: { compiler: 'gcc', compilerVersion: 'gcc fixture', compilerTarget: dir.includes('arm') ? 'aarch64-linux-gnu' : 'x86_64-linux-gnu', architecture: dir.includes('arm') ? 'arm64' : 'x64', flags: ['fixture'], sourceManifestSha256: 'fixture', libraries: { cspice: { sha256: dir.includes('arm') ? 'arm-lib' : 'x64-lib' }, csupport: { sha256: dir.includes('arm') ? 'arm-support' : 'x64-support' } } }, container: { used: false, image: null }, controls: { flags: ['fixture'], locale: 'C.UTF-8', timezone: 'UTC', wrapper: 'fixture', serialization: 'JSONL LF final newline', sourceHashes, artifactHashes: { cspiceLibrary: dir.includes('arm') ? 'arm-lib' : 'x64-lib', csupportLibrary: dir.includes('arm') ? 'arm-support' : 'x64-support' } }, result: { path: 'result.jsonl', sha256: 'fixture', bytes: 0, rowCount: 2, lineEnding: 'lf_only_final_lf' } }
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(provenance[key], value)
    else provenance[key] = value
  }
  await writeFile(join(dir, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n')
}

test('workflow contract and deterministic fixture compare', async () => {
  const workflowCheck = await run('node', ['scripts/check-de405-linux-architecture-workflow.mjs'], { cwd: root })
  assert.match(workflowCheck.stdout, /ok: workflow contract/)
  const base = await mkdtemp(join(tmpdir(), 'de405-linux-fixture-'))
  const x = join(base, 'x64'); const a = join(base, 'arm64')
  await makeFixture(x); await makeFixture(a)
  const analysis = join(base, 'analysis.json'); const analysis2 = join(base, 'analysis2.json'); const summary = join(base, 'summary.json'); const summary2 = join(base, 'summary2.json'); const md = join(base, 'summary.md'); const md2 = join(base, 'summary2.md')
  await run('node', ['scripts/analyze-de405-linux-architecture-evidence.mjs', '--x64', x, '--arm64', a, '--output', analysis], { cwd: root })
  await run('node', ['scripts/analyze-de405-linux-architecture-evidence.mjs', '--x64', x, '--arm64', a, '--output', analysis2], { cwd: root })
  assert.equal(await readFile(analysis, 'utf8'), await readFile(analysis2, 'utf8'))
  await run('node', ['scripts/materialize-de405-linux-architecture-summary.mjs', '--input', analysis, '--json', summary, '--markdown', md], { cwd: root })
  await run('node', ['scripts/materialize-de405-linux-architecture-summary.mjs', '--input', analysis, '--json', summary2, '--markdown', md2], { cwd: root })
  await run('node', ['scripts/check-de405-linux-architecture-evidence.mjs', '--input', summary], { cwd: root })
  assert.equal(await readFile(summary, 'utf8'), await readFile(summary2, 'utf8'))
  assert.equal(await readFile(md, 'utf8'), await readFile(md2, 'utf8'))
})

test('persisted remote architecture summary has a checked identity record', async () => {
  const summaryPath = join(root, 'docs/de405-linux-architecture-summary.json')
  const markdownPath = join(root, 'docs/de405-linux-architecture-summary.md')
  const record = JSON.parse(await readFile(join(root, 'docs/de405-linux-architecture-remote-record.json'), 'utf8'))
  const summaryBytes = await readFile(summaryPath)
  const markdownBytes = await readFile(markdownPath)
  const summary = JSON.parse(summaryBytes)
  assert.equal(summary.classification, 'blocked_reproducible_linux_userspace_unavailable')
  assert.equal(summary.sampleCount, 150671)
  assert.equal(record.runId, '30748663327')
  assert.equal(record.head, '234969cad8a96a30386bfd9b115210d744b58716')
  assert.equal(record.summary.sha256, createHash('sha256').update(summaryBytes).digest('hex'))
  assert.equal(record.summary.markdownSha256, createHash('sha256').update(markdownBytes).digest('hex'))
})

test('v2 permits image metadata and architecture-specific compiled identities', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-linux-v2-positive-'))
  const x = join(base, 'x64'); const a = join(base, 'arm64')
  await makeFixture(x); await makeFixture(a)
  const output = join(base, 'analysis.json')
  await run('node', ['scripts/analyze-de405-linux-architecture-evidence.mjs', '--x64', x, '--arm64', a, '--output', output], { cwd: root })
  const analysis = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(analysis.classification, 'no_architecture_effect_observed_semantically_matched_linux_userspace')
  assert.deepEqual(analysis.controls.mismatchedRequired, [])
  assert.ok(analysis.controls.differingArchitecture.includes('userspace.compilerTarget'))
  assert.ok(analysis.controls.differingObservational.includes('host.imageOS'))
})

test('v2 blocks a semantic compiler mismatch', async () => {
  const base = await mkdtemp(join(tmpdir(), 'de405-linux-v2-negative-'))
  const x = join(base, 'x64'); const a = join(base, 'arm64')
  await makeFixture(x); await makeFixture(a, { userspace: { compilerVersion: 'gcc different' } })
  const output = join(base, 'analysis.json')
  await run('node', ['scripts/analyze-de405-linux-architecture-evidence.mjs', '--x64', x, '--arm64', a, '--output', output], { cwd: root })
  const analysis = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(analysis.classification, 'blocked_required_userspace_control_mismatch')
  assert.deepEqual(analysis.controls.mismatchedRequired, ['userspace.compilerVersion'])
})
