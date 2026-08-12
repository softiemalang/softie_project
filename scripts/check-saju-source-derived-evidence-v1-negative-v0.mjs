import { checkArtifact } from './check-saju-source-derived-evidence-v1.mjs'
import { ROOT, buildArtifact } from './materialize-saju-source-derived-evidence-v1.mjs'

const mutations = [
  {
    id: 'asset-path-relocated-to-legacy-root',
    mutate: artifact => { artifact.sourceDerivedAsset.path = '-.jpg' },
  },
  {
    id: 'asset-byte-hash-tampered',
    mutate: artifact => { artifact.sourceDerivedAsset.sha256 = '0'.repeat(64) },
  },
  {
    id: 'source-page-relabeled',
    mutate: artifact => { artifact.provenance.sourcePdfPage = 5 },
  },
  {
    id: 'rerender-identity-dropped',
    mutate: artifact => { artifact.provenance.rerenderByteIdentity = false },
  },
  {
    id: 'source-pdf-copied-promotion',
    mutate: artifact => { artifact.scope.sourcePdfCopied = true },
  },
  {
    id: 'readiness-promoted',
    mutate: artifact => { artifact.readinessBoundary.availableForInterpretation = true },
  },
]

const baseline = await buildArtifact({ root: ROOT })
const results = []
for (const mutation of mutations) {
  const candidate = structuredClone(baseline)
  mutation.mutate(candidate)
  const checked = await checkArtifact({ root: ROOT, candidate })
  results.push({
    id: mutation.id,
    rejected: !checked.pass,
    failures: checked.failures.map(item => typeof item === 'string' ? item : item.id),
  })
}

const output = {
  schema: 'saju-source-derived-evidence-v1-negative-v0',
  mutationCount: results.length,
  allRejected: results.every(item => item.rejected),
  results,
}
process.stdout.write(JSON.stringify(output, null, 2) + '\n')
if (!output.allRejected) process.exitCode = 1
