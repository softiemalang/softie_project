import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v3.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v3.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v3-negative-'))
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
    return { rejected: checkArtifact(ROOT, completePath).length > 0, errors: checkArtifact(ROOT, completePath) }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const mutations = [
  { id: 'promote_nlc_independence', mutate: value => { value.lineageAssessment.sameEditionComparison.independentLineageAdmitted = true } },
  { id: 'promote_zjlib_block_identity', mutate: value => { value.lineageAssessment.lateReprintComparison.blockOrColophonIdentityClosed = true } },
  { id: 'promote_direct_single_witness', mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 1 } },
  { id: 'promote_physical_slot', mutate: value => { value.bindingMatrix.directPalaceWitnesses[1].physicalSlotBound = true } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.anchorRows[0].productionOrdinal = 0 } },
  { id: 'promote_semantic_authority', mutate: value => { value.bindingMatrix.composition.status = 'semantic_authority_established' } },
  { id: 'close_palace_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'admit_candidate_to_graph', mutate: value => { value.evidence.candidateReview.candidates[0].doesNotEnterGraph = false } },
  { id: 'claim_1871_lineage_closed', mutate: value => { value.lineageAssessment.earlierEdition1871.textualLineageClosed = true } },
  { id: 'inflate_graph_source_count', mutate: value => { value.graphImpact.successor.sourceCount = 20 } },
  { id: 'promote_claim', mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' } },
  { id: 'add_generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
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
