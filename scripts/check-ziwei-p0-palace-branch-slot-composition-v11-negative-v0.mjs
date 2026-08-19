import {
  CANDIDATE_IA,
  CANDIDATE_JSG,
  CANDIDATE_NAOJ,
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v11.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const frontier = value => value.lineageAssessment.researchFrontier
const followup = value => frontier(value).sameRecordFollowups.find(item => item.candidateId === CANDIDATE_NAOJ)
const candidate = (value, id) => frontier(value).candidates.find(item => item.candidateId === id)

const mutations = [
  { id: 'promote_naoj_same_record_independent', mutate: value => { followup(value).independentPhysicalWitness = true } },
  { id: 'erase_naoj_same_record_lineage', mutate: value => { followup(value).sameRecordAsV10Nara = false } },
  { id: 'promote_naoj_rule_to_production_ordinal', mutate: value => { followup(value).bindingMatrix.ordinalDirection = 'production_ordinal' } },
  { id: 'promote_naoj_full_binding', mutate: value => { followup(value).bindingMatrix.fullBinding = true } },
  { id: 'promote_jsg_known_1871_date', mutate: value => { candidate(value, CANDIDATE_JSG).sourceIdentity.publicationDate = '1871' } },
  { id: 'promote_jsg_full_binding', mutate: value => { candidate(value, CANDIDATE_JSG).bindingMatrix.fullBinding = true } },
  { id: 'promote_ia_independent_witness', mutate: value => { candidate(value, CANDIDATE_IA).lineage.independentPhysicalWitness = true } },
  { id: 'invent_ia_original_pdf_sha256', mutate: value => { candidate(value, CANDIDATE_IA).locators.originalPdfSha256 = '0'.repeat(64) } },
  { id: 'promote_ia_full_binding', mutate: value => { candidate(value, CANDIDATE_IA).bindingMatrix.fullBinding = true } },
  { id: 'admit_frontier_source', mutate: value => { value.graphImpact.sourcesAdded.push(CANDIDATE_JSG) } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 22 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'claim_1871_page_bytes', mutate: value => { value.evidence.earlierEdition1871Recheck.pageBytesObtained = true } },
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
  tempPrefix: 'ziwei-palace-composition-v11-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
