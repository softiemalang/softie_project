import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

async function validateCspiceRoot(dir) {
  for (const relativePath of ['include/SpiceUsr.h', 'lib/cspice.a', 'lib/csupport.a']) {
    await stat(resolve(dir, relativePath))
  }
  return dir
}

async function resolveCspiceRoot(configuredDir) {
  try {
    return await validateCspiceRoot(configuredDir)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return validateCspiceRoot(resolve(configuredDir, 'N0067'))
  }
}

const configuredDir = process.env.CSPICE_DIR
if (!configuredDir) throw new Error('CSPICE_DIR is required')

const dir = await resolveCspiceRoot(configuredDir)
const include = resolve(dir, 'include')
const lib = resolve(dir, 'lib')
const source = resolve(root, 'src/de405_canonical_v2.c')
const out = resolve(root, 'build/de405-canonical-v2-runner')

await mkdir(dirname(out), { recursive: true })
const compiler = process.env.CC || 'cc'
const flags = [
  '-std=c11',
  '-O2',
  '-Wall',
  '-Wextra',
  '-Werror',
  `-I${include}`,
  source,
  `${lib}/cspice.a`,
  `${lib}/csupport.a`,
  '-lm',
  '-o',
  out
]

execFileSync(compiler, flags, { stdio: 'inherit' })
const hash = createHash('sha256').update(await readFile(out)).digest('hex')
await writeFile(resolve(root, 'build/runner-build.json'), JSON.stringify({
  toolkitVersion: 'N0067',
  compiler,
  buildFlags: flags,
  platform: process.platform,
  architecture: process.arch,
  binarySha256: hash
}, null, 2) + '\n')
console.log(JSON.stringify({ binary: out, binarySha256: hash }, null, 2))
