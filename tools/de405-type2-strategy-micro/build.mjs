import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const strategy = process.env.DE405_TYPE2_STRATEGY || 'C'
if (!['A', 'B', 'C'].includes(strategy)) throw new Error(`unsupported strategy: ${strategy}`)
const buildDir = resolve(process.env.DE405_TYPE2_MICRO_BUILD_DIR || resolve(root, 'build'))
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const compiler = process.env.CC || 'cc'
const main = resolve(root, 'src/de405_type2_strategy_micro.c')
const candidate = resolve(root, '../de405-type2-experimental-shadow/src/de405_type2_candidate.c')
const mainObject = resolve(buildDir, 'de405_type2_strategy_micro.o')
const candidateObject = resolve(buildDir, 'de405_type2_candidate.o')
const binary = resolve(buildDir, 'de405-type2-strategy-micro')
await mkdir(buildDir, { recursive: true })
const define = `-DDE405_TYPE2_STRATEGY_${strategy}`
const candidateControl = strategy === 'C' ? ['-ffp-contract=off'] : []
const common = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', `-I${resolve(cspice, 'include')}`]
const mainFlags = [...common, '-c', main, '-o', mainObject]
const candidateFlags = [...common, define, ...candidateControl, '-c', candidate, '-o', candidateObject]
const linkFlags = [mainObject, candidateObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary]
execFileSync(compiler, mainFlags, { stdio: 'inherit' })
execFileSync(compiler, candidateFlags, { stdio: 'inherit' })
execFileSync(compiler, linkFlags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
await writeFile(resolve(buildDir, 'runner-build.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_type2_strategy_micro_build', strategy, compiler, flags: { main: mainFlags, candidate: candidateFlags, link: linkFlags }, binarySha256, productionRouting: false }, null, 2) + '\n')
console.log(JSON.stringify({ binary, strategy, binarySha256 }, null, 2))
