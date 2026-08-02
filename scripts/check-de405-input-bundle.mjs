import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
for (const key of ['archive']) if (!args[key]) throw new Error(`--${key} is required`)
const archive = resolve(args.archive); const bytes = await readFile(archive); const sha = createHash('sha256').update(bytes).digest('hex')
if (args.record) { const record = JSON.parse(await readFile(resolve(args.record))); if (sha !== record.archive.sha256 || bytes.length !== record.archive.bytes) throw new Error('archive record mismatch') }
const names = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n').filter(Boolean); const expectedNames = ['de405-jpl-cspice-residual-sweep.samples.jsonl', 'sample-asset-manifest.json']
if (JSON.stringify(names) !== JSON.stringify(expectedNames)) throw new Error(`sample-only archive structure mismatch: ${names.join(',')}`)
if (names.some(name => name.startsWith('/') || name.includes('..') || name.endsWith('/') || /(^|\/)(cspice|spk|lib|bin|build|\.git)(\/|$)/.test(name))) throw new Error('archive contains forbidden path')
const readEntry = name => execFileSync('unzip', ['-p', archive, name], { maxBuffer: 400 * 1024 * 1024 }); const manifest = JSON.parse(readEntry('sample-asset-manifest.json'));
if (manifest.publicationVerdict !== 'ready_for_sample_asset_publication_and_remote_dispatch' || manifest.contents.length !== 1 || manifest.contents[0].path !== expectedNames[0]) throw new Error('sample publication manifest contract failed')
const sample = readEntry(expectedNames[0]); const item = manifest.contents[0]; const sampleSha = createHash('sha256').update(sample).digest('hex'); if (sampleSha !== item.sha256 || sample.length !== item.bytes || item.rowCount !== 150671 || sample.includes(13)) throw new Error('sample identity/schema normalization failed')
if (!sample.toString('utf8').endsWith('\n')) throw new Error('sample missing final LF')
for (const line of sample.toString('utf8').trimEnd().split('\n')) { const row = JSON.parse(line); if (row.schemaVersion !== 1 || row.recordType !== 'de405_spk_type2_sweep_sample' || typeof row.sampleId !== 'string' || !Array.isArray(row.jplStateKmKmPerSec) || row.jplStateKmKmPerSec.length !== 6 || !Array.isArray(row.cspiceStateKmKmPerSec) || row.cspiceStateKmKmPerSec.length !== 6) throw new Error('sample row schema mismatch') }
const evidence = JSON.parse(await readFile(resolve('artifacts/de405-cross-platform-evidence/manifest.json'))); if (evidence.corpus.samples.sha256 !== sampleSha || evidence.corpus.samples.sizeBytes !== sample.length) throw new Error('sample does not reconcile to existing evidence')
console.log(JSON.stringify({ status: 'pass', structure: 'sample_only', hashes: 'pass', rowCount: item.rowCount, archiveBytes: bytes.length, archiveSha256: sha, fileCount: names.length, licenseBoundary: 'NAIF CSPICE/SPK are not in asset; acquired directly per job' }, null, 2))
