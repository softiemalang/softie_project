import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v3.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const mutations = [
  { id: 'promote_nlc_independence', mutate: value => { value.lineageAssessment.sameEditionComparison.independentLineageAdmitted = true } },
  { id: 'promote_zjlib_block_identity', mutate: value => { value.lineageAssessment.lateReprintComparison.blockOrColophonIdentityClosed = true } },
  { id: 'promote_direct_single_witness', mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 1 } },
  { id: 'promote_physical_slot', mutate: value => { value.bindingMatrix.directPalaceWitnesses[1].physicalSlotBound = true } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.anchorRows[0].productionOrdinal = 0 } },
  { id: 'promote_semantic_authority', mutate: value => { value.bindingMatrix.composition.status = 'semantic_authority_established' } },
  { id: 'close_palace_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'admit_candidate_to_graph', mutate: value => { value.evidence.candidateReview.candidates[0].doesNotEnterGraph = false } },
  { id: 'claim_1871_lineage_closed', mutate: value => { value.lineageAssessment.earlierEdition1871.textualLineageClosed = true } },
  { id: 'inflate_graph_source_count', mutate: value => { value.graphImpact.successor.sourceCount = 20 } },
  { id: 'promote_claim', mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v3-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
