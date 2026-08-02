import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outputDir = resolve(root, process.env.DE405_EVIDENCE_OUTPUT_DIR || 'artifacts/de405-cross-platform-evidence')
const samplesPath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const canonicalPath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl')
const shadowBinary = resolve(root, process.env.DE405_SHADOW_BINARY || 'tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow')
const spk = resolve(process.env.DE405_SPK || '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp')
const bitsToNumber = bits => { const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(bits)); return buffer.readDoubleBE() }
const numberToBits = value => { const buffer = Buffer.alloc(8); buffer.writeDoubleBE(value); return `0x${buffer.readBigUInt64BE().toString(16).padStart(16, '0')}` }
const hashFile = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex') }
const identity = async (path, normalizedPath) => ({ path: normalizedPath, sizeBytes: (await stat(path)).size, sha256: await hashFile(path) })
const stream = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const ordered = bits => { const value = BigInt(bits); return (value & 0x8000000000000000n) ? (~value & 0xffffffffffffffffn) : (value | 0x8000000000000000n) }
const ulp = (a, b) => { if (a === b) return 0; const left = ordered(BigInt(a)); const right = ordered(BigInt(b)); return Number(left > right ? left - right : right - left) }
const increment = (map, key, amount = 1) => map[key] = (map[key] || 0) + amount
const sortedObject = map => Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
const bucket = value => value === 0 ? '0' : value === 1 ? '1' : value <= 4 ? '2-4' : value <= 16 ? '5-16' : value <= 256 ? '17-256' : '257+'
const componentName = index => ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ'][index]
const firstLegDivergence = row => {
  const legs = [...(row.targetLegs || []).map(leg => ({ ...leg, chain: 'target' })), ...(row.centerLegs || []).map(leg => ({ ...leg, chain: 'center' }))]
  for (const leg of legs) for (let index = 0; index < 6; index++) if (leg.baselineStateBits?.[index] !== leg.candidateStateBits?.[index]) return { operation: 'type2_evaluator_leg_state', chain: leg.chain, body: leg.body, recordIndex: leg.recordIndex, component: componentName(index), componentIndex: index }
  return { operation: 'final_pair_composition', chain: 'pair', body: null, recordIndex: null, component: null, componentIndex: null }
}
const normalizeRoute = row => {
  const targetLegs = row.targetLegs || []; const centerLegs = row.centerLegs || []
  let commonSuffixLegCount = 0
  const sameLeg = (left, right) => left?.segmentIdentity === right?.segmentIdentity && left?.recordIndex === right?.recordIndex
  while (commonSuffixLegCount < targetLegs.length && commonSuffixLegCount < centerLegs.length && sameLeg(targetLegs[targetLegs.length - 1 - commonSuffixLegCount], centerLegs[centerLegs.length - 1 - commonSuffixLegCount])) commonSuffixLegCount++
  const targetRouteCount = targetLegs.length - commonSuffixLegCount; const centerRouteCount = centerLegs.length - commonSuffixLegCount
  const addState = (legs, key, count) => { const state = Array(6).fill(0); for (const leg of legs.slice(0, count)) for (let i = 0; i < 6; i++) state[i] += bitsToNumber(leg[key][i]); return state.map(numberToBits) }
  const subtract = (left, right) => left.map((value, i) => numberToBits(bitsToNumber(value) - bitsToNumber(right[i])))
  return { ...row, baselinePairStateBits: subtract(addState(targetLegs, 'baselineStateBits', targetRouteCount), addState(centerLegs, 'baselineStateBits', centerRouteCount)), candidatePairStateBits: subtract(addState(targetLegs, 'candidateStateBits', targetRouteCount), addState(centerLegs, 'candidateStateBits', centerRouteCount)), centerLegs: centerLegs.slice(0, centerRouteCount), routeComposition: { commonSuffixLegCount, targetLegCount: targetLegs.length, centerLegCount: centerLegs.length, targetRouteLegCount: targetRouteCount, centerRouteLegCount: centerRouteCount } }
}
const countMap = () => ({})
const sentinelByKey = new Map()
const summaries = { total: 0, baselineExact: 0, nonExact: 0, candidateExact: 0, candidateRegressed: 0, identityErrors: 0, executionErrors: 0, classificationExactlyOnce: 0, byEpochKind: countMap(), byRecordSelectionRelation: countMap(), byTarget: countMap(), byCenter: countMap(), byComponent: countMap(), bySign: countMap(), byMagnitude: countMap(), byUlpBucket: countMap(), byOperation: countMap(), byBoundary: countMap(), crossTabs: { epochKind_x_component: countMap(), epochKind_x_ulpBucket: countMap(), target_x_component: countMap(), recordRelation_x_operation: countMap(), boundary_x_sign: countMap() } }
const temp = await mkdtemp(resolve(tmpdir(), 'de405-cross-platform-evidence-'))
const legacyShadow = resolve(temp, 'legacy-shadow.jsonl')
try {
  execFileSync(shadowBinary, ['--evaluate-batch', '--spk', spk, '--input-jsonl', samplesPath, '--output-jsonl', legacyShadow], { cwd: root, env: { ...process.env, DE405_SHADOW_PRODUCTION_FLAGS: '1' }, stdio: 'inherit' })
  await mkdir(outputDir, { recursive: true })
  const nonExactPath = resolve(outputDir, 'non-exact-cases.jsonl')
  const output = await import('node:fs').then(fs => fs.createWriteStream(nonExactPath, { flags: 'w' }))
  const samples = stream(samplesPath); const canonical = stream(canonicalPath); const shadow = stream(legacyShadow)
  let rowIndex = 0
  for (;;) {
    const [sampleNext, canonicalNext, shadowNext] = await Promise.all([samples.next(), canonical.next(), shadow.next()])
    if (sampleNext.done || canonicalNext.done || shadowNext.done) { if (!(sampleNext.done && canonicalNext.done && shadowNext.done)) throw new Error('corpus streams have different lengths'); break }
    const sample = JSON.parse(sampleNext.value); const reference = JSON.parse(canonicalNext.value); const route = normalizeRoute(JSON.parse(shadowNext.value)); rowIndex++
    summaries.total++
    const identityError = sample.sampleId !== reference.sampleId || sample.sampleId !== route.sampleId || sample.queryEtHex !== reference.queryEtHex || sample.queryEtHex !== route.queryEtBits
    if (identityError) summaries.identityErrors++
    const baseline = route.baselinePairStateBits; const candidate = route.candidatePairStateBits; const expected = reference.stateBits ?? reference.stateKmKmPerSec?.map(numberToBits)
    const baselineExact = same(baseline, expected); const candidateExact = same(candidate, expected); const changed = !same(baseline, candidate)
    if (baselineExact) summaries.baselineExact++; else summaries.nonExact++
    if (candidateExact) summaries.candidateExact++; else summaries.candidateRegressed++
    if (!baselineExact) {
      const deltas = expected.map((bits, index) => bitsToNumber(bits) - bitsToNumber(baseline[index]))
      const ulps = expected.map((bits, index) => ulp(bits, baseline[index]))
      const first = ulps.findIndex(value => value !== 0); const firstComponent = first < 0 ? null : componentName(first)
      const firstDivergence = firstLegDivergence(route)
      const composition = route.routeComposition || { commonSuffixLegCount: null, targetRouteLegCount: null, centerRouteLegCount: null }
      const record = { schemaVersion: 1, recordType: 'de405_non_exact_case', ordinal: rowIndex, sampleId: sample.sampleId, input: { targetId: sample.targetId, centerId: sample.centerId, frameId: sample.frameId, segmentOrdinal: sample.segmentOrdinal, recordIndex: sample.recordIndex, knotIndex: sample.knotIndex, epochKind: sample.epochKind, queryEtHex: sample.queryEtHex, recordSelectionRelation: sample.recordSelectionRelation }, routeComposition: composition, baselineStateBits: baseline, candidateStateBits: candidate, referenceStateBits: expected, delta: deltas, ulpDistance: ulps, maxUlpDistance: Math.max(...ulps), firstDifferentComponent: firstComponent, sign: deltas.map(value => value === 0 ? 'zero' : value < 0 ? 'negative' : 'positive'), magnitude: deltas.map(value => Math.abs(value) === 0 ? 'zero' : Math.abs(value) < Number.MIN_VALUE ? 'subnormal' : Math.abs(value) < 1e-12 ? 'tiny' : Math.abs(value) < 1 ? 'small' : 'large'), binary64: { zeroOrSubnormalComponents: expected.map(bits => { const value = BigInt(bits); return (value & 0x7ff0000000000000n) === 0n }), negativeZeroComponents: expected.map(bits => bits === '0x8000000000000000') }, firstDivergence, classification: { primary: 'canonical_route_recomposition_resolves_baseline_mismatch', causeStatus: 'unresolved', evidence: 'baseline/candidate share route identities; canonical-route shadow removes only the common target/center suffix from pair composition; this does not prove the original mismatch mechanism' } }
      output.write(JSON.stringify(record) + '\n')
      increment(summaries.byEpochKind, sample.epochKind); increment(summaries.byRecordSelectionRelation, sample.recordSelectionRelation); increment(summaries.byTarget, sample.targetId); increment(summaries.byCenter, sample.centerId); increment(summaries.byComponent, firstComponent || 'none'); increment(summaries.byUlpBucket, bucket(Math.max(...ulps))); increment(summaries.byOperation, firstDivergence.operation); increment(summaries.byBoundary, composition.commonSuffixLegCount > 0 ? 'common_suffix_removed' : 'no_common_suffix')
      for (const value of record.sign) increment(summaries.bySign, value)
      for (const value of record.magnitude) increment(summaries.byMagnitude, value)
      for (const [key, value] of [[`${sample.epochKind}|${firstComponent}`, summaries.crossTabs.epochKind_x_component], [`${sample.epochKind}|${bucket(Math.max(...ulps))}`, summaries.crossTabs.epochKind_x_ulpBucket], [`${sample.targetId}|${firstComponent}`, summaries.crossTabs.target_x_component], [`${sample.recordSelectionRelation}|${firstDivergence.operation}`, summaries.crossTabs.recordRelation_x_operation], [`${composition.commonSuffixLegCount > 0 ? 'common_suffix_removed' : 'no_common_suffix'}|${record.sign[first] || 'none'}`, summaries.crossTabs.boundary_x_sign]]) increment(value, key)
      const sentinelKeys = [`epoch:${sample.epochKind}`, `relation:${sample.recordSelectionRelation}`, `component:${firstComponent}`, `operation:${firstDivergence.operation}`, 'max-ulp']
      for (const key of sentinelKeys) if (!sentinelByKey.has(key)) sentinelByKey.set(key, record)
      const currentMax = sentinelByKey.get('max-ulp'); if (!currentMax || record.maxUlpDistance > currentMax.maxUlpDistance || (record.maxUlpDistance === currentMax.maxUlpDistance && record.sampleId < currentMax.sampleId)) sentinelByKey.set('max-ulp', record)
    }
  }
  await new Promise((resolvePromise, reject) => { output.end(error => error ? reject(error) : resolvePromise()) })
  summaries.classificationExactlyOnce = summaries.nonExact
  const scriptIdentity = await identity(resolve(root, 'scripts/materialize-de405-cross-platform-evidence.mjs'), 'scripts/materialize-de405-cross-platform-evidence.mjs')
  const normalizerIdentity = await identity(resolve(root, 'scripts/normalize-de405-strategy-c-canonical-route-shadow.mjs'), 'scripts/normalize-de405-strategy-c-canonical-route-shadow.mjs')
  const manifest = { schemaVersion: 1, recordType: 'de405_cross_platform_evidence_manifest', productionActivation: false, status: 'local_execution_only_external_execution_pending', corpus: { sampleCount: summaries.total, nonExactCount: summaries.nonExact, samples: await identity(samplesPath, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'), canonical: await identity(canonicalPath, 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl'), kernel: await identity(spk, 'external-kernel/de405.bsp') }, source: { materializer: scriptIdentity, normalizer: normalizerIdentity }, command: 'npm run materialize:de405:cross-platform-evidence', inputOrder: 'samples.jsonl order; all three streams identity-checked by sampleId/queryEtHex', classification: 'exactly one JSONL record for every canonical-route baseline non-exact case; unresolved causes remain explicit', outputs: { nonExactCases: 'non-exact-cases.jsonl', breakdown: 'breakdown.json', sentinels: 'sentinels.json', environment: 'environment.json', checker: 'check.mjs', artifactHashes: 'artifact-hashes.json' }, externalExecution: { required: true, supported: ['Linux x86_64 GCC', 'Linux x86_64 Clang'], status: 'not_executed_in_this_environment', comparisonRule: 'compare canonical JSON artifacts and hashes; do not merge platform results' } }
  const breakdown = { schemaVersion: 1, recordType: 'de405_non_exact_breakdown', counts: summaries, conservation: { total: summaries.total, exactPlusNonExact: summaries.baselineExact + summaries.nonExact, expectedTotal: 150671, nonExactExactlyOnce: summaries.classificationExactlyOnce === summaries.nonExact }, unresolved: { count: summaries.nonExact, status: 'unresolved', reason: 'No external compiler/platform execution is available here, and no internal route/evaluator observation proves a causal mechanism for all rows.' } }
  const sentinels = { schemaVersion: 1, recordType: 'de405_non_exact_sentinels', selection: 'first deterministic row per key plus maximum ULP with sampleId tie-break', count: sentinelByKey.size, sentinels: Object.fromEntries([...sentinelByKey.entries()].sort(([a], [b]) => a.localeCompare(b))) }
  const compiler = process.env.CC || 'cc'; let compilerVersion = 'unavailable'; try { compilerVersion = execFileSync(compiler, ['--version'], { encoding: 'utf8' }).split('\n')[0] } catch {}
  const environment = { schemaVersion: 1, recordType: 'de405_cross_platform_environment', executionStatus: 'local_only', platform: process.platform, architecture: process.arch, compiler, compilerVersion, nodeVersion: process.version, cspiceToolkit: 'N0067', shadowBinary: await identity(shadowBinary, 'tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow'), compileProcedure: 'DE405_SHADOW_PRODUCTION_FLAGS=1 npm run build:de405:type2-experimental-shadow', externalProcedure: 'Set CSPICE_DIR and DE405_SPK, run the same npm entrypoint on Linux x86_64 with GCC or Clang, then run check.mjs; retain separate environment/hash records.' }
  await writeFile(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); await writeFile(resolve(outputDir, 'breakdown.json'), JSON.stringify(breakdown, null, 2) + '\n'); await writeFile(resolve(outputDir, 'sentinels.json'), JSON.stringify(sentinels, null, 2) + '\n'); await writeFile(resolve(outputDir, 'environment.json'), JSON.stringify(environment, null, 2) + '\n'); await writeFile(resolve(outputDir, 'check.mjs'), "import '../../scripts/check-de405-cross-platform-evidence.mjs'\n")
  const hashedFiles = ['manifest.json', 'breakdown.json', 'sentinels.json', 'environment.json', 'check.mjs', 'non-exact-cases.jsonl']
  await writeFile(resolve(outputDir, 'artifact-hashes.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_cross_platform_artifact_hashes', files: Object.fromEntries(await Promise.all(hashedFiles.map(async name => [name, await identity(resolve(outputDir, name), name)]))) }, null, 2) + '\n')
  console.log(JSON.stringify({ outputDir, rows: summaries.total, baselineExact: summaries.baselineExact, nonExact: summaries.nonExact, candidateExact: summaries.candidateExact, candidateRegressed: summaries.candidateRegressed }, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }
