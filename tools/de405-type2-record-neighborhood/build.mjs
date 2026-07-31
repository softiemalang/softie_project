import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(root, '../..')
const args = process.argv.slice(2)
const requestedOutput = args[args.indexOf('--output') + 1]
const output = resolve(requestedOutput || '/tmp/de405-type2-record-neighborhood')

async function valid(directory) {
  for (const path of ['include/SpiceUsr.h', 'lib/cspice.a', 'lib/csupport.a']) await stat(resolve(directory, path))
  return directory
}

async function cspiceRoot() {
  if (process.env.CSPICE_DIR) {
    try { return await valid(process.env.CSPICE_DIR) } catch (error) { if (error.code !== 'ENOENT') throw error }
    return valid(resolve(process.env.CSPICE_DIR, 'N0067'))
  }
  const build = JSON.parse(await readFile(resolve(projectRoot, 'tools/de405-spk-record-probe/build/runner-build.json'), 'utf8'))
  const include = build.buildFlags.find(flag => flag.startsWith('-I'))?.slice(2)
  if (!include) throw new Error('CSPICE_DIR is required when the existing runner build does not expose an include path')
  return valid(resolve(include, '..'))
}

const cspice = await cspiceRoot()
await mkdir(dirname(output), { recursive: true })
const compiler = process.env.CC || 'cc'
const flags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', `-I${resolve(cspice, 'include')}`, resolve(root, 'src/de405_type2_record_neighborhood.c'), resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', output]
execFileSync(compiler, flags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(output)).digest('hex')
console.log(JSON.stringify({ binary: output, binarySha256, toolkitVersion: 'N0067', compiler, buildFlags: flags, platform: process.platform, architecture: process.arch }, null, 2))
