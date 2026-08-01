import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const source = resolve(root, 'src/de405_type2_experimental_shadow.c')
const binary = resolve(root, 'build/de405-type2-experimental-shadow')
await mkdir(dirname(binary), { recursive: true })
const compiler = process.env.CC || 'cc'
const flags = ['-std=c11', '-O0', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off', `-I${resolve(cspice, 'include')}`, source, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary]
execFileSync(compiler, flags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
await writeFile(resolve(root, 'build/runner-build.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_type2_experimental_shadow_build', compiler, flags, binarySha256, cspiceToolkit: 'N0067', productionRouting: false }, null, 2) + '\n')
console.log(JSON.stringify({ binary, binarySha256 }, null, 2))
