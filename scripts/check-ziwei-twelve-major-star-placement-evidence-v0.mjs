import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { TARGET_STARS } from '../src/ziwei/twelveMajorStarPlacementEvidence.js'
import { BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA, buildArtifact, canonicalJson } from './materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expected = await buildArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_twelve_major_star_placement_evidence_without_promotion') errors.push('identity_or_verdict')
  if (candidate.source?.editions?.mingNanyang?.actualSha256 !== '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc' || candidate.source?.editions?.nanbeishanren?.actualSha256 !== '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023') errors.push('pdf_identity')
  if (candidate.source?.editions?.mingNanyang?.pageCount !== 528 || candidate.source?.editions?.nanbeishanren?.pageCount !== 219 || candidate.source?.editions?.mingNanyang?.encrypted || candidate.source?.editions?.nanbeishanren?.encrypted) errors.push('pdf_metadata')
  if (candidate.source?.screening?.mingNanyang?.pagesScreened !== 528 || candidate.source?.screening?.nanbeishanren?.pagesScreened !== 219 || candidate.source?.coverage?.directVisualConfirmation !== true) errors.push('locator_coverage')
  if (candidate.normalizedRuleTable?.length !== 12 || candidate.fixtureDomain?.rows !== 150 || candidate.fixtureDomain?.occurrenceCount !== 3600 || candidate.occurrences?.length !== 3600) errors.push('domain_or_occurrence_count')
  if (candidate.fixtureDomain?.occurrenceCountPerEdition !== 1800 || candidate.comparison?.bySeries?.ziwei?.rawMatchCount !== 750 || candidate.comparison?.bySeries?.tianfu?.rawMatchCount !== 0 || candidate.comparison?.bySeries?.tianfu?.normalizedMatchCount !== 1050) errors.push('aggregate_comparison')
  if (candidate.source?.rules?.ziweiSeriesRule?.normalized?.offsets?.lianzhen !== -8 || candidate.source?.rules?.tianfuSeriesRule?.normalized?.offsets?.pojun !== 10) errors.push('normalized_rule_table')
  if (candidate.transformationSearch?.globalTransformPolicy !== 'only transforms exact across all 150 fixture rows within a series; no per-case correction' || !candidate.transformationSearch?.axes?.rotations?.includes(6) || candidate.transformationSearch?.candidateCount !== 240) errors.push('transformation_space')
  for (const star of TARGET_STARS) { const item = candidate.comparison.byStar.find(row => row.starId === star.id); if (!item || item.testedOccurrences !== 300 || item.rawMatchCount !== (star.series === 'ziwei' ? 300 : 0) || item.normalizedMatchCount !== 300) errors.push(`star_summary:${star.id}`) }
  if (candidate.promotionBoundary?.productionCalculationChanged !== false || candidate.promotionBoundary?.sourcePromoted !== false || candidate.promotionBoundary?.semanticIdentity !== 'blocked_semantic_identity_insufficient') errors.push('promotion_boundary')
  if (candidate.occurrences.some(row => !row.source?.sourceRefs?.length || !row.production?.codeRefs?.length || row.editionId === undefined || row.starId === undefined)) errors.push('occurrence_provenance')
  const sourceIds = new Set(candidate.source.locatorInventory.map(row => row.id)); if (!candidate.occurrences.every(row => row.source.sourceRefs.every(ref => ref.startsWith('source.')))) errors.push('source_ref_shape'); if (!sourceIds.has('nb-p13-sanshisi-tianfu-root') || !sourceIds.has('ming-p148-series-rule')) errors.push('locator_refs')
  const comparable = value => { const copy = structuredClone(value); delete copy.artifactIdentity; delete copy.observedHead; return copy }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  for (const item of candidate.source.editions ? [] : []) errors.push(item)
  const identityErrors = checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION })
  errors.push(...identityErrors)
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const candidate = JSON.parse(await readFile(path, 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures, artifactByteSha256: sha256(await readFile(path)) }, null, 2)); if (failures.length) process.exitCode = 1 }
