import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v2.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-negative-'))
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
  {
    id: 'promote_direct_single_witness',
    mutate: value => { value.bindingMatrix.coverage.directSingleWitnessFullBindingCount = 12 },
  },
  {
    id: 'promote_production_ordinal',
    mutate: value => { value.bindingMatrix.anchorRows[0].productionOrdinal = 0 },
  },
  {
    id: 'promote_semantic_authority',
    mutate: value => { value.bindingMatrix.composition.status = 'semantic_authority_established' },
  },
  {
    id: 'make_secondary_canonical',
    mutate: value => { value.evidence.observations.find(item => item.observationId === 'obs-pchome-secondary-anchor-clarification').canonicalForClaims = true },
  },
  {
    id: 'admit_secondary_as_independent',
    mutate: value => { value.lineageAssessment.secondaryClarification.independentHistoricalAuthority = true },
  },
  {
    id: 'infer_1871_textual_lineage',
    mutate: value => { value.lineageAssessment.earlierEdition1871.directTextComparisonPerformed = true },
  },
  {
    id: 'close_palace_blocker',
    mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] },
  },
  {
    id: 'mutate_branch_join',
    mutate: value => { value.bindingMatrix.anchorRows[1].branchToken = '巳' },
  },
  {
    id: 'mutate_nanbei_hash',
    mutate: value => { value.bindingMatrix.sourceBranchRing.pdfSha256 = '0'.repeat(64) },
  },
  {
    id: 'inflate_graph_source_count',
    mutate: value => { value.graphImpact.successor.sourceCount = 18 },
  },
  {
    id: 'promote_claim',
    mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' },
  },
  {
    id: 'add_generated_timestamp',
    mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() },
  },
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
