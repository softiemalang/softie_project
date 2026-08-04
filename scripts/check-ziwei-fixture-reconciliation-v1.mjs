import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { SCHEMA_VERSION, BASIS_HEAD, VERDICT_TOKEN, MATERIALIZER_VERSION } from './materialize-ziwei-fixture-reconciliation-v1.mjs'

const path = resolve(process.argv[2] || 'artifacts/ziwei-fixture-reconciliation-v1/complete.json')
const root = resolve(new URL('..', import.meta.url).pathname)
const artifact = JSON.parse(await readFile(path, 'utf8'))
const failures = []
if (artifact.schemaVersion !== SCHEMA_VERSION) failures.push('schema_version')
if (artifact.basisHead !== BASIS_HEAD || artifact.observedHead !== BASIS_HEAD) failures.push('basis_head')
if (artifact.verdictToken !== VERDICT_TOKEN) failures.push('verdict_token')
failures.push(...checkArtifactIdentity(artifact, {
  root,
  artifactId: SCHEMA_VERSION,
  materializerPath: 'scripts/materialize-ziwei-fixture-reconciliation-v1.mjs',
  materializerVersion: MATERIALIZER_VERSION,
}))
if (artifact.fixtures?.length !== 6) failures.push('fixture_count')
if (artifact.beforeAfter?.after?.verified !== 0) failures.push('verified_fixture_promoted')
if (artifact.beforeAfter?.after?.pending !== 6) failures.push('pending_count_changed')
if (artifact.claimBoundaryImpact?.claimProvenance !== 'blocked') failures.push('claim_provenance_unblocked')
for (const fixture of artifact.fixtures || []) {
  if (!fixture.fixtureId || !fixture.source?.declared?.urlOrReference) failures.push(`identity_missing:${fixture.fixtureId || 'unknown'}`)
  if (fixture.source?.retrieval?.originalBytesPreserved === true && !fixture.source.retrieval.byteSha256) failures.push(`preserved_without_hash:${fixture.fixtureId}`)
  if (!fixture.classification?.primary || !fixture.classification.independence?.assessment) failures.push(`classification_incomplete:${fixture.fixtureId}`)
  if (fixture.fixtureProvenance?.verifiedPromotion === true) failures.push(`verified_promotion:${fixture.fixtureId}`)
  if (fixture.scope?.fullChartValidationClaim === true) failures.push(`scope_expanded:${fixture.fixtureId}`)
}
const result = { pass: failures.length === 0, schemaVersion: artifact.schemaVersion, basisHead: artifact.basisHead, artifactByteSha256: createHash('sha256').update(await readFile(path)).digest('hex'), fixtureCount: artifact.fixtures?.length || 0, independentlyVerified: artifact.beforeAfter?.after?.independentlyVerified ?? null, failures }
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1
