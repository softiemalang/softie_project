import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
for (const key of ['summary', 'markdown', 'v1', 'v1-markdown', 'output', 'raw-x64', 'raw-arm64', 'source-run', 'recorded-at']) if (!args[key]) throw new Error(`--${key} is required`)
const sha256 = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const v1 = JSON.parse(await readFile(args.v1, 'utf8'))
const v2 = JSON.parse(await readFile(args.summary, 'utf8'))
const record = {
  schemaVersion: 1,
  recordType: 'de405-linux-architecture-v2-reanalysis-record',
  controlContractVersion: v2.controlContractVersion,
  sourceRunId: args['source-run'],
  recordedAt: args['recorded-at'],
  rawArtifactPaths: { x64: args['raw-x64'], arm64: args['raw-arm64'] },
  existingV1: { classification: v1.classification, summarySha256: await sha256(args.v1), markdownSha256: await sha256(args['v1-markdown']) },
  v2: { classification: v2.classification, summarySha256: await sha256(args.summary), markdownSha256: await sha256(args.markdown) },
  changedTaxonomy: {
    reclassifiedNonBlocking: ['host.imageOS', 'host.imageVersion'],
    allowedArchitectureSpecific: v2.controls.differingArchitecture,
    requiredSemanticControls: v2.controls.mismatchedRequired,
    observationalDifferences: v2.controls.differingObservational
  },
  reinterpretationRationale: 'The v1 block treated runner image labels as identical arithmetic controls. v2 separates hosting-image observation from matched Ubuntu/glibc/GCC/Node userspace and source/input invariants; the raw result remains byte-identical across x64 and arm64.',
  scopeBoundary: 'Fixed official CSPICE N0067 source, DE405 SPK, canonical-v2 full corpus, and the observed Ubuntu 24.04.4/glibc 2.39/GCC 13.3.0/Node v22.23.1 matrix only.'
}
await writeFile(args.output, JSON.stringify(record, null, 2) + '\n')
