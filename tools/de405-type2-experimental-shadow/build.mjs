import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const source = resolve(root, 'src/de405_type2_experimental_shadow.c')
const candidateSource = resolve(root, 'src/de405_type2_candidate.c')
const buildDir = resolve(process.env.DE405_SHADOW_BUILD_DIR || resolve(root, 'build'))
const binary = resolve(buildDir, 'de405-type2-experimental-shadow')
const strategy = process.env.DE405_TYPE2_STRATEGY || 'C'
if (!['A', 'B', 'C'].includes(strategy)) throw new Error(`unsupported DE405_TYPE2_STRATEGY: ${strategy}`)
await mkdir(dirname(binary), { recursive: true })
const compiler = process.env.CC || 'cc'
const productionFlags = process.env.DE405_SHADOW_PRODUCTION_FLAGS === '1' ? ['-O2'] : ['-O0', '-ffp-contract=off']
const baselineObject = resolve(buildDir, 'de405_type2_experimental_shadow.o')
const candidateObject = resolve(buildDir, 'de405_type2_candidate.o')
const baselineCompileFlags = ['-std=c11', ...productionFlags, '-Wall', '-Wextra', '-Werror', `-I${resolve(cspice, 'include')}`, '-c', source, '-o', baselineObject]
const strategyDefine = `-DDE405_TYPE2_STRATEGY_${strategy}`
const candidateControlFlags = strategy === 'C' ? ['-ffp-contract=off'] : []
const candidateCompileFlags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', strategyDefine, ...candidateControlFlags, `-I${resolve(cspice, 'include')}`, '-c', candidateSource, '-o', candidateObject]
const linkFlags = [baselineObject, candidateObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary]
execFileSync(compiler, baselineCompileFlags, { stdio: 'inherit' })
execFileSync(compiler, candidateCompileFlags, { stdio: 'inherit' })
execFileSync(compiler, linkFlags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
const fileIdentity = async (path, canonicalPath) => ({ path: canonicalPath, sizeBytes: (await stat(path)).size, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
const compilerVersion = execFileSync(compiler, ['--version'], { encoding: 'utf8' }).trim()
const architecture = execFileSync('uname', ['-m'], { encoding: 'utf8' }).trim()
const canonicalBaselineFlags = ['-std=c11', ...productionFlags, '-Wall', '-Wextra', '-Werror', '-I<CSPICE_N0067/include>', '-c', '<shadow-source>/de405_type2_experimental_shadow.c', '-o', '<build>/de405_type2_experimental_shadow.o']
const canonicalCandidateFlags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', strategyDefine, ...candidateControlFlags, '-I<CSPICE_N0067/include>', '-c', '<shadow-source>/de405_type2_candidate.c', '-o', '<build>/de405_type2_candidate.o']
const canonicalLinkFlags = ['<build>/de405_type2_experimental_shadow.o', '<build>/de405_type2_candidate.o', '<CSPICE_N0067/lib/cspice.a>', '<CSPICE_N0067/lib/csupport.a>', '-lm', '-o', '<build>/de405-type2-experimental-shadow']
await writeFile(resolve(buildDir, 'runner-build.json'), JSON.stringify({ schemaVersion: 3, recordType: 'de405_type2_experimental_shadow_build', strategy, compiler, compilerVersion, architecture, baselineCompileFlags: canonicalBaselineFlags, candidateCompileFlags: canonicalCandidateFlags, linkFlags: canonicalLinkFlags, binarySha256, cspiceToolkit: 'N0067', productionRouting: false, routeSelectionSharedByBaselineAndCandidate: true, candidateSubstitutionBoundary: 'type2_arithmetic_only', sourceIdentities: { baseline: await fileIdentity(source, 'tools/de405-type2-experimental-shadow/src/de405_type2_experimental_shadow.c'), candidate: await fileIdentity(candidateSource, 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c'), cspiceLibrary: await fileIdentity(resolve(cspice, 'lib/cspice.a'), 'external-cspice/N0067/lib/cspice.a'), csupportLibrary: await fileIdentity(resolve(cspice, 'lib/csupport.a'), 'external-cspice/N0067/lib/csupport.a') } }, null, 2) + '\n')
  console.log(JSON.stringify({ binary, binarySha256, strategy }, null, 2))
