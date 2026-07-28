import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const home = process.env.SOFTIE_DE405_HOME ?? resolve(process.env.HOME, '.local/share/softie-de405')
const cspiceDir = process.env.CSPICE_DIR ?? resolve(home, 'cspice/N0067')
const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, 'src/resolve_de405_boundaries.c')
const binary = resolve(home, 'boundary-resolution/bin/resolve-de405-boundaries')
const provenance = resolve(home, 'boundary-resolution/provenance/boundary-resolver-build.json')
const include = resolve(cspiceDir, 'include')
const lib = resolve(cspiceDir, 'lib')
const compiler = execFileSync('xcrun', ['--find', 'clang'], { encoding: 'utf8' }).trim()
const compilerVersion = execFileSync(compiler, ['--version'], { encoding: 'utf8' }).split('\n')[0]
const sdkPath = execFileSync('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], { encoding: 'utf8' }).trim()
const flags = ['-isysroot', sdkPath, '-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', `-I${include}`, source, `${lib}/cspice.a`, `${lib}/csupport.a`, '-lm', '-o', binary]

const sha256 = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const required = [resolve(cspiceDir, 'N0067'), resolve(include, 'SpiceUsr.h'), resolve(lib, 'cspice.a'), resolve(lib, 'csupport.a')]
for (const path of required) await stat(path)
await mkdir(dirname(binary), { recursive: true })
execFileSync(compiler, flags, { stdio: 'inherit' })
const metadata = {
  toolkitVersion: 'N0067',
  cspiceArchiveSha256: process.env.CSPICE_ARCHIVE_SHA256 ?? null,
  compilerPath: compiler,
  compilerVersion,
  buildFlags: flags,
  platform: process.platform,
  architecture: process.arch,
  sourceFileSha256: await sha256(source),
  binarySha256: await sha256(binary),
  builtAt: new Date().toISOString()
}
await writeFile(provenance, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ binary, provenance, ...metadata }, null, 2))
