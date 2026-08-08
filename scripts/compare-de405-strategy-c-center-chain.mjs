import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const [canonicalPath, integrationPath, shadowPath, samplesPath, outputPath] = process.argv.slice(2)
if (!canonicalPath || !integrationPath || !shadowPath || !samplesPath) throw new Error('usage: compare-de405-strategy-c-center-chain.mjs canonical.jsonl integration.jsonl shadow.jsonl samples.jsonl')
const iter = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const streams = { samples: iter(samplesPath), canonical: iter(canonicalPath), integration: iter(integrationPath), shadow: iter(shadowPath) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const counts = { rows: 0, identityErrors: 0, canonicalBaselineMismatches: 0, integrationCandidateMismatches: 0, integrationErrors: 0, shadowErrors: 0, candidateRegressionsAgainstCanonical: 0, matrix: { canonicalEqualsShadowBaseline: 0, canonicalEqualsShadowCandidate: 0, integrationEqualsShadowBaseline: 0, integrationEqualsShadowCandidate: 0, integrationEqualsCanonical: 0, integrationEqualsCanonicalWhenShadowCandidateDiffers: 0 }, firstMismatch: null }
while (true) {
  const next = await Promise.all(Object.values(streams).map(stream => stream.next()))
  if (next.some(item => item.done)) { if (!next.every(item => item.done)) throw new Error('center-chain streams have different lengths'); break }
  const rows = Object.fromEntries(Object.keys(streams).map((key, index) => [key, JSON.parse(next[index].value)]))
  const { samples, canonical, integration, shadow } = rows
  counts.rows++
  if (samples.sampleId !== canonical.sampleId || samples.sampleId !== integration.sampleId || samples.sampleId !== shadow.sampleId || samples.queryEtHex !== canonical.queryEtHex || samples.queryEtHex !== integration.queryEtHex || samples.queryEtHex !== shadow.queryEtBits) counts.identityErrors++
  const canonicalState = canonical.stateKmKmPerSec?.map(value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }) ?? null
  const baselineEqual = same(canonicalState, shadow.baselinePairStateBits)
  const candidateEqual = same(integration.stateBits, shadow.candidatePairStateBits)
  const canonicalCandidateEqual = same(canonicalState, shadow.candidatePairStateBits)
  const integrationBaselineEqual = same(integration.stateBits, shadow.baselinePairStateBits)
  const integrationCanonicalEqual = same(integration.stateBits, canonicalState)
  if (baselineEqual) counts.matrix.canonicalEqualsShadowBaseline++
  if (canonicalCandidateEqual) counts.matrix.canonicalEqualsShadowCandidate++
  if (integrationBaselineEqual) counts.matrix.integrationEqualsShadowBaseline++
  if (candidateEqual) counts.matrix.integrationEqualsShadowCandidate++
  if (integrationCanonicalEqual) counts.matrix.integrationEqualsCanonical++
  if (!canonicalCandidateEqual && integrationCanonicalEqual) counts.matrix.integrationEqualsCanonicalWhenShadowCandidateDiffers++
  if (!baselineEqual) counts.canonicalBaselineMismatches++
  if (!candidateEqual) counts.integrationCandidateMismatches++
  if (integration.error) counts.integrationErrors++
  if (shadow.error) counts.shadowErrors++
  if (baselineEqual && !same(integration.stateBits, canonicalState)) counts.candidateRegressionsAgainstCanonical++
  if (!counts.firstMismatch && (!candidateEqual || integration.error)) counts.firstMismatch = { sampleId: samples.sampleId, candidateExpected: shadow.candidatePairStateBits, integrationActual: integration.stateBits, error: integration.error || null }
}
const result = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_center_chain_comparison',
  comparison: { canonicalBaselineEvaluator: 'CSPICE N0067 linked chbint_', integrationEvaluator: 'CSPICE N0067 spkez_c route with Strategy C chbint_ replacement', shadowCandidate: 'project-owned shared-route Strategy C shadow' },
  build: { manifestPath: 'tools/de405-type2-strategy-c-center-chain-integration/build/runner-build.json', manifestSha256: createHash('sha256').update(await readFile('tools/de405-type2-strategy-c-center-chain-integration/build/runner-build.json')).digest('hex') },
  input: { samplePath: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', rowCount: counts.rows },
  counts: { ...counts, candidateExact: counts.rows - counts.integrationCandidateMismatches, canonicalBaselineExact: counts.rows - counts.canonicalBaselineMismatches },
  interpretation: { centerChainObserved: true, candidateOutputMatchesShadowCandidate: counts.integrationCandidateMismatches === 0, candidateRegressionAgainstCanonical: counts.candidateRegressionsAgainstCanonical === 0, unresolvedRouteOrSelectionDifference: counts.integrationCandidateMismatches, productionActivation: false }
}
if (outputPath) await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
