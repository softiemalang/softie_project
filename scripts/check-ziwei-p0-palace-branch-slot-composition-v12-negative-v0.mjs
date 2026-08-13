import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  CANDIDATE_NDL_FALSE_POSITIVE,
  CANDIDATE_SSID,
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v12.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v12-negative-'))
  const completePath = resolve(directory, 'complete.json')
  try {
    await materializeBundle(completePath, { mode: 'historical_reference' })
    const value = JSON.parse(await readFile(completePath, 'utf8'))
    mutation(value)
    const body = Buffer.from(canonicalJson(value))
    await writeFile(completePath, body)
    await writeFile(completePath + '.integrity.json', canonicalJson({ schemaVersion: SCHEMA + '-integrity-v0', path: relative(ROOT, completePath), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }))
    const errors = checkArtifact(ROOT, completePath)
    return { rejected: errors.length > 0, errors }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

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

const results = []
for (const mutation of mutations) results.push({ id: mutation.id, ...(await mutateAndCheck(mutation.mutate)) })
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
