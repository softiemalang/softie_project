import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v6.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v6.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v6-negative-'))
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

const mutations = [
  { id: 'admit_nara_candidate', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nara-')).doesNotEnterGraph = false } },
  { id: 'promote_nara_full_binding', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nara-')).negativeBoundary.singleSourceFourFieldBinding = true } },
  { id: 'change_nara_image_hash', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nara-')).locators.reviewedImages[0].byteSha256 = '0'.repeat(64) } },
  { id: 'admit_ritsumeikan_candidate', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('ritsumeikan-')).doesNotEnterGraph = false } },
  { id: 'promote_ritsumeikan_pages', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('ritsumeikan-')).locators.pageImagesLocated = true } },
  { id: 'promote_ndl_page_bytes', mutate: value => { value.researchFrontier.acquisitionLeads.find(item => item.leadId === 'lead-ndl-youyi-lu-manuscript-2606209').pageBytesAcquired = true } },
  { id: 'claim_1871_textual_comparison', mutate: value => { value.researchFrontier.comparison1871To1883.directTextComparisonPerformed = true } },
  { id: 'admit_frontier_candidate_count', mutate: value => { value.scope.researchCandidatesAdmitted = 1 } },
  { id: 'add_frontier_graph_claim', mutate: value => { value.researchFrontier.graphImpact.claimsAdded = 1 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 20 } },
  { id: 'promote_direct_single_witness', mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 1 } },
  { id: 'close_palace_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
  { id: 'promote_semantic_authority', mutate: value => { value.scope.semanticAuthorityPromoted = true } },
  { id: 'admit_nagoya_candidate', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nagoya-')).doesNotEnterGraph = false } },
  { id: 'invent_nagoya_1871_date', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nagoya-')).sourceIdentity.publicationDate = '同治10 [1871]' } },
  { id: 'invent_nagoya_page_image', mutate: value => { value.researchFrontier.candidates.find(item => item.candidateId.includes('nagoya-')).locators.imageAvailable = true } },
  { id: 'promote_nagoya_lead_bytes', mutate: value => { value.researchFrontier.acquisitionLeads.find(item => item.leadId.includes('nagoya-')).pageBytesAcquired = true } },
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
