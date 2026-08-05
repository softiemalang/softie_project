import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-major-star-coordinate-provenance-v0.mjs'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_major_star_coordinate_provenance_readiness_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.inventory?.length !== 14 || candidate.coordinateConvention?.axes?.length !== 7) errors.push('inventory_or_axes')
  if (candidate.comparison?.domain?.rowCount !== 150 || candidate.comparison.roots.ziwei.rawMatchCount !== 150 || candidate.comparison.roots.tianfu.rotation06MatchCount !== 150 || candidate.comparison.roots.tianfu.rotation06ResidualCount !== 0) errors.push('coverage_or_relation')
  if (candidate.comparison.roots.tianfu.rawMismatchCount !== 150 || candidate.dependencyGraph.firstDivergence.rowId !== 'bureau-2-day-01') errors.push('raw_divergence')
  if (candidate.claims?.stableClaimCount !== 0 || candidate.readinessImpact?.readiness !== 'not_safe_to_start' || candidate.readinessImpact?.grounding !== 'blocked' || candidate.readinessImpact?.activation !== 'experimental') errors.push('readiness_boundary')
  if (candidate.inventory.filter(x => x.sourceRuleStatus === 'source_unresolved').length !== 12) errors.push('source_unresolved_boundary')
  if (candidate.coordinateConvention.source.palaceIdentity !== 'unresolved' || candidate.coordinateConvention.integrated.palaceIdentity !== 'unresolved') errors.push('semantic_identity_promoted')
  if (candidate.preservedBoundaries?.productionRuleModified || candidate.preservedBoundaries?.contractChanged || candidate.preservedBoundaries?.compatibilityAliasImplemented) errors.push('mutation_boundary')
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  const comparable = x => { const y = structuredClone(x); delete y.observedHead; delete y.artifactIdentity; return y }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate = JSON.parse(await readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
