import {
  CANDIDATE_NDL_FALSE_POSITIVE,
  CANDIDATE_SSID,
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v12.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const frontier = value => value.lineageAssessment.researchFrontier
const candidate = (value, id) => frontier(value).candidates.find(item => item.candidateId === id)

const mutations = [
  { id: 'promote_ssid_source', mutate: value => { candidate(value, CANDIDATE_SSID).sourceIdentity.sourceAuthority = 'authoritative' } },
  { id: 'promote_ssid_independent', mutate: value => { candidate(value, CANDIDATE_SSID).lineage.independentPhysicalWitness = true } },
  { id: 'promote_ssid_physical_slot', mutate: value => { candidate(value, CANDIDATE_SSID).bindingMatrix.physicalSlot = 'production_slot' } },
  { id: 'promote_ssid_ordinal', mutate: value => { candidate(value, CANDIDATE_SSID).bindingMatrix.ordinalDirection = 'production_ordinal' } },
  { id: 'promote_ssid_full_binding', mutate: value => { candidate(value, CANDIDATE_SSID).bindingMatrix.fullBinding = true } },
  { id: 'promote_tianyige_target', mutate: value => { candidate(value, 'candidate-tianyige-0017417-chunzaitang-retained-section').lineage.targetChapterPresent = true } },
  { id: 'promote_ndl_target_record', mutate: value => { candidate(value, CANDIDATE_NDL_FALSE_POSITIVE).sourceIdentity.targetNdlRecordMatch = true } },
  { id: 'promote_ndl_target_chapter', mutate: value => { candidate(value, CANDIDATE_NDL_FALSE_POSITIVE).lineage.targetChapterPresent = true } },
  { id: 'admit_ssid_source', mutate: value => { value.graphImpact.sourcesAdded.push(CANDIDATE_SSID) } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 22 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'claim_1871_bytes', mutate: value => { value.evidence.earlierEdition1871Recheck.pageBytesObtained = true } },
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
  tempPrefix: 'ziwei-palace-composition-v12-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
