import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outputDir = resolve(process.env.DE405_CONTROLLED_MATRIX_OUTPUT_DIR || '/private/tmp/de405-controlled-build-matrix')
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const spk = resolve(process.env.DE405_SPK || '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp')
const input = resolve(process.env.DE405_CONTROLLED_MATRIX_INPUT || 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const compiler = process.env.CC || 'cc'
const integrationSource = resolve(root, 'tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c')
const candidateSource = resolve(root, 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c')
const hashFile = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex') }
const identity = async (path, label) => ({ path: label, sizeBytes: (await stat(path)).size, sha256: await hashFile(path) })
const variants = [
  { id: 'apple-clang-o0-contract-off', optimization: '-O0', fpContraction: '-ffp-contract=off' },
  { id: 'apple-clang-o2-contract-off', optimization: '-O2', fpContraction: '-ffp-contract=off' },
  { id: 'apple-clang-o2-contract-fast', optimization: '-O2', fpContraction: '-ffp-contract=fast', fastMath: false },
  { id: 'apple-clang-o2-fast-math', optimization: '-O2', fpContraction: '-ffp-contract=fast', fastMath: true }
]
const common = ['-std=c11', '-Wall', '-Wextra', '-Werror', '-DDE405_TYPE2_STRATEGY_C', `-I${resolve(cspice, 'include')}`]
await mkdir(outputDir, { recursive: true })
const sourceIdentities = { integration: await identity(integrationSource, 'tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c'), candidate: await identity(candidateSource, 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c'), corpus: await identity(input, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'), kernel: await identity(spk, 'external-kernel/de405.bsp'), cspiceArchive: await identity(resolve(cspice, 'lib/cspice.a'), 'external-cspice/N0067/lib/cspice.a'), csupportArchive: await identity(resolve(cspice, 'lib/csupport.a'), 'external-cspice/N0067/lib/csupport.a') }
const compilerVersion = execFileSync(compiler, ['--version'], { encoding: 'utf8' }).trim().split('\n').slice(0, 4)
const results = []
for (const variant of variants) {
  const buildDir = resolve(outputDir, 'build', variant.id)
  await mkdir(buildDir, { recursive: true })
  const flags = [...common, variant.optimization, variant.fpContraction, ...(variant.fastMath ? ['-ffast-math', '-Wno-nan-infinity-disabled'] : [])]
  const integrationObject = resolve(buildDir, 'integration.o'); const candidateObject = resolve(buildDir, 'candidate.o'); const binary = resolve(buildDir, 'runner')
  execFileSync(compiler, [...flags, '-c', integrationSource, '-o', integrationObject], { cwd: root, stdio: 'inherit' })
  execFileSync(compiler, [...flags, '-c', candidateSource, '-o', candidateObject], { cwd: root, stdio: 'inherit' })
  execFileSync(compiler, [integrationObject, candidateObject, resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', binary], { cwd: root, stdio: 'inherit' })
  const output = resolve(outputDir, `${variant.id}.jsonl`)
  execFileSync(binary, ['--evaluate-spk-type2-batch', '--spk', spk, '--input-jsonl', input, '--output-jsonl', output], { cwd: root, stdio: 'inherit' })
  results.push({ id: variant.id, status: 'executed', target: `${process.arch}-${process.platform}`, compiler: { command: compiler, version: compilerVersion }, flags, binary: await identity(binary, `matrix/${variant.id}/runner`), output: await identity(output, `${variant.id}.jsonl`) })
}
const manifest = { schemaVersion: 1, recordType: 'de405_controlled_build_matrix', status: 'completed', baselineHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), host: { platform: process.platform, architecture: process.arch, osIdentity: `${process.platform}-${process.arch}`, locale: process.env.LC_ALL || process.env.LANG || 'inherited', executionOrder: 'variant declaration order; one process per variant' }, compilerFamilyControl: 'same compiler command and version for all variants', axes: ['optimization', 'fp_contraction', 'fast_math'], fixed: ['source', 'input corpus', 'CSPICE N0067', 'DE405 kernel', 'host OS', 'CPU architecture', 'wrapper', 'JSONL serialization', 'locale', 'execution order'], sourceIdentities, variants: results.map(result => ({ ...result, flags: result.flags.map(flag => flag === `-I${resolve(cspice, 'include')}` ? '-I<CSPICE_N0067>/include' : flag) })), expectedClassification: 'compiler_effect_not_observed_os_architecture_remains', caveats: ['No alternate compiler family is installed; compiler-family sensitivity is not tested.', 'OS and architecture remain fixed to Apple arm64 and are not separated by this matrix.', 'This is shadow-only evidence; production routing and tolerances are unchanged.'] }
await writeFile(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ outputDir, variantCount: results.length, manifest: resolve(outputDir, 'manifest.json') }, null, 2))
