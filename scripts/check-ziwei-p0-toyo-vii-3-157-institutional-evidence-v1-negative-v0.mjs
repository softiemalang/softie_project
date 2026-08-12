import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  ROOT,
  materializeBundle,
} from './materialize-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'
import { checkArtifact } from './check-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'
import { SCHEMA } from './materialize-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-toyo-vii-3-157-negative-'))
  const completePath = resolve(directory, 'complete.json')
  try {
    await materializeBundle(completePath)
    const value = JSON.parse(await readFile(completePath, 'utf8'))
    mutation(value)
    const body = Buffer.from(canonicalJson(value))
    await writeFile(completePath, body)
    await writeFile(`${completePath}.integrity.json`, canonicalJson({
      schemaVersion: `${SCHEMA}-integrity-v0`,
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
  { id: 'report_as_second_physical_witness', mutate: value => { value.sourceLineage.addedSource.physicalWitnessStatus = 'new_independent_physical_witness' } },
  { id: 'duplicate_rows_as_two_items', mutate: value => { value.sourceLineage.catalogReconciliation.reportedPhysicalItemCount = 2 } },
  { id: 'inscription_quote_mutation', mutate: value => { value.observations[1].rawQuote = '金陵益軒唐謙梓 is confirmed original' } },
  { id: 'invented_leaf_locator', mutate: value => { value.observations[1].locator = '巻頭に続く編著者事項; 丁12' } },
  { id: 'researcher_direct_observation_promotion', mutate: value => { value.observations[1].researcherDirectObservation = true } },
  { id: 'semantic_authority_promotion', mutate: value => { value.sourceLineage.semanticAuthority = 'established' } },
  { id: 'claim_link_promotion', mutate: value => { value.relations[0].claimIds = ['claim-palace-name-branch-ordinal'] } },
  { id: 'source_identity_blocker_closure', mutate: value => { value.graphImpact.blockersClosed = ['blocker-source-identity-unresolved'] } },
  { id: 'claim_status_promotion', mutate: value => { value.claimReconciliation[0].successorStatus = 'stable_claim' } },
  { id: 'graph_source_count_mutation', mutate: value => { value.graphImpact.successor.sourceCount = 13 } },
  { id: 'field_kit_target_closure', mutate: value => { value.fieldKitImpact.targetReassessment[0].statusAfter = 'closed' } },
  { id: 'rights_permission_shortcut', mutate: value => { value.relations[2].authority = 'image reuse permission granted' } },
  { id: 'protected_asset_mutation', mutate: value => { value.preservation.protectedAsset.byteSha256 = '0'.repeat(64) } },
  { id: 'generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
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
