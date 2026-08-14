import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  CANDIDATE_NLC_1607,
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v13.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v13-negative-'))
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

const results = []
for (const mutation of mutations) results.push({ id: mutation.id, ...(await mutateAndCheck(mutation.mutate)) })
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
