import {
  CANDIDATE_NLC_1607,
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v13.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const frontier = value => value.lineageAssessment.researchFrontier
const candidate = value => frontier(value).candidates.find(item => item.candidateId === CANDIDATE_NLC_1607)

const mutations = [
  { id: 'promote_nlc_source', mutate: value => { candidate(value).sourceIdentity.sourceAuthority = 'authoritative' } },
  { id: 'erase_nlc_official_bytes', mutate: value => { candidate(value).lineage.officialPdfBytesAcquired = false } },
  { id: 'erase_nlc_derivative_equality', mutate: value => { candidate(value).lineage.derivativeToOfficialByteEqualityEstablished = false } },
  { id: 'promote_nlc_independent', mutate: value => { candidate(value).lineage.independentPhysicalWitness = true } },
  { id: 'promote_nlc_palace_slot', mutate: value => { candidate(value).bindingMatrix.physicalSlot = 'production_slot' } },
  { id: 'promote_nlc_ordinal', mutate: value => { candidate(value).bindingMatrix.productionOrdinal = true } },
  { id: 'promote_nlc_full_binding', mutate: value => { candidate(value).bindingMatrix.fullBinding = true } },
  { id: 'admit_nlc_source', mutate: value => { value.graphImpact.sourcesAdded.push(CANDIDATE_NLC_1607) } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 22 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'erase_official_pdf_evidence', mutate: value => { value.evidence.v13Nlc1607Review.officialPdfBytesAcquired = false } },
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
  tempPrefix: 'ziwei-palace-composition-v13-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
