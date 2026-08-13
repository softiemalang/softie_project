import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
} from './materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'
import { checkArtifact } from './check-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'
import { SCHEMA } from './materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-youyi-lu-negative-'))
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
    id: 'admit_independent_witness',
    mutate: value => { value.sourceLineage.addedSource.physicalWitnessStatus = 'independent_physical_witness_admitted' },
  },
  {
    id: 'promote_source_authority',
    mutate: value => { value.sourceLineage.addedSource.authority = 'source_authority_established' },
  },
  {
    id: 'make_ocr_canonical',
    mutate: value => { value.sourceLineage.addedSource.ocrPolicy.canonicalForClaims = true },
  },
  {
    id: 'mutate_direct_scan_text',
    mutate: value => { value.observations.find(item => item.observationId === 'obs-youyi-p139-tianfu-pair-map').rawVisibleText = '紫微丑天府巳' },
  },
  {
    id: 'invent_printed_folio',
    mutate: value => { value.observations.find(item => item.observationId === 'obs-youyi-p130-ming-shen-palace-order').locator.printedFolio = '丁12' },
  },
  {
    id: 'remove_direct_observation_boundary',
    mutate: value => { value.observations.find(item => item.observationId === 'obs-youyi-p140-major-star-series').researcherDirectObservation = false },
  },
  {
    id: 'mutate_source_djvu_hash',
    mutate: value => { value.sourceLineage.addedSource.sourceFile.sha256 = '0'.repeat(64) },
  },
  {
    id: 'infer_textual_lineage',
    mutate: value => { value.sourceLineage.addedSource.lineage = 'independent textual lineage confirmed' },
  },
  {
    id: 'promote_claim_status',
    mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' },
  },
  {
    id: 'promote_semantic_claim_support',
    mutate: value => { value.claimImpact.directSemanticClaimSupportAdded = ['claim-tianfu-placement'] },
  },
  {
    id: 'promote_rotation_semantics',
    mutate: value => { value.localComparison.tianfu.semanticIdentityStatus = 'established' },
  },
  {
    id: 'inflate_nanbei_tianfu_agreement',
    mutate: value => { value.localComparison.tianfu.referenceSurfaces.nanbeiAnTianfuTable.youyiMapMatchCount = 11 },
  },
  {
    id: 'mutate_relation_counts',
    mutate: value => { value.graphImpact.successor.relationCount = 139 },
  },
  {
    id: 'close_top_level_blocker',
    mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] },
  },
  {
    id: 'close_field_kit_target',
    mutate: value => { value.fieldKitImpact.targetReassessment[1].statusAfter = 'closed' },
  },
  {
    id: 'mutate_protected_asset',
    mutate: value => { value.preservation.protectedAsset.byteSha256 = '0'.repeat(64) },
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
