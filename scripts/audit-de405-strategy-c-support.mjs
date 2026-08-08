#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const canonical = resolve(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const integration = resolve(root, 'tools/de405-type2-strategy-c-integration/build/de405-type2-strategy-c-integration')
const spk = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const sample = JSON.parse((await readFile(resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'), 'utf8')).split('\n')[0])
const bits = value => { const b = Buffer.alloc(8); b.writeDoubleLE(value); return `0x${b.readBigUInt64LE().toString(16).padStart(16, '0')}` }
const identity = data => ({ sizeBytes: Buffer.byteLength(data), sha256: createHash('sha256').update(data).digest('hex') })
const directory = await mkdtemp(`${tmpdir()}/de405-strategy-c-support.`)
const cases = {
  valid: sample,
  out_of_coverage: { sampleId: 'support-out-of-coverage', targetId: 1, centerId: 399, frameId: 1, queryEtHex: bits(2e9) },
  malformed: { sampleId: 'support-malformed', targetId: 1, centerId: 399, frameId: 1 },
  nan: { sampleId: 'support-nan', targetId: 1, centerId: 399, frameId: 1, queryEtHex: '0x7ff8000000000000' },
  infinity: { sampleId: 'support-infinity', targetId: 1, centerId: 399, frameId: 1, queryEtHex: '0x7ff0000000000000' },
  signed_zero: { sampleId: 'support-signed-zero', targetId: 1, centerId: 399, frameId: 1, queryEtHex: '0x8000000000000000' }
}
const environment = { ...process.env, LC_ALL: 'C', LANG: 'C', TZ: 'UTC' }
const run = async (binary, name, row, runLabel) => {
  const label = binary === canonical ? 'canonical' : 'integration'
  const input = resolve(directory, `${name}.${label}.${runLabel}.input.jsonl`)
  const output = resolve(directory, `${name}.${label}.${runLabel}.jsonl`)
  await writeFile(input, JSON.stringify(row) + '\n')
  const child = spawnSync(binary, ['--evaluate-spk-type2-batch', '--spk', spk, '--input-jsonl', input, '--output-jsonl', output], { cwd: root, env: environment, encoding: 'utf8' })
  let outputText = ''
  try { outputText = await readFile(output, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  return { command: [binary, '--evaluate-spk-type2-batch', '--spk', 'de405.bsp', '--input-jsonl', `${name}.${label}.${runLabel}.input.jsonl`, '--output-jsonl', `${name}.${label}.${runLabel}.jsonl`], exitCode: child.status, stdout: child.stdout, stderr: child.stderr, output: outputText, outputIdentity: identity(outputText) }
}
const sameContract = (left, right) => left.exitCode === right.exitCode && left.stdout === right.stdout && left.stderr === right.stderr && left.output === right.output
const results = {}
for (const [name, row] of Object.entries(cases)) {
  const baseline = await run(canonical, name, row, 'serial-1')
  const candidate = await run(integration, name, row, 'serial-1')
  const baselineRepeat = await run(canonical, name, row, 'serial-2')
  const candidateRepeat = await run(integration, name, row, 'serial-2')
  const reversedCandidate = await run(integration, name, row, 'reversed-order')
  const reversedBaseline = await run(canonical, name, row, 'reversed-order')
  const [parallelBaseline, parallelCandidate] = await Promise.all([
    run(canonical, name, row, 'parallel'),
    run(integration, name, row, 'parallel')
  ])
  results[name] = {
    input: row,
    baseline,
    integration: candidate,
    repeatability: {
      baseline: { contractEqual: sameContract(baseline, baselineRepeat), secondRun: baselineRepeat },
      integration: { contractEqual: sameContract(candidate, candidateRepeat), secondRun: candidateRepeat }
    },
    executionOrder: {
      baseline: { contractEqual: sameContract(baseline, reversedBaseline), reversedOrderRun: reversedBaseline },
      integration: { contractEqual: sameContract(candidate, reversedCandidate), reversedOrderRun: reversedCandidate }
    },
    parallelExecution: {
      baseline: { contractEqual: sameContract(baseline, parallelBaseline), parallelRun: parallelBaseline },
      integration: { contractEqual: sameContract(candidate, parallelCandidate), parallelRun: parallelCandidate }
    },
    contractEqual: sameContract(baseline, candidate)
  }
}
const artifact = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_support_contract_audit',
  environment: { compiler: execFileSync('cc', ['--version'], { encoding: 'utf8' }).split('\n')[0], platform: process.platform, architecture: process.arch, locale: 'C', timezone: 'UTC', toolkit: 'CSPICE N0067', parallelism: 1, executionOrder: 'canonical then integration per case', buildFlags: ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off on Strategy C translation unit'], binaries: { canonical, integration } },
  cases: results,
  allContractEqual: Object.values(results).every(result => result.contractEqual),
  repeatabilityEqual: Object.values(results).every(result => result.repeatability.baseline.contractEqual && result.repeatability.integration.contractEqual),
  executionOrderInvariant: Object.values(results).every(result => result.executionOrder.baseline.contractEqual && result.executionOrder.integration.contractEqual),
  parallelExecutionInvariant: Object.values(results).every(result => result.parallelExecution.baseline.contractEqual && result.parallelExecution.integration.contractEqual),
  supportClassification: { supportedObserved: ['cc/Apple Clang arm64 Darwin + CSPICE N0067, serial process, C locale, UTC', 'independent parallel canonical/integration processes and reversed execution order'], observedOnly: ['valid, out-of-coverage, malformed, NaN, Infinity, signed-zero fixtures'], unsupportedOrUnverified: ['non-Clang compiler', 'non-arm64 platform', 'CI/production runtime'], noNewSupportDeclaration: true }
}
const output = process.argv[2] || 'artifacts/de405-strategy-c-support-audit.json'
await writeFile(resolve(root, output), JSON.stringify(artifact, null, 2) + '\n')
await rm(directory, { recursive: true, force: true })
console.log(JSON.stringify({ output, allContractEqual: artifact.allContractEqual, repeatabilityEqual: artifact.repeatabilityEqual, executionOrderInvariant: artifact.executionOrderInvariant, parallelExecutionInvariant: artifact.parallelExecutionInvariant, cases: Object.keys(cases) }, null, 2))
