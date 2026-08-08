import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(root, '../..')
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const compiler = process.env.CC || 'cc'
const buildDir = resolve(process.env.DE405_STRATEGY_C_BUILD_DIR || resolve(root, 'build'))
const source = resolve(root, 'src/de405_type2_strategy_c_integration.c')
const candidate = resolve(projectRoot, 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c')
const object = resolve(buildDir, 'de405_type2_strategy_c_integration.o')
const candidateObject = resolve(buildDir, 'de405_type2_candidate.o')
const binary = resolve(buildDir, 'de405-type2-strategy-c-integration')
const common = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-DDE405_TYPE2_STRATEGY_C', `-I${resolve(cspice, 'include')}`]
const integrationFlags = [...common, '-c', source, '-o', object]
const candidateFlags = [...common, '-ffp-contract=off', '-c', candidate, '-o', candidateObject]
const linkFlags = [object, candidateObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary]
await mkdir(buildDir, { recursive: true })
execFileSync(compiler, integrationFlags, { cwd: projectRoot, stdio: 'inherit' })
execFileSync(compiler, candidateFlags, { cwd: projectRoot, stdio: 'inherit' })
execFileSync(compiler, linkFlags, { cwd: projectRoot, stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
const manifest = { schemaVersion: 1, recordType: 'de405_type2_strategy_c_integration_build', strategy: 'C', compiler, platform: process.platform, architecture: process.arch, flags: { integration: integrationFlags, candidate: candidateFlags, link: linkFlags }, sourceBoundary: { canonicalSource: 'tools/de405-cspice-runner/src/de405_canonical_v2.c', adapterSource: 'tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c', candidateSource: 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c', seam: 'evaluate_record:chbint_c_only' }, productionRouting: false, binarySha256 }
await writeFile(resolve(buildDir, 'runner-build.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ binary, binarySha256 }, null, 2))
