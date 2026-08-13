import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

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

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v11-negative-'))
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
