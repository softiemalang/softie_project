import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'

import { ARTIFACT_DIR, materializeBundle } from './materialize-ziwei-p0-claim-source-identity-frontier-v1.mjs'
import { ROOT, checkArtifact } from './check-ziwei-p0-claim-source-identity-frontier-v1.mjs'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`

async function refresh(path, mutate) {
  const value = JSON.parse(await readFile(path, 'utf8'))
  mutate(value)
  const body = Buffer.from(canonical(value))
  await writeFile(path, body)
  const sidecar = { schemaVersion: 'ziwei-p0-claim-source-identity-frontier-v1', path: relative(ROOT, path), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }
  await writeFile(`${path}.integrity.json`, canonical(sidecar))
}

const mutations = [
  { id: 'stable_claim_promotion', file: 'complete.json', mutate: (value) => { value.claimBoundary.stableClaimCount = 1 } },
  { id: 'claim_source_identity_mutation', file: 'claim-source-matrix.json', mutate: (value) => { value[0].sourceIds[0] = 'src-google-books' } },
  { id: 'locator_provenance_damage', file: 'observations.json', mutate: (value) => { value.observations[0].locator = 'PDF p.999' } },
  { id: 'same_record_independent_promotion', file: 'source-lineage-inventory.json', mutate: (value) => { value.sources.find((item) => item.sourceId === 'src-nara-4468520').independence = 'independent' } },
  { id: 'ocr_canonical_promotion', file: 'observations.json', mutate: (value) => { value.observations[0].transcriptionRole = 'canonical' } },
  { id: 'rotation06_semantic_promotion', file: 'complete.json', mutate: (value) => { value.claimBoundary.rotation06 = 'semantic_authority' } },
  { id: 'source_image_git_promotion', file: 'source-lineage-inventory.json', mutate: (value) => { value.sources.find((item) => item.sourceId === 'src-toyo-1646').storedInGit = true } },
  { id: 'unsupported_claim_removed', file: 'claim-source-matrix.json', mutate: (value) => { value.splice(value.findIndex((item) => item.status === 'unsupported'), 1) } },
  { id: 'source_blocker_removed', file: 'blockers.json', mutate: (value) => { value.blockers = value.blockers.filter((item) => item.id !== 'blocker-source-identity-unresolved') } },
  { id: 'readiness_promoted', file: 'complete.json', mutate: (value) => { value.readinessImpact.readiness = 'ready' } },
]

const results = []
for (const mutation of mutations) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-p0-negative-'))
  const completePath = resolve(directory, 'complete.json')
  await materializeBundle(completePath)
  await refresh(resolve(directory, mutation.file), mutation.mutate)
  const errors = checkArtifact(ROOT, completePath)
  results.push({ id: mutation.id, rejected: errors.length > 0, errors })
}

const failed = results.filter((item) => !item.rejected)
console.log(JSON.stringify({ schemaVersion: 'ziwei-p0-claim-source-identity-frontier-v1', mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
