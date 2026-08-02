import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, open, readFile, stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { assertRuntimeProvenance } from './lib/de405-runtime-provenance.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
const root = resolve(new URL('..', import.meta.url).pathname)
const required = ['samples', 'spk', 'cspice', 'acquisition-provenance', 'output', 'arch', 'runner']
for (const key of required) if (!args[key]) throw new Error(`--${key} is required`)
const expectedHead = process.env.DE405_EXPECTED_HEAD || process.env.GITHUB_SHA
const head = args['runtime-head'] || process.env.DE405_RUNTIME_HEAD || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const githubSha = process.env.GITHUB_SHA || expectedHead
assertRuntimeProvenance({ head, githubSha, githubRef: process.env.GITHUB_REF, expectedHead })
const source = resolve(root, 'tools/de405-cspice-runner/src/de405_canonical_v2.c')
const configuredCspice = resolve(args.cspice)
let cspice = configuredCspice
try { await stat(resolve(configuredCspice, 'include/SpiceUsr.h')) } catch (error) { if (error.code !== 'ENOENT') throw error; cspice = resolve(configuredCspice, 'N0067') }
const include = resolve(cspice, 'include')
const lib = resolve(cspice, 'lib')
for (const file of [args.samples, args.spk, resolve(cspice, 'include/SpiceUsr.h'), resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a')]) await stat(file)
await mkdir(args.output, { recursive: true })
const build = resolve(process.env.RUNNER_TEMP || '/tmp', `de405-linux-${args.arch}`)
await mkdir(build, { recursive: true })
const compiler = process.env.CC || 'gcc'
if (process.env.DE405_EXPECTED_COMPILER && compiler !== process.env.DE405_EXPECTED_COMPILER) throw new Error(`unexpected compiler: ${compiler}`)
const flags = ['-std=c11', '-O2', '-ffp-contract=off', '-fno-fast-math', '-Wall', '-Wextra', '-Werror', '-I<CSPICE_N0067/include>']
const declaredFlags = (process.env.DE405_CFLAGS || '').split(/\s+/).filter(Boolean)
const requiredDeclaredFlags = ['-std=c11', '-O2', '-ffp-contract=off', '-fno-fast-math', '-Wall', '-Wextra', '-Werror']
if (declaredFlags.length && requiredDeclaredFlags.some(flag => !declaredFlags.includes(flag))) throw new Error(`DE405_CFLAGS must include: ${requiredDeclaredFlags.join(' ')}`)
const actualFlags = ['-std=c11', '-O2', '-ffp-contract=off', '-fno-fast-math', '-Wall', '-Wextra', '-Werror', `-I${include}`]
const buildProvenancePath = resolve(cspice, 'build-provenance.json')
await stat(buildProvenancePath)
const cspiceBuild = JSON.parse(await readFile(buildProvenancePath, 'utf8'))
if (cspiceBuild.compiler !== compiler) throw new Error(`CSPICE compiler ${cspiceBuild.compiler} does not match runner compiler ${compiler}`)
const acquisitionProvenance = JSON.parse(await readFile(resolve(args['acquisition-provenance']), 'utf8'))
const binary = resolve(build, 'de405-canonical-v2-runner')
execFileSync(compiler, [...actualFlags, source, `${lib}/cspice.a`, `${lib}/csupport.a`, '-lm', '-o', binary], { stdio: 'inherit' })
execFileSync(binary, ['--evaluate-spk-type2-batch', '--spk', args.spk, '--input-jsonl', args.samples, '--output-jsonl', resolve(args.output, 'result.jsonl')], { stdio: 'inherit' })

const sha256 = async file => { const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest('hex') }
const countRows = async file => { let count = 0; const input = createInterface({ input: createReadStream(file), crlfDelay: Infinity }); for await (const line of input) { if (line.includes('\r')) throw new Error('CRLF is not allowed'); JSON.parse(line); count++ } const info = await stat(file); const handle = await open(file, 'r'); const last = Buffer.alloc(1); await handle.read(last, 0, 1, info.size - 1); await handle.close(); if (last[0] !== 10) throw new Error('result must end with LF'); return count }
const files = { runnerSource: source, samples: args.samples, spk: args.spk, cspiceHeader: resolve(cspice, 'include/SpiceUsr.h'), cspiceSourceManifest: resolve(cspice, 'source-manifest.json') }
const artifactFiles = { cspiceLibrary: resolve(cspice, 'lib/cspice.a'), csupportLibrary: resolve(cspice, 'lib/csupport.a') }
const hashes = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await sha256(file)])))
const artifactHashes = Object.fromEntries(await Promise.all(Object.entries(artifactFiles).map(async ([key, file]) => [key, await sha256(file)])))
const result = resolve(args.output, 'result.jsonl')
const resultBytes = (await stat(result)).size
const resultHash = await sha256(result)
let osRelease = 'unavailable'
try { osRelease = execFileSync('sh', ['-c', '. /etc/os-release && printf "%s" "$PRETTY_NAME"'], { encoding: 'utf8' }) } catch { /* non-Linux local smoke */ }
const commandOutput = (command, commandArgs = []) => { const result = spawnSync(command, commandArgs, { encoding: 'utf8' }); return { exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' } }
let libc = 'unavailable'
const ldd = commandOutput('ldd', ['--version'])
if (ldd.stdout || ldd.stderr) libc = (ldd.stdout || ldd.stderr).split('\n').find(Boolean) || 'unavailable'
const packageInfoPath = process.env.DE405_PACKAGE_INFO_FILE
const toolBinarySha256Path = process.env.DE405_TOOL_BINARY_SHA256_FILE
const toolchainLockPath = process.env.DE405_TOOLCHAIN_LOCK_FILE
const toolchain = toolchainLockPath ? JSON.parse(await readFile(resolve(toolchainLockPath), 'utf8')) : null
const packageInfo = packageInfoPath ? (await readFile(resolve(packageInfoPath), 'utf8')).trim().split('\n').filter(Boolean) : toolchain?.packageInfo || []
const toolBinarySha256 = toolBinarySha256Path ? (await readFile(resolve(toolBinarySha256Path), 'utf8')).trim().split('\n').filter(Boolean) : Object.entries(toolchain?.binarySha256 || {}).map(([name, hash]) => `${name} ${hash}`)
const optionalIdentity = name => { const result = commandOutput(name, ['--version']); return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr } }
const binutils = optionalIdentity('ld')
const linker = optionalIdentity('ld')
const ar = optionalIdentity('ar')
const provenance = {
  schemaVersion: 1, evidenceKind: 'de405-linux-architecture', fixture: false,
  expectedHead: head, githubSha, githubRef: process.env.GITHUB_REF, workflowIdentity: args['workflow-identity'] || process.env.DE405_WORKFLOW_IDENTITY || '.github/workflows/de405-linux-architecture-evidence.yml', variantId: args.variant || process.env.DE405_VARIANT_ID || args.arch, volatileProvenance: { runId: null, timestamp: null }, architecture: args.arch, runnerLabel: args.runner,
  sampleAsset: { archiveSha256: process.env.DE405_SAMPLE_ASSET_SHA256 || 'fixture', urlSha256: createHash('sha256').update(process.env.DE405_SAMPLE_ASSET_URL || 'fixture').digest('hex') },
  officialInputs: { cspiceArchiveSha256: acquisitionProvenance.cspice.sha256, spkSha256: acquisitionProvenance.spk.sha256, sourceManifestSha256: acquisitionProvenance.inputs.sourceManifestSha256, cspiceUrlSha256: createHash('sha256').update(acquisitionProvenance.cspice.url).digest('hex'), spkUrlSha256: createHash('sha256').update(acquisitionProvenance.spk.url).digest('hex'), arm64SourcePort: args.arch === 'arm64' },
  execution: args['execution-mode'] || process.env.DE405_EXECUTION_MODE || 'github-hosted-vm', emulation: args.emulation === 'true' || process.env.DE405_EMULATION === 'true',
  host: { uname: execFileSync('uname', ['-a'], { encoding: 'utf8' }).trim(), machine: execFileSync('uname', ['-m'], { encoding: 'utf8' }).trim(), imageOS: args['host-image-os'] || process.env.DE405_HOST_IMAGE_OS || process.env.ImageOS || 'unavailable', imageVersion: args['host-image-version'] || process.env.DE405_HOST_IMAGE_VERSION || process.env.ImageVersion || 'unavailable' },
  userspace: { family: args['userspace-family'] || process.env.DE405_USERSPACE_FAMILY || 'ubuntu-24.04', osRelease, libc, compiler, compilerVersion: execFileSync(compiler, ['--version'], { encoding: 'utf8' }).split('\n')[0], compilerTarget: execFileSync(compiler, ['-dumpmachine'], { encoding: 'utf8' }).trim(), node: process.version, packages: packageInfo, binutils: binutils.stdout.split('\n').find(Boolean) || binutils.stderr.split('\n').find(Boolean) || 'unavailable', linker: linker.stdout.split('\n').find(Boolean) || linker.stderr.split('\n').find(Boolean) || 'unavailable', ar: ar.stdout.split('\n').find(Boolean) || ar.stderr.split('\n').find(Boolean) || 'unavailable', toolBinarySha256, toolchain },
  cspiceBuild: cspiceBuild,
  controls: { flags, locale: process.env.LC_ALL || process.env.LANG || 'unavailable', timezone: process.env.TZ || 'unavailable', wrapper: 'de405-canonical-v2-runner', serialization: 'JSONL LF final newline', sourceHashes: hashes, artifactHashes },
  result: { path: 'result.jsonl', sha256: resultHash, bytes: resultBytes, rowCount: await countRows(result), lineEnding: 'lf_only_final_lf' },
  container: { used: args['container-used'] === 'true' || process.env.DE405_CONTAINER_USED === 'true', image: args['container-image'] || process.env.DE405_CONTAINER_IMAGE || null, identitySource: args['container-identity-source'] || process.env.DE405_CONTAINER_IDENTITY_SOURCE || 'github-hosted-runner-image' }
}
const expectedRowCount = Number(process.env.DE405_EXPECTED_ROW_COUNT || 150671)
if (provenance.result.rowCount !== expectedRowCount) throw new Error(`expected complete ${expectedRowCount}-row corpus, got ${provenance.result.rowCount}`)
if (provenance.host.imageOS === 'unavailable' || provenance.host.imageVersion === 'unavailable') throw new Error('GitHub runner image identity is unavailable')
if (process.platform === 'linux' && (provenance.userspace.osRelease === 'unavailable' || provenance.userspace.libc === 'unavailable')) throw new Error('Linux userspace identity is unavailable')
await writeFile(resolve(args.output, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n')
