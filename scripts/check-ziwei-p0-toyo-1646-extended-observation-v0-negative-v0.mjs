import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import { SCHEMA, materializeBundle } from './materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs'
import { checkArtifact, ROOT } from './check-ziwei-p0-toyo-1646-extended-observation-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonical = value => `${JSON.stringify(value, null, 2)}\n`
const cacheDir = process.env.TOYO_1646_CACHE_DIR
if (!cacheDir) throw new Error('TOYO_1646_CACHE_DIR_REQUIRED')

async function mutateAndCheck(directory, mutation) {
  const completePath = resolve(directory, 'complete.json')
  await materializeBundle(completePath, { cacheDir })
  const value = JSON.parse(await readFile(completePath, 'utf8'))
  mutation.mutate(value)
  const body = Buffer.from(canonical(value))
  await writeFile(completePath, body)
  await writeFile(`${completePath}.integrity.json`, canonical({ schemaVersion: SCHEMA, path: relative(ROOT, completePath), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }))
  const errors = checkArtifact(ROOT, completePath, { cacheDir })
  return { rejected: errors.length > 0, errors }
}

const mutations = [
  { id: 'semantic_authority_promotion', mutate: value => { value.sourceAssessment.semanticAuthority = 'established' } },
  { id: 'independent_witness_admission', mutate: value => { value.sourceAssessment.afterReviewIndependence = 'independent_witness_admitted' } },
  { id: 'source_image_git_storage', mutate: value => { value.preservation.sourceImagesStoredInGit = true } },
  { id: 'cache_hash_mutation', mutate: value => { value.externalEvidence.reviewedFiles[0].byteSha256 = '0'.repeat(64) } },
  { id: 'invented_printed_folio', mutate: value => { value.observations[0].printedFolio = 'leaf 2 / printed folio unresolved' } },
  { id: 'ocr_canonical_promotion', mutate: value => { value.observations[0].transcriptionRole = 'canonical' } },
  { id: 'blocker_closure', mutate: value => { value.impact.blockersClosed = ['blocker-palace-semantic-identity'] } },
  { id: 'readiness_promotion', mutate: value => { value.impact.readiness = 'ready' } },
  { id: 'predecessor_boundary_damage', mutate: value => { value.impact.predecessorCoverage.observationCount = 34 } },
  { id: 'generated_timestamp', mutate: value => { value.deterministicContract.generatedAt = new Date().toISOString() } },
]

const results = []
for (const mutation of mutations) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-toyo-extended-negative-'))
  results.push({ id: mutation.id, ...(await mutateAndCheck(directory, mutation)) })
}
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
