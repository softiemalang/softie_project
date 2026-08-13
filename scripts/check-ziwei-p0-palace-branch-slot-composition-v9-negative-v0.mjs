import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
  SOURCE_ZJLIB_36_3,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v9.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v9.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v9-negative-'))
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

const source = value => value.sourceLineage.addedSources.find(item => item.sourceId === SOURCE_ZJLIB_36_3)
const observation = value => value.observations.find(item => item.observationId === 'obs-youyi-zjlib-p85-p86-direct-lithographic-palace-order')

const mutations = [
  { id: 'promote_variant_independent_witness', mutate: value => { source(value).independentPhysicalWitness = true } },
  { id: 'change_variant_pdf_hash', mutate: value => { source(value).sourcePdfSha256 = '0'.repeat(64) } },
  { id: 'invent_1871_variant_edition', mutate: value => { source(value).edition = '1871 original impression' } },
  { id: 'close_variant_block_lineage', mutate: value => { value.lineageAssessment.lithographicVariantComparison.blockOrColophonIdentityClosed = true } },
  { id: 'claim_variant_1871_relation', mutate: value => { value.lineageAssessment.lithographicVariantComparison.relationTo1871Closed = true } },
  { id: 'claim_variant_physical_slot', mutate: value => { observation(value).doesNotEstablish = observation(value).doesNotEstablish.filter(item => item !== 'palace_name_to_physical_chart_slot') } },
  { id: 'inflate_named_witness_count', mutate: value => { value.bindingMatrix.coverage.directNamedPalaceWitnessCount = 5 } },
  { id: 'promote_production_ordinal', mutate: value => { value.bindingMatrix.coverage.productionOrdinalBindingCount = 1 } },
  { id: 'inflate_successor_graph_count', mutate: value => { value.graphImpact.successor.sourceCount = 21 } },
  { id: 'close_semantic_blocker', mutate: value => { value.graphImpact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'promote_readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'promote_source_authority', mutate: value => { value.scope.sourceAuthorityPromoted = true } },
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
