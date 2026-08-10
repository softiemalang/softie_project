import { buildBundle } from './materialize-ziwei-p0-local-frontier-reconciliation-v1.mjs'
import { checkBundle, ROOT } from './check-ziwei-p0-local-frontier-reconciliation-v1.mjs'

const base = buildBundle(ROOT)
const mutations = [
  {
    id: 'source_authority_promotion',
    apply: artifact => { artifact.sourceIdentity.sourceAuthorityPromoted = true },
  },
  {
    id: 'independent_witness_admission',
    apply: artifact => { artifact.sourceIdentity.independentWitnessesAdmitted = 1 },
  },
  {
    id: 'four_transform_blocker_closure',
    apply: artifact => { artifact.blockerAssessments.find(item => item.id === 'blocker-four-transform-source-witness').status = 'resolved' },
  },
  {
    id: 'life_body_24_row_elision',
    apply: artifact => { artifact.localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalBlocked = 0 },
  },
  {
    id: 'rotation06_semantic_promotion',
    apply: artifact => { artifact.readinessImpact.rotation06 = 'semantic_authority' },
  },
  {
    id: 'claim_count_fabrication',
    apply: artifact => { artifact.graphImpact.successor.claimCount = 31 },
  },
  {
    id: 'predecessor_boundary_damage',
    apply: artifact => { artifact.predecessor.coverage.observationCount = 40 },
  },
  {
    id: 'readiness_promotion',
    apply: artifact => { artifact.readinessImpact.readiness = 'ready' },
  },
  {
    id: 'source_pdf_git_storage',
    apply: artifact => { artifact.preservation.sourcePdfsStoredInGit = true },
  },
  {
    id: 'protected_dash_jpg_loss',
    apply: artifact => { artifact.preservation.protectedUntrackedDashJpgPreserved = false },
  },
  {
    id: 'generated_timestamp',
    apply: artifact => { artifact.deterministicContract.generatedAt = '2026-08-10T00:00:00.000Z' },
  },
  {
    id: 'source_hash_mutation',
    apply: artifact => { artifact.sourceIdentity.sources[0].actualSha256 = '0'.repeat(64) },
  },
]

const results = mutations.map(({ id, apply }) => {
  const mutation = structuredClone(base)
  apply(mutation)
  const errors = checkBundle({ artifact: mutation }, ROOT)
  return { id, rejected: errors.length > 0, errors }
})

const output = {
  mutationCount: results.length,
  allRejected: results.every(item => item.rejected),
  results,
}
console.log(JSON.stringify(output, null, 2))
if (!output.allRejected) process.exitCode = 1
