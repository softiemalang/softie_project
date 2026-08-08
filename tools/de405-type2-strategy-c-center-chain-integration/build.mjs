import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const project = resolve(root, '../..')
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const source = resolve(root, 'src/de405_strategy_c_center_chain_integration.c')
const build = resolve(root, 'build')
const binary = resolve(build, 'de405-type2-strategy-c-center-chain-integration')
await mkdir(build, { recursive: true })
const flags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off', `-I${resolve(cspice, 'include')}`, source, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary]
execFileSync(process.env.CC || 'cc', flags, { cwd: project, stdio: 'inherit' })
const sha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
await writeFile(resolve(build, 'runner-build.json'), JSON.stringify({ schemaVersion: 1, toolkitVersion: 'N0067', compiler: execFileSync(process.env.CC || 'cc', ['--version'], { encoding: 'utf8' }).split('\n')[0], flags: ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off', '-I<CSPICE_N0067/include>', '<source>', '<CSPICE_N0067/lib/cspice.a>', '<CSPICE_N0067/lib/csupport.a>', '-lm'], source: { path: 'src/de405_strategy_c_center_chain_integration.c', sha256: createHash('sha256').update(await readFile(source)).digest('hex') }, binary: { path: 'build/de405-type2-strategy-c-center-chain-integration', sha256 } }, null, 2) + '\n')
console.log(JSON.stringify({ binary, sha256 }, null, 2))
