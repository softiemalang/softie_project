import { createHash } from 'node:crypto'
import { readFile, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-tianfu-convention-provenance-v0.mjs'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_tianfu_convention_provenance_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.provenance?.history?.length !== 2 || candidate.provenance.history[0].commit !== '7d2fb8fccc65ab34efea93ea2d16f94fb526417c' || candidate.provenance.history[1].commit !== '1b30485389c3ffd1e65751220d2b7ac7db6000fd') errors.push('git_history')
  if (candidate.provenance?.absenceOfAuthority?.sourceCitationInGit !== undefined || candidate.provenance?.absenceOfAuthority?.sourcePageCitationInGit !== false || candidate.provenance?.absenceOfAuthority?.palaceCoordinateConventionCitationInGit !== false) errors.push('authority_boundary')
  if (candidate.model?.axes?.join('|') !== 'palaceIdentity|ordinal|traversalDirection|basePalace|rotation|labelMapping') errors.push('neutral_axes')
  if (candidate.comparison?.domain?.rowCount !== 150 || candidate.rows?.length !== 150 || candidate.comparison.domain.bureauDistribution['2'] !== 30 || Object.values(candidate.comparison.domain.dayDistribution).some(x => x !== 5)) errors.push('domain_coverage')
  if (candidate.comparison?.transformCoverage?.rotation06?.matchedRows !== 150 || candidate.comparison.transformCoverage.rotation06.residualRows !== 0 || candidate.comparison.classification.semanticEquivalence !== 'blocked_semantic_identity_insufficient') errors.push('transform_or_semantic_verdict')
  if (!candidate.comparison.exactFitIds.includes('rotation-06') || !candidate.comparison.exactFitIds.includes('source-base-direction') || candidate.comparison.exactFitIds.includes('identity')) errors.push('exact_fit_classification')
  if (candidate.claims?.stableClaimCount !== 0 || candidate.readinessImpact?.readiness !== 'not_safe_to_start' || candidate.readinessImpact?.grounding !== 'blocked' || candidate.readinessImpact?.activation !== 'experimental') errors.push('readiness_boundary')
  if (candidate.rows.some(x => x.source?.raw?.tianfuBranch !== x.source?.neutral?.outputPalace?.label || x.integrated?.raw?.tianfuBranch !== x.integrated?.neutral?.outputPalace?.label || x.palaceIdentity?.source?.status !== 'unresolved' || x.palaceIdentity?.integrated?.status !== 'unresolved')) errors.push('raw_neutral_or_identity_boundary')
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  const comparable = x => { const y = structuredClone(x); delete y.observedHead; delete y.artifactIdentity; return y }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate = JSON.parse(await (await import('node:fs/promises')).readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
