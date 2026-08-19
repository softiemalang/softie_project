import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
  SOURCE_CNTS_00047996572,
  OBSERVATION_CNTS_P6,
  OBSERVATION_CNTS_P13,
  RELATION_CNTS_CROSS_PAGE,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v10.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v10.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const source = value => value.sourceLineage.addedSources.find(item => item.sourceId === SOURCE_CNTS_00047996572)
const observation = (value, id) => value.observations.find(item => item.observationId === id)
const relation = value => value.relations.find(item => item.relationId === RELATION_CNTS_CROSS_PAGE)

const mutations = [
  { id: 'promote_anonymous_independent_witness', mutate: value => { source(value).independentPhysicalWitness = true } },
  { id: 'change_manuscript_pdf_hash', mutate: value => { source(value).sourcePdfSha256 = '0'.repeat(64) } },
  { id: 'invent_manuscript_work_identity', mutate: value => { source(value).workIdentityStatus = 'same_as_youyi_lu' } },
  { id: 'close_cross_page_inference', mutate: value => { relation(value).inferenceStatus = 'direct_single_frame' } },
  { id: 'remove_p6_slot_boundary', mutate: value => { observation(value, OBSERVATION_CNTS_P6).doesNotEstablish = observation(value, OBSERVATION_CNTS_P6).doesNotEstablish.filter(item => item !== 'palace_name_to_physical_chart_slot') } },
  { id: 'remove_p13_ordinal_boundary', mutate: value => { observation(value, OBSERVATION_CNTS_P13).doesNotEstablish = observation(value, OBSERVATION_CNTS_P13).doesNotEstablish.filter(item => item !== 'production_ordinal') } },
  { id: 'promote_composed_full_binding', mutate: value => { value.bindingMatrix.crossPageComposedBindingFrontiers.at(-1).fullBinding = true } },
  { id: 'inflate_component_count', mutate: value => { value.bindingMatrix.coverage.directBranchPhysicalGridWitnessCount = 2 } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.coverage.productionOrdinalBindingCount = 1 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.observationCount = 59 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'promote_source_authority', mutate: value => { value.scope.sourceAuthorityPromoted = true } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
  { id: 'change_protected_asset_hash', mutate: value => { value.preservation.protectedAsset.byteSha256 = '0'.repeat(64) } },
  { id: 'promote_cross_page_semantic_authority', mutate: value => { value.bindingMatrix.coverage.semanticAuthorityCount = 1 } },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v10-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
