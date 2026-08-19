import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
  SOURCE_ZJLIB_36_3,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v9.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v9.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const source = value => value.sourceLineage.addedSources.find(item => item.sourceId === SOURCE_ZJLIB_36_3)
const observation = value => value.observations.find(item => item.observationId === 'obs-youyi-zjlib-p85-p86-direct-lithographic-palace-order')

const mutations = [
  { id: 'promote_variant_independent_witness', mutate: value => { source(value).independentPhysicalWitness = true } },
  { id: 'change_variant_pdf_hash', mutate: value => { source(value).sourcePdfSha256 = '0'.repeat(64) } },
  { id: 'invent_1871_variant_edition', mutate: value => { source(value).edition = '1871 original impression' } },
  { id: 'close_variant_block_lineage', mutate: value => { value.lineageAssessment.lithographicVariantComparison.blockOrColophonIdentityClosed = true } },
  { id: 'claim_variant_1871_relation', mutate: value => { value.lineageAssessment.lithographicVariantComparison.relationTo1871Closed = true } },
  { id: 'claim_variant_physical_slot', mutate: value => { observation(value).doesNotEstablish = observation(value).doesNotEstablish.filter(item => item !== 'palace_name_to_physical_chart_slot') } },
  { id: 'inflate_named_witness_count', mutate: value => { value.bindingMatrix.coverage.directNamedPalaceWitnessCount = 5 } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.coverage.productionOrdinalBindingCount = 1 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 21 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'promote_source_authority', mutate: value => { value.scope.sourceAuthorityPromoted = true } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
  { id: 'change_protected_asset_hash', mutate: value => { value.preservation.protectedAsset.byteSha256 = '0'.repeat(64) } },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v9-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
