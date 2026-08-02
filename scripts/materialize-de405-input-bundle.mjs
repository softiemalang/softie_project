import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmod, mkdir, readFile, stat, utimes, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
for (const key of ['samples', 'output']) if (!args[key]) throw new Error(`--${key} is required`)
const output = resolve(args.output); const stage = join(output, 'stage'); const archive = join(output, 'de405-sample-asset.zip'); const fixed = new Date('1980-01-01T00:00:00Z')
await mkdir(stage, { recursive: true }); const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sampleBytes = await readFile(resolve(args.samples)); const samplePath = 'de405-jpl-cspice-residual-sweep.samples.jsonl';
if (sampleBytes.includes(0) || sampleBytes.includes('\r')) throw new Error('sample must be UTF-8 LF-only text')
if (sampleBytes[sampleBytes.length - 1] !== 10) throw new Error('sample must end with LF')
let rows = 0; for (const line of sampleBytes.toString('utf8').split('\n').slice(0, -1)) { const row = JSON.parse(line); if (row.schemaVersion !== 1 || row.recordType !== 'de405_spk_type2_sweep_sample' || typeof row.sampleId !== 'string' || !Array.isArray(row.jplStateKmKmPerSec) || row.jplStateKmKmPerSec.length !== 6 || !Array.isArray(row.cspiceStateKmKmPerSec) || row.cspiceStateKmKmPerSec.length !== 6) throw new Error(`sample schema mismatch at row ${rows}`); rows++ }
if (rows !== 150671) throw new Error(`expected 150671 sample rows, got ${rows}`)
const evidence = JSON.parse(await readFile(resolve('artifacts/de405-cross-platform-evidence/manifest.json'))); const expected = evidence.corpus.samples
const sampleSha = hash(sampleBytes); if (sampleSha !== expected.sha256 || sampleBytes.length !== expected.sizeBytes) throw new Error('sample does not match existing evidence identity')
const manifest = { schemaVersion: 1, recordType: 'de405-sample-release-asset', contents: [{ path: samplePath, bytes: sampleBytes.length, sha256: sampleSha, rowCount: rows, role: 'project-generated-sample-corpus' }], source: { generatedBy: 'project-owned DE405 residual sweep materialization', evidencePath: 'artifacts/de405-cross-platform-evidence/manifest.json', sourceSha256: sampleSha }, excluded: ['NAIF CSPICE source', 'DE405 SPK', 'prebuilt binaries', 'absolute paths', 'timestamps'], normalization: { entryOrder: 'lexicographic UTF-8 path order', timestamp: '1980-01-01T00:00:00Z', uid: 0, gid: 0, mode: '0644', lineEndings: 'LF' }, publicationVerdict: 'ready_for_sample_asset_publication_and_remote_dispatch' }
const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n'); await writeFile(join(stage, samplePath), sampleBytes); await writeFile(join(stage, 'sample-asset-manifest.json'), manifestBytes)
for (const path of [join(stage, samplePath), join(stage, 'sample-asset-manifest.json')]) { await chmod(path, 0o644); await utimes(path, fixed, fixed) }
execFileSync('zip', ['-X', '-D', '-0', '-q', archive, '-@'], { cwd: stage, input: [samplePath, 'sample-asset-manifest.json'].sort().join('\n') + '\n' })
const archiveBytes = await readFile(archive); const record = { schemaVersion: 1, archive: { path: archive, bytes: archiveBytes.length, sha256: hash(archiveBytes) }, manifestSha256: hash(manifestBytes), fileCount: 2, publicationVerdict: manifest.publicationVerdict }; await writeFile(join(output, 'sample-asset-record.json'), JSON.stringify(record, null, 2) + '\n'); console.log(JSON.stringify({ archive, record: join(output, 'sample-asset-record.json'), archiveBytes: archiveBytes.length, archiveSha256: record.archive.sha256, sampleSha256: sampleSha, rowCount: rows, fileCount: 2, publicationVerdict: record.publicationVerdict }, null, 2))
