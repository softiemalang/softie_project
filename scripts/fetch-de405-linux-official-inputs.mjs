import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { chmod, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
const contracts = {
  cspiceUrl: 'https://naif.jpl.nasa.gov/pub/naif/toolkit//C/PC_Linux_GCC_64bit/packages/cspice.tar.Z',
  spkUrl: 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp',
  cspiceArchiveSha256: '60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce',
  spkSha256: '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89',
  maxCspiceBytes: 200_000_000,
  maxSpkBytes: 50_000_000
}
const output = resolve(args.output || join(process.env.RUNNER_TEMP || '/tmp', 'de405-official-inputs'))
const temp = resolve(args.temp || join(dirname(output), '.de405-official-download'))
const hashFile = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const hostAllowed = url => new URL(url).protocol === 'https:' && new URL(url).hostname === 'naif.jpl.nasa.gov'
async function download(url, target, expected, maxBytes) {
  if (!hostAllowed(url)) throw new Error(`URL host/protocol is not allowlisted: ${url}`)
  const response = await fetch(url, { redirect: 'manual' })
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location'); if (!location || !hostAllowed(new URL(location, url).href)) throw new Error('redirect target is not allowlisted')
    return download(new URL(location, url).href, target, expected, maxBytes)
  }
  if (!response.ok || !response.body) throw new Error(`download failed: ${response.status} ${url}`)
  const length = Number(response.headers.get('content-length') || 0); if (length > maxBytes) throw new Error(`download exceeds size limit: ${length}`)
  await mkdir(dirname(target), { recursive: true }); const stream = createWriteStream(target); let bytes = 0
  const limited = response.body.pipeThrough(new TransformStream({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > maxBytes) throw new Error('download exceeds size limit'); controller.enqueue(chunk) } }))
  await pipeline(limited, stream); const actual = await hashFile(target)
  if (actual !== expected) throw new Error(`official hash mismatch for ${url}: ${actual} != ${expected}`)
  return { url, bytes, sha256: actual }
}
async function filesUnder(root) {
  const out = []; async function visit(dir) { for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const path = join(dir, e.name); if (e.isDirectory()) await visit(path); else if (e.isFile()) out.push(path); else throw new Error(`unsupported extracted entry: ${path}`) } }
  await visit(root); return out
}
await rm(temp, { recursive: true, force: true }); await mkdir(temp, { recursive: true }); await mkdir(output, { recursive: true })
const cspiceArchive = resolve(temp, 'cspice.tar.Z'); const spk = resolve(output, 'de405.bsp')
async function verifiedLocal(source, target, expected, label) { const bytes = await readFile(resolve(source)); if (bytes.length > contracts.maxCspiceBytes) throw new Error(`${label} exceeds size limit`); const sha256 = createHash('sha256').update(bytes).digest('hex'); if (sha256 !== expected) throw new Error(`official hash mismatch for ${label}: ${sha256} != ${expected}`); await writeFile(target, bytes); return { url: `local-test-input:${source}`, bytes: bytes.length, sha256 } }
const cspice = args['cspice-archive'] ? await verifiedLocal(args['cspice-archive'], cspiceArchive, args['cspice-sha256'] || contracts.cspiceArchiveSha256, 'CSPICE archive') : await download(args['cspice-url'] || contracts.cspiceUrl, cspiceArchive, args['cspice-sha256'] || contracts.cspiceArchiveSha256, contracts.maxCspiceBytes)
const spkId = args['spk-file'] ? await verifiedLocal(args['spk-file'], spk, args['spk-sha256'] || contracts.spkSha256, 'DE405 SPK') : await download(args['spk-url'] || contracts.spkUrl, spk, args['spk-sha256'] || contracts.spkSha256, contracts.maxSpkBytes)
await exec('uncompress', ['-f', cspiceArchive]); await exec('tar', ['-xf', resolve(temp, 'cspice.tar'), '-C', temp])
const extracted = resolve(temp, 'cspice'); const cspiceOut = resolve(output, 'cspice/N0067'); await mkdir(cspiceOut, { recursive: true })
for (const section of ['include', 'src/cspice', 'src/csupport']) { const source = resolve(extracted, section); const target = resolve(cspiceOut, section); await stat(source); await mkdir(target, { recursive: true }); await exec('cp', ['-R', `${source}/.`, target]) }
const sourceFiles = []
for (const section of ['include', 'src/cspice', 'src/csupport']) for (const path of await filesUnder(resolve(cspiceOut, section))) sourceFiles.push({ path: relative(cspiceOut, path).split('\\').join('/'), bytes: (await stat(path)).size, sha256: await hashFile(path) })
sourceFiles.sort((a, b) => a.path.localeCompare(b.path)); const sourceManifest = { schemaVersion: 1, recordType: 'cspice-n0067-source-manifest', toolkitVersion: 'N0067', acquisition: { url: cspice.url, archiveBytes: cspice.bytes, archiveSha256: cspice.sha256, sourcePort: 'arm64 is a project source port; NAIF package target is PC/Linux/GCC/64-bit' }, files: sourceFiles }
const sourceManifestText = JSON.stringify(sourceManifest, null, 2) + '\n'; await writeFile(resolve(cspiceOut, 'source-manifest.json'), sourceManifestText); await chmod(resolve(cspiceOut, 'source-manifest.json'), 0o644)
const provenance = { schemaVersion: 1, recordType: 'de405-official-input-acquisition', contracts, cspice, spk: spkId, inputs: { spkPath: 'de405.bsp', cspicePath: 'cspice/N0067', sourceManifestSha256: createHash('sha256').update(sourceManifestText).digest('hex'), sourceFileCount: sourceFiles.length }, redistribution: { cspice: 'not redistributed; source is acquired per job', spk: 'not redistributed; source is acquired per job' } }
await writeFile(resolve(output, 'acquisition-provenance.json'), JSON.stringify(provenance, null, 2) + '\n')
console.log(JSON.stringify({ output, cspice, spk: spkId, sourceManifestSha256: provenance.inputs.sourceManifestSha256, sourceFileCount: sourceFiles.length }, null, 2))
