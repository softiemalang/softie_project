import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v2.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const mutations = [
  {
    id: 'promote_direct_single_witness',
    mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 12 },
  },
  {
    id: 'promote_production_ordinal',
    mutate: value => { value.bindingMatrix.anchorRows[0].productionOrdinal = 0 },
  },
  {
    id: 'promote_semantic_authority',
    mutate: value => { value.bindingMatrix.composition.status = 'semantic_authority_established' },
  },
  {
    id: 'make_secondary_canonical',
    mutate: value => { value.evidence.observations.find(item => item.observationId === 'obs-pchome-secondary-anchor-clarification').canonicalForClaims = true },
  },
  {
    id: 'admit_secondary_as_independent',
    mutate: value => { value.lineageAssessment.secondaryClarification.independentHistoricalAuthority = true },
  },
  {
    id: 'infer_1871_textual_lineage',
    mutate: value => { value.lineageAssessment.earlierEdition1871.directTextComparisonPerformed = true },
  },
  {
    id: 'close_palace_blocker',
    mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] },
  },
  {
    id: 'mutate_branch_join',
    mutate: value => { value.bindingMatrix.anchorRows[1].branchToken = '巳' },
  },
  {
    id: 'mutate_nanbei_hash',
    mutate: value => { value.bindingMatrix.sourceBranchRing.pdfSha256 = '0'.repeat(64) },
  },
  {
    id: 'inflate_graph_source_count',
    mutate: value => { value.graphImpact.successor.sourceCount = 18 },
  },
  {
    id: 'promote_claim',
    mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' },
  },
  {
    id: 'add_generated_timestamp',
    mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() },
  },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v2-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
