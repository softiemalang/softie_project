import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, stat, writeFile, cp } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
if (!args.cspice || !args.output) throw new Error('--cspice and --output are required')
const root = resolve(args.cspice)
const output = resolve(args.output)
const include = resolve(root, 'include')
const compiler = process.env.CC || 'gcc'
const sourceDirs = { cspice: resolve(root, 'src/cspice'), csupport: resolve(root, 'src/csupport') }
const flags = ['-std=c89', '-O2', '-ffp-contract=off', '-fno-fast-math', '-fPIC', '-DNON_UNIX_STDIO', '-Wno-shift-op-parentheses', '-Wno-logical-op-parentheses', '-Wno-parentheses', '-I<CSPICE_N0067/include>', '-I<CSPICE_N0067/src/cspice>', '-I<CSPICE_N0067/src/csupport>']
const declaredFlags = (process.env.DE405_CSPICE_CFLAGS || '').split(/\s+/).filter(Boolean)
const requiredDeclaredFlags = ['-std=c89', '-O2', '-ffp-contract=off', '-fno-fast-math', '-fPIC', '-DNON_UNIX_STDIO']
if (declaredFlags.length && requiredDeclaredFlags.some(flag => !declaredFlags.includes(flag))) throw new Error(`DE405_CSPICE_CFLAGS must include: ${requiredDeclaredFlags.join(' ')}`)
for (const file of [include, sourceDirs.cspice, sourceDirs.csupport]) await stat(file)
const sourceHash = async file => { const hash = createHash('sha256'); hash.update(await readFile(file)); return hash.digest('hex') }
async function cFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }); const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) { const file = resolve(dir, entry.name); if (entry.isDirectory()) files.push(...await cFiles(file)); else if (entry.isFile() && entry.name.endsWith('.c')) files.push(file) }
  return files
}
const sources = {}
for (const [kind, dir] of Object.entries(sourceDirs)) for (const file of await cFiles(dir)) sources[`${kind}/${relative(dir, file)}`] = { sha256: await sourceHash(file), bytes: (await stat(file)).size }
const sourceManifest = { schemaVersion: 1, toolkitVersion: 'N0067', files: Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b))) }
const sourceManifestText = JSON.stringify(sourceManifest, null, 2) + '\n'
const sourceManifestSha256 = createHash('sha256').update(sourceManifestText).digest('hex')
await mkdir(output, { recursive: true }); await cp(include, resolve(output, 'include'), { recursive: true }); await writeFile(resolve(output, 'source-manifest.json'), sourceManifestText)
const buildDir = resolve(output, 'build'); await mkdir(buildDir, { recursive: true })
const objects = {}
for (const [kind, dir] of Object.entries(sourceDirs)) {
  const objectDir = resolve(buildDir, kind); await mkdir(objectDir, { recursive: true }); const files = (await cFiles(dir))
  objects[kind] = []
  for (let index = 0; index < files.length; index++) {
    const object = resolve(objectDir, `${String(index).padStart(5, '0')}.o`)
    execFileSync(compiler, [ ...requiredDeclaredFlags, '-Wno-shift-op-parentheses', '-Wno-logical-op-parentheses', '-Wno-parentheses', `-I${include}`, `-I${sourceDirs.cspice}`, `-I${sourceDirs.csupport}`, '-c', files[index], '-o', object ], { stdio: 'inherit' })
    objects[kind].push(object)
  }
}
const libDir = resolve(output, 'lib'); await mkdir(libDir, { recursive: true })
let arHelp = ''
try { arHelp = execFileSync('ar', ['--help'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (error) { arHelp = `${error.stdout || ''}\n${error.stderr || ''}` }
const archiveFlags = arHelp.includes('deterministic') ? ['rcsD'] : ['rcs']
for (const kind of Object.keys(sourceDirs)) execFileSync('ar', [...archiveFlags, resolve(libDir, `${kind}.a`), ...objects[kind]], { stdio: 'inherit' })
const build = { schemaVersion: 1, recordType: 'de405_linux_cspice_source_build', toolkitVersion: 'N0067', compiler, compilerVersion: execFileSync(compiler, ['--version'], { encoding: 'utf8' }).split('\n')[0], compilerTarget: execFileSync(compiler, ['-dumpmachine'], { encoding: 'utf8' }).trim(), architecture: process.arch, flags, archiveTool: { command: 'ar', flags: archiveFlags }, sourceManifestSha256, sourceFileCount: Object.keys(sources).length, libraries: { cspice: { path: 'lib/cspice.a', sha256: await sourceHash(resolve(libDir, 'cspice.a')) }, csupport: { path: 'lib/csupport.a', sha256: await sourceHash(resolve(libDir, 'csupport.a')) } } }
await writeFile(resolve(output, 'build-provenance.json'), JSON.stringify(build, null, 2) + '\n')
