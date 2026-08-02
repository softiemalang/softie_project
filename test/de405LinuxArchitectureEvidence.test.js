import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = process.cwd()

async function makeFixture(dir) {
  await mkdir(dir, { recursive: true })
  const rows = [
    { schemaVersion: 1, sampleId: 's0', queryEtHex: '0x3ff0000000000000', stateKmKmPerSec: [1, 2, 3, 4, 5, 6] },
    { schemaVersion: 1, sampleId: 's1', queryEtHex: '0x4000000000000000', stateKmKmPerSec: [7, 8, 9, 10, 11, 12] }
  ]
  await writeFile(join(dir, 'result.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n')
  const sourceHashes = { runnerSource: 'a', samples: 'b', spk: 'c', cspiceHeader: 'd', cspiceLibrary: 'e', csupportLibrary: 'f' }
  await writeFile(join(dir, 'provenance.json'), JSON.stringify({ schemaVersion: 1, evidenceKind: 'de405-linux-architecture', fixture: true, expectedHead: 'fixture', githubSha: 'fixture', githubRef: 'refs/heads/main', workflowIdentity: '.github/workflows/de405-linux-architecture-evidence.yml', architecture: dir.includes('arm') ? 'arm64' : 'x64', runnerLabel: 'fixture', execution: 'fixture', emulation: false, sampleAsset: { archiveSha256: 'fixture', urlSha256: 'fixture' }, officialInputs: { cspiceArchiveSha256: 'fixture', spkSha256: 'fixture', sourceManifestSha256: 'fixture', cspiceUrlSha256: 'fixture', spkUrlSha256: 'fixture', arm64SourcePort: dir.includes('arm') }, host: { imageOS: 'fixture-os', imageVersion: 'fixture-image', uname: 'fixture', machine: 'fixture' }, userspace: { family: 'ubuntu-24.04', osRelease: 'fixture Ubuntu 24.04', libc: 'glibc', compiler: 'gcc', compilerVersion: 'gcc fixture', compilerTarget: 'fixture', node: process.version }, cspiceBuild: { compiler: 'gcc', compilerVersion: 'gcc fixture', flags: ['fixture'], sourceManifestSha256: 'fixture' }, container: { used: false, image: null }, controls: { flags: ['fixture'], locale: 'C.UTF-8', timezone: 'UTC', wrapper: 'fixture', serialization: 'JSONL LF final newline', sourceHashes, artifactHashes: { cspiceLibrary: 'fixture', csupportLibrary: 'fixture' } }, result: { path: 'result.jsonl', sha256: 'fixture', bytes: 0, rowCount: 2, lineEnding: 'lf_only_final_lf' } }, null, 2) + '\n')
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
