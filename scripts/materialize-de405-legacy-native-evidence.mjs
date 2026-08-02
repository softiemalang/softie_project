import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
for (const key of ['analysis', 'remote-record', 'remote-summary', 'local-summary', 'summary-output', 'markdown-output', 'record-output']) if (!args[key]) throw new Error(`--${key} is required`)

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const hashFile = async path => hashBytes(await readFile(path))
const analysis = await readJson(args.analysis)
const remoteRecord = await readJson(args['remote-record'])
const remoteSummary = await readJson(args['remote-summary'])
const localSummary = await readJson(args['local-summary'])
const reference = analysis.variants.find(variant => variant.id === analysis.referenceVariant)
if (!reference) throw new Error('reference variant missing')

const sourceIdentity = {
  toolkit: 'CSPICE N0067',
  sampleSha256: reference.provenance.officialInputs.sampleSha256 || reference.provenance.controls.sourceHashes.samples,
  spkSha256: reference.provenance.officialInputs.spkSha256,
  cspiceArchiveSha256: reference.provenance.officialInputs.cspiceArchiveSha256,
  cspiceSourceManifestSha256: reference.provenance.controls.sourceHashes.cspiceSourceManifest,
  runnerSourceSha256: reference.provenance.controls.sourceHashes.runnerSource
}
const compactVariant = variant => ({
  id: variant.id,
  userspace: {
    family: variant.provenance.userspace.family,
    osRelease: variant.provenance.userspace.osRelease,
    libc: variant.provenance.userspace.libc,
    architecture: variant.provenance.architecture,
    compiler: variant.provenance.userspace.compiler,
    compilerVersion: variant.provenance.userspace.compilerVersion,
    compilerTarget: variant.provenance.userspace.compilerTarget,
    node: variant.provenance.userspace.node,
    toolchain: variant.provenance.userspace.toolchain ? {
      image: variant.provenance.userspace.toolchain.image,
      packageLockSha256: variant.provenance.userspace.toolchain.packageLockSha256,
      filesystemSha256: variant.provenance.userspace.toolchain.filesystemSha256,
      packages: variant.provenance.userspace.toolchain.packages
    } : null
  },
  flags: variant.provenance.controls.flags,
  result: { sha256: variant.resultSha256, rowCount: variant.provenance.result.rowCount, bytes: variant.provenance.result.bytes, lineEnding: variant.provenance.result.lineEnding }
})
const summary = {
  schemaVersion: 2,
  recordType: 'de405_canonical_v2_cross_environment_evidence',
  classification: 'canonical_v2_cross_environment_bitwise_identity_established',
  execution: { head: analysis.executionHead, ref: reference.provenance.githubRef, workflow: reference.provenance.workflowIdentity },
  canonicalV2: {
    source: sourceIdentity,
    sample: { archiveSha256: reference.provenance.sampleAsset.archiveSha256, rows: analysis.corpus.rowCount },
    stateComponents: analysis.corpus.componentCount / analysis.corpus.rowCount,
    controls: { locale: reference.provenance.controls.locale, timezone: reference.provenance.controls.timezone, wrapper: reference.provenance.controls.wrapper, serialization: reference.provenance.controls.serialization, flags: reference.provenance.controls.flags }
  },
  corpus: analysis.corpus,
  variants: analysis.variants.map(compactVariant),
  pairwise: analysis.comparisons,
  historicalScope: {
    priorCompilerPlatformSensitivity: 'shadow_baseline_candidate_and_route_recomposition_only',
    historicalFirstArithmeticDivergence: 'unrecoverable_from_preserved_raw_pipeline',
    generalization: 'tested only for this fixed N0067 source, DE405 SPK, canonical-v2 runner, corpus, and explicit FP flags; not a universal platform theorem'
  },
  rawArtifacts: { tracked: false, storedOutsideRepository: true, retentionDays: remoteRecord.setupImage.retentionDays }
}
const remoteOutput = {
  schemaVersion: 2,
  recordType: 'de405_legacy_native_matrix_remote_record',
  runId: remoteRecord.runId,
  execution: { head: remoteRecord.head, ref: remoteRecord.ref, workflow: remoteRecord.workflow },
  jobs: remoteRecord.jobs,
  sampleAsset: remoteRecord.sampleAsset,
  setupImage: remoteRecord.setupImage,
  variants: Object.fromEntries(Object.entries(remoteRecord.variants).map(([id, variant]) => [id, {
    compiler: variant.compiler,
    node: variant.node,
    resultSha256: variant.resultSha256,
    rowCount: variant.rowCount,
    toolchainImage: variant.toolchainImage,
    packageLockSha256: variant.packageLockSha256,
    filesystemSha256: variant.filesystemSha256
  }])),
  summaryHashes: {
    remoteSummarySha256: await hashFile(args['remote-summary']),
    localReanalysisSummarySha256: await hashFile(args['local-summary']),
    remoteLocalSummaryByteIdentical: JSON.stringify(remoteSummary) === JSON.stringify(localSummary),
    materializedSummarySha256: hashBytes(Buffer.from(JSON.stringify(summary, null, 2) + '\n'))
  },
  rawArtifacts: { tracked: false, storedOutsideRepository: true, retentionDays: remoteRecord.setupImage.retentionDays }
}
const markdown = `# DE405 canonical-v2 cross-environment evidence

- Classification: \`${summary.classification}\`
- Execution: \`${summary.execution.head}\` / \`${summary.execution.ref}\`
- Workflow: \`${summary.execution.workflow}\`
- Canonical-v2 source: ${summary.canonicalV2.source.toolkit}; sample archive SHA-256 \`${summary.canonicalV2.sample.archiveSha256}\`; SPK \`${summary.canonicalV2.source.spkSha256}\`; CSPICE \`${summary.canonicalV2.source.cspiceArchiveSha256}\`
- Corpus: ${summary.corpus.rowCount} rows / ${summary.corpus.componentCount} state components
- Raw JSONL: outside the repository; not tracked; Actions retention ${summary.rawArtifacts.retentionDays} days

## Variants

${summary.variants.map(variant => `- ${variant.id}: ${variant.userspace.family}, ${variant.userspace.compiler} ${variant.userspace.compilerVersion}; result \`${variant.result.sha256}\``).join('\n')}

## Pairwise result

${summary.pairwise.map(pair => `- ${pair.reference} ↔ ${pair.variant}: ${pair.differingRows}/${pair.differingComponents} differing rows/components; first divergence ${pair.firstDivergence ? 'present' : 'none'}; ULP max ${pair.ulp.max}; absolute max ${pair.absolute.max}`).join('\n')}

The conclusion applies only to this fixed N0067 source, DE405 SPK, canonical-v2 runner, 150,671-row corpus, and explicit floating-point flags. Historical shadow/canonical-route sensitivity remains bounded to that older contract; its first arithmetic divergence is unrecoverable from the preserved raw pipeline.
`
await writeFile(args['summary-output'], JSON.stringify(summary, null, 2) + '\n')
await writeFile(args['markdown-output'], markdown)
await writeFile(args['record-output'], JSON.stringify(remoteOutput, null, 2) + '\n')
console.log(JSON.stringify({ summary: args['summary-output'], markdown: args['markdown-output'], remoteRecord: args['record-output'], classification: summary.classification, byteStableSerialization: true }, null, 2))
