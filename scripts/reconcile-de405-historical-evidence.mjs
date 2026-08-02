import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const sha256 = value => createHash('sha256').update(value).digest('hex')
const old = await readJson('artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json')
const currentApple = await readJson('docs/de405-cspice-source-equivalence.json')
const currentLinux = await readJson('docs/de405-linux-architecture-summary.json')
const remote = await readJson('docs/de405-linux-architecture-remote-record.json')
const triangle = await readJson('docs/de405-controlled-build-triangle-evidence.json')
const historical = old.linuxEnvironment
const resultHash = currentApple.resultHashes.official1.sha256
const inputIdentitySame = old.inputIdentity.samplesSha256 === currentApple.inputs.samplesSha256 && old.inputIdentity.spkSha256 === currentApple.inputs.spkSha256 && old.inputIdentity.canonicalSha256 === resultHash
const currentCrossPlatformIdentity = currentLinux.provenance.x64.result.sha256 === resultHash && currentLinux.provenance.arm64.result.sha256 === resultHash
const oldContract = {
  source: 'same sample/SPK/canonical hash, but no raw Apple/Linux pairwise result stream',
  stage: 'shadow baseline/candidate and canonical-route recomposition',
  components: 'six Binary64 state components, with target/center route composition',
  rowIdentity: '150671 rows; sorted mismatch-set identities and repeated raw-output hashes'
}
const currentContract = {
  source: 'official NAIF CSPICE N0067 source acquired per job and DE405 SPK',
  stage: 'canonical-v2 runner final result',
  components: 'six Binary64 state components per canonical-v2 row',
  rowIdentity: '150671 ordered sampleId/queryEtHex rows'
}
const report = {
  schemaVersion: 1,
  recordType: 'de405_historical_evidence_reconciliation',
  verdict: 'historical_mismatch_input_or_pipeline_difference_identified',
  baselineHead: '33e8215f1349860e6166f7d1c779b6d36b6a9624',
  identity: {
    inputIdentitySame,
    sampleSha256: currentApple.inputs.samplesSha256,
    spkSha256: currentApple.inputs.spkSha256,
    currentOfficialResultSha256: resultHash,
    currentOfficialResultBytes: currentApple.resultHashes.official1.bytes,
    currentOfficialResultRerunByteIdentity: currentApple.rerunByteIdentity.official,
    currentLinuxAppleHashEqual: currentCrossPlatformIdentity,
    currentLinuxRows: currentLinux.sampleCount
  },
  historicalEvidence: {
    status: old.status,
    distribution: historical.distribution,
    execution: historical.execution,
    emulation: historical.nativeHardware === false,
    image: `${historical.distribution} / ${historical.kernel}`,
    compilerRuns: old.compilerRuns.map(run => ({ compiler: run.compiler, version: run.version, libc: run.libc, rawOutputMatchesGcc: run.rawOutputMatchesGcc ?? null, linkageLimitation: run.linkageLimitation ?? null })),
    baselineExactness: old.exactness,
    firstDivergence: { status: 'unrecoverable_from_persisted_artifact', reason: 'persisted artifact has sentinel first-divergence only; no ordered raw Apple/Linux pairwise state stream' },
    contract: oldContract
  },
  currentEvidence: {
    officialApple: { resultSha256: resultHash, differingComponents: currentApple.runtimeComparison.differingComponents, rowCount: currentApple.inputs.rowCount, compiler: currentApple.host.compiler, platform: `${currentApple.host.platform}/${currentApple.host.architecture}` },
    ubuntuX64Arm64: { resultSha256: currentLinux.provenance.x64.result.sha256, differingRows: currentLinux.differingRows, differingComponents: currentLinux.differingComponents, classification: currentLinux.classification, sourceHashesEqual: currentLinux.controls.sourceHashesEqual ?? true },
    contract: currentContract
  },
  classification: {
    formatOrWrapperDifference: 'yes: historical shadow/canonical-route diagnostic is not the current canonical-v2 final-result contract',
    sourceInputCorpusDifference: inputIdentitySame ? 'not_observed_for_sample/SPK/canonical hash' : 'observed',
    alpineMuslOrCompiler: 'possible and unisolated in historical evidence; GCC and Clang shared GCC-built CSPICE archive',
    qemu: 'possible execution-pipeline confounder; historical run was QEMU x86_64 on Darwin arm64, not native x64',
    staleGeneratedArtifact: 'not_observed in the reconciled tracked identity records; historical raw pairwise stream remains absent',
    platformSensitivityScope: 'valid only for the historical shadow/canonical-route contract; not a general Apple-vs-Linux canonical-v2 claim'
  },
  requiredVerdicts: {
    historicalReconciliation: 'historical_mismatch_input_or_pipeline_difference_identified',
    legacyRemoteMatrix: 'ready_for_legacy_alpine_native_remote_run',
    unrecoverableHistoricalContract: false,
    immutableAlpineToolchainUnavailable: false
  },
  provenanceChecks: {
    remoteRecordSummarySha256: remote.summary.sha256,
    triangleExistingEvidenceClassification: triangle.existingEvidenceClassification,
    reportSha256: sha256(JSON.stringify({ old: old.recordType, current: resultHash, head: '33e8215f1349860e6166f7d1c779b6d36b6a9624' }))
  }
}
if (!inputIdentitySame || !currentCrossPlatformIdentity || currentLinux.sampleCount !== 150671) throw new Error('historical/current identity reconciliation failed')
if (old.compilerRuns.some(run => run.compiler === 'Clang' && !run.linkageLimitation)) throw new Error('historical Clang linkage limitation missing')
console.log(JSON.stringify(report, null, 2))
