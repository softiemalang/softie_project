import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v8.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v8.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v8-negative-'))
  const completePath = resolve(directory, 'complete.json')
  try {
    await materializeBundle(completePath, { mode: 'historical_reference' })
    const value = JSON.parse(await readFile(completePath, 'utf8'))
    mutation(value)
    const body = Buffer.from(canonicalJson(value))
    await writeFile(completePath, body)
    await writeFile(completePath + '.integrity.json', canonicalJson({
      schemaVersion: SCHEMA + '-integrity-v0',
      path: relative(ROOT, completePath),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
    const errors = checkArtifact(ROOT, completePath)
    return { rejected: errors.length > 0, errors }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const candidate = (value, id) => value.researchFrontier.candidates.find(item => item.candidateId === id)
const observation = value => value.researchFrontier.frontierOnlyObservations[0]
const lead = (value, id) => value.researchFrontier.acquisitionLeads.find(item => item.leadId === id)

const mutations = [
  { id: 'admit_figure_candidate', mutate: value => { candidate(value, 'candidate-nlc-jamise-collection-kol200200680-figure-only').doesNotEnterGraph = false } },
  { id: 'promote_figure_full_source_bytes', mutate: value => { candidate(value, 'candidate-nlc-jamise-collection-kol200200680-figure-only').locators.fullSourceBytesAcquired = true } },
  { id: 'change_figure_hash', mutate: value => { candidate(value, 'candidate-nlc-jamise-collection-kol200200680-figure-only').locators.figureByteSha256 = '0'.repeat(64) } },
  { id: 'claim_figure_palace_names', mutate: value => { candidate(value, 'candidate-nlc-jamise-collection-kol200200680-figure-only').bindingBoundary.palaceName.directlyBound = true } },
  { id: 'claim_figure_branch_slot_binding', mutate: value => { observation(value).fourFieldBinding.branchToken = 'bound' } },
  { id: 'claim_figure_full_binding', mutate: value => { observation(value).fourFieldBinding.fullBindingObserved = true } },
  { id: 'promote_1870_lead_bytes', mutate: value => { lead(value, 'lead-shiba-feixing-1870-hanyang-secondary-record-only').sourceBytesAcquired = true } },
  { id: 'promote_1870_independence', mutate: value => { lead(value, 'lead-shiba-feixing-1870-hanyang-secondary-record-only').doesNotEnterGraph = false } },
  { id: 'claim_1870_direct_review', mutate: value => { lead(value, 'lead-shiba-feixing-1870-hanyang-secondary-record-only').directPageReview = true } },
  { id: 'admit_frontier_observation', mutate: value => { value.researchFrontier.graphImpact.observationsAdded = ['frontier-obs-nlc-jamise-figure-only-circular-diagram'] } },
  { id: 'change_frontier_candidate_count', mutate: value => { value.scope.heldOutResearchCandidateCount = 11 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 20 } },
  { id: 'promote_direct_single_witness', mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 1 } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.coverage.productionOrdinalBindingCount = 1 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'promote_semantic_authority', mutate: value => { value.scope.semanticAuthorityPromoted = true } },
  { id: 'claim_1871_direct_comparison', mutate: value => { value.researchFrontier.comparison1871To1883.directByteComparisonPerformed = true } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
  { id: 'change_protected_asset_hash', mutate: value => { value.preservation.protectedAsset.byteSha256 = '0'.repeat(64) } },
]

const results = []
for (const mutation of mutations) results.push({ id: mutation.id, ...(await mutateAndCheck(mutation.mutate)) })
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({
  schemaVersion: SCHEMA,
  mutationCount: results.length,
  allRejected: failed.length === 0,
  results,
}, null, 2))
if (failed.length) process.exitCode = 1
