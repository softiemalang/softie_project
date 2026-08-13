import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v7.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v7.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v7-negative-'))
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
const lead = (value, id) => value.researchFrontier.acquisitionLeads.find(item => item.leadId === id)

const mutations = [
  { id: 'admit_1902_catalog_candidate', mutate: value => { candidate(value, 'candidate-youyi-lu-cinii-ba85312898-1902-catalog-only').doesNotEnterGraph = false } },
  { id: 'promote_1902_page_images', mutate: value => { candidate(value, 'candidate-youyi-lu-cinii-ba85312898-1902-catalog-only').locators.pageImagesLocated = true } },
  { id: 'invent_1902_publication_date', mutate: value => { candidate(value, 'candidate-youyi-lu-cinii-ba85312898-1902-catalog-only').sourceIdentity.publicationDate = '同治10 [1871]' } },
  { id: 'admit_1897_catalog_candidate', mutate: value => { candidate(value, 'candidate-youyi-lu-cinii-ba90448039-1897-catalog-only').doesNotEnterGraph = false } },
  { id: 'promote_1897_source_bytes', mutate: value => { candidate(value, 'candidate-youyi-lu-cinii-ba90448039-1897-catalog-only').locators.sourceBytesAcquired = true } },
  { id: 'promote_1882_pid_route', mutate: value => { candidate(value, 'candidate-chunzaitang-ndl-1882-catalog-only').locators.pidRouteLocated = true } },
  { id: 'promote_1882_page_image', mutate: value => { candidate(value, 'candidate-chunzaitang-ndl-1882-catalog-only').locators.imageAvailable = true } },
  { id: 'claim_catalog_text_comparison', mutate: value => { value.researchFrontier.catalogFormatComparison.directTextComparisonPerformed = true } },
  { id: 'claim_catalog_block_lineage', mutate: value => { value.researchFrontier.catalogFormatComparison.blockLineageClosed = true } },
  { id: 'claim_1871_1883_byte_comparison', mutate: value => { value.researchFrontier.comparison1871To1883.directByteComparisonPerformed = true } },
  { id: 'admit_frontier_graph_claim', mutate: value => { value.researchFrontier.graphImpact.claimsAdded = 1 } },
  { id: 'admit_frontier_candidate_count', mutate: value => { value.scope.researchCandidatesAdmitted = 1 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 20 } },
  { id: 'promote_direct_single_witness', mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 1 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'promote_semantic_authority', mutate: value => { value.scope.semanticAuthorityPromoted = true } },
  { id: 'promote_ndl_lead_bytes', mutate: value => { lead(value, 'lead-ndl-chunzaitang-1882-catalog-no-pid').sourceBytesAcquired = true } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
  { id: 'change_catalog_format_field', mutate: value => { value.researchFrontier.catalogFormatComparison.source1871.size = '23.0x15.0cm' } },
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
