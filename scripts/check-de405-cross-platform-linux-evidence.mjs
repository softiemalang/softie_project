import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json')
const evidence = JSON.parse(await readFile(path, 'utf8'))
const hex256 = /^[0-9a-f]{64}$/
const sum = values => Object.values(values).reduce((total, value) => total + value, 0)
const baseline = evidence.exactness.linuxGcc
const candidate = evidence.exactness.linuxClang
const baselineSets = evidence.mismatchSets.baselineNonExact
const candidateSets = evidence.mismatchSets.candidateNonExact
const checks = {
  recordType: evidence.recordType === 'de405_cross_platform_linux_execution_comparison',
  failClosedStatus: evidence.status === 'recorded_comparison_mismatch' && evidence.productionActivation === false,
  corpus: evidence.corpus.sampleCount === 150671 && evidence.corpus.fullLinuxCanonicalComparison === 'established_by_binary64_stream_parser',
  inputIdentity: [evidence.inputIdentity.samplesSha256, evidence.inputIdentity.canonicalSha256, evidence.inputIdentity.spkSha256].every(hash => hex256.test(hash)),
  compilerCount: evidence.compilerRuns.length === 2,
  deterministicRuns: evidence.compilerRuns.every(run => run.runs.length === 2 && run.runsByteIdentical && run.runs[0] === run.runs[1]),
  gccRows: evidence.compilerRuns[0].candidateShadowEqualRows === 150671 && evidence.compilerRuns[0].candidateShadowDifferentRows === 0,
  exactness: baseline.rows === 150671 && baseline.baselineExact + baseline.baselineNonExact === 150671 && baseline.candidateExact + baseline.candidateRegressed === 150671 && candidate.baselineExact === baseline.baselineExact && candidate.baselineNonExact === baseline.baselineNonExact && candidate.candidateExact === baseline.candidateExact && candidate.candidateRegressed === baseline.candidateRegressed,
  mismatchSets: baselineSets.appleCount === 17279 && baselineSets.linuxCount === 62025 && baselineSets.intersectionCount === 17279 && baselineSets.onlyAppleCount === 0 && baselineSets.onlyLinuxCount === 44746 && candidateSets.appleCount === 0 && candidateSets.linuxCount === 54789 && candidateSets.intersectionCount === 0 && candidateSets.onlyLinuxCount === 54789,
  breakdownConservation: sum(evidence.breakdown.appleBaselineNonExact.byComponent) === 17279 && sum(evidence.breakdown.linuxBaselineNonExact.byComponent) === 62025 && sum(evidence.breakdown.linuxCandidateNonExact.byEpochKind) === 54789,
  sentinels: evidence.sentinelComparison.testedCount === 14 && evidence.sentinelComparison.matches === 13 && evidence.sentinelComparison.mismatches === 1 && Object.keys(evidence.exactness.observedLinuxCandidateStateBitsByKey).length === 14 && Object.values(evidence.exactness.observedLinuxCandidateStateBitsByKey).every(bits => bits.length === 6 && bits.every(bit => /^0x[0-9a-f]{16}$/.test(bit))),
  rawHashes: hex256.test(evidence.reproducibility.rawOutputSha256) && evidence.compilerRuns.every(run => hex256.test(run.runnerBinarySha256) && run.runs.every(hash => hex256.test(hash))),
  emulationLabeled: evidence.linuxEnvironment.nativeHardware === false
}
if (Object.values(checks).some(value => !value)) throw new Error(JSON.stringify(checks))
console.log(JSON.stringify({ status: 'passed', checks, comparisonStatus: evidence.status }, null, 2))
