import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { instrument } from './scripts/instrument-spke02.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(root, '../..')
const configured = process.env.CSPICE_DIR
if (!configured) throw new Error('CSPICE_DIR is required')

async function valid(directory) {
  for (const path of ['include/SpiceUsr.h', 'include/f2c.h', 'lib/cspice.a', 'lib/csupport.a', 'src/cspice/spke02.c', 'src/cspice/chbint.c']) await stat(resolve(directory, path))
  return directory
}

let cspice
try { cspice = await valid(configured) } catch (error) {
  if (error.code !== 'ENOENT') throw error
  cspice = await valid(resolve(configured, 'N0067'))
}

const buildDir = resolve(root, 'build')
const instrumentedDir = resolve(buildDir, 'instrumented-source')
const identity = await instrument({ cspiceRoot: cspice, outputDir: instrumentedDir })
const output = resolve(buildDir, 'de405-type2-evaluator-trace-probe')
await mkdir(buildDir, { recursive: true })
const compiler = process.env.CC || 'cc'
const source = resolve(root, 'src/de405_type2_evaluator_trace_probe.c')
const include = `-I${resolve(cspice, 'include')}`
const commonFlags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', include]
const wrapperObject = resolve(buildDir, 'trace-probe.o'), spke02Object = resolve(buildDir, 'spke02.instrumented.o'), chbintObject = resolve(buildDir, 'chbint.instrumented.o')
execFileSync(compiler, [...commonFlags, '-c', source, '-o', wrapperObject], { stdio: 'inherit' })
execFileSync(compiler, [...commonFlags, '-ffp-contract=off', '-c', identity.instrumentedPaths.spke02, '-o', spke02Object], { stdio: 'inherit' })
execFileSync(compiler, [...commonFlags, '-ffp-contract=off', '-c', identity.instrumentedPaths.chbint, '-o', chbintObject], { stdio: 'inherit' })
const flags = { wrapper: [...commonFlags, '-c', source, '-o', wrapperObject], instrumentedOfficial: [...commonFlags, '-ffp-contract=off', '-c', identity.instrumentedPaths.spke02, '-o', spke02Object], instrumentedDependency: [...commonFlags, '-ffp-contract=off', '-c', identity.instrumentedPaths.chbint, '-o', chbintObject], link: [wrapperObject, spke02Object, chbintObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', output] }
execFileSync(compiler, [wrapperObject, spke02Object, chbintObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', output], { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(output)).digest('hex')
await writeFile(resolve(buildDir, 'runner-build.json'), JSON.stringify({ schemaVersion: 1, toolkitVersion: 'N0067', compiler, buildFlags: flags, sourceIdentity: identity, binarySha256 }, null, 2) + '\n')
console.log(JSON.stringify({ binary: output, binarySha256 }, null, 2))
