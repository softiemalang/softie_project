import { buildArtifact } from './materialize-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs'
import { checkBundle } from './check-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs'

const expected = await buildArtifact()
const cases = [
  ['semantic-promotion', artifact => { artifact.semanticWitness.status = 'ready'; artifact.semanticWitness.completeBindingCount = 12 }],
  ['local-page-duplicate', artifact => { artifact.concordance.rows[1].localPdfPage = artifact.concordance.rows[0].localPdfPage }],
  ['manifest-leaf-order', artifact => { artifact.manifests.volumes[0].entries[0].stableIndex = 7 }],
  ['same-record-independent', artifact => { artifact.semanticWitness.lineage.independentWitness = true }],
  ['rotation-promotion', artifact => { artifact.semanticWitness.representationRelations.rotation06.semanticAuthority = true }],
  ['production-mutation', artifact => { artifact.boundaries.productionModified = true }],
]
const findings = []
for (const [id, mutate] of cases) {
  const candidate = structuredClone(expected); mutate(candidate)
  const errors = checkBundle(candidate, expected)
  if (!errors.length) findings.push({ id, errors })
}
console.log(JSON.stringify({ schema: expected.schemaVersion, pass: findings.length === 0, findings }, null, 2))
if (findings.length) process.exitCode = 1
