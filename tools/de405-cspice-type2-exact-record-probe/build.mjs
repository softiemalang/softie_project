import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
async function valid(dir) {
  for (const relativePath of ['include/SpiceUsr.h', 'lib/cspice.a', 'lib/csupport.a']) await stat(resolve(dir, relativePath))
  return dir
}
const configured = process.env.CSPICE_DIR
if (!configured) throw new Error('CSPICE_DIR is required')
let cspice
try { cspice = await valid(configured) } catch (error) {
  if (error.code !== 'ENOENT') throw error
  cspice = await valid(resolve(configured, 'N0067'))
}
const out = resolve(root, 'build/de405-cspice-type2-exact-record-probe')
await mkdir(dirname(out), { recursive: true })
const compiler = process.env.CC || 'cc'
const source = resolve(root, 'src/de405_cspice_type2_exact_record_probe.c')
const flags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', `-I${resolve(cspice, 'include')}`, source, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', out]
execFileSync(compiler, flags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(out)).digest('hex')
await writeFile(resolve(root, 'build/runner-build.json'), JSON.stringify({ toolkitVersion: 'N0067', compiler, buildFlags: flags, platform: process.platform, architecture: process.arch, binarySha256 }, null, 2) + '\n')
console.log(JSON.stringify({ binary: out, binarySha256 }, null, 2))
