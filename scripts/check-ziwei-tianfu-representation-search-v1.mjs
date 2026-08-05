import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildArtifact, BASIS_HEAD, canonicalJson, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-tianfu-representation-search-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export async function checkRepresentationSearchArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const expectedBundle = await buildArtifact(); const expected = expectedBundle.artifact; const errors = []
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (candidate.verdictToken !== 'equivalent_representation_proven') errors.push('verdict_boundary')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental') errors.push('readiness_boundary')
  if (candidate.boundaries?.productionModified !== false || candidate.boundaries?.ruleContractModified !== false || candidate.boundaries?.existingArtifactsModified !== false || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.sourceConflictHidden !== false) errors.push('mutation_boundary')
  if (candidate.sourceEvidence?.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.sourceEvidence?.transcription?.sourceImagesAreCanonical !== true) errors.push('ocr_boundary')
  if (candidate.sourceEvidence?.sourceIdentity?.ming?.sha256 !== '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc' || candidate.sourceEvidence?.sourceIdentity?.nanbei?.sha256 !== '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023') errors.push('source_hash')
  const mingDiagram = candidate.sourceEvidence?.transcription?.ming?.locators?.find(locator => locator.pdfPage === 172 && locator.section === '安天府圖')
  const nanbeiTable = candidate.sourceEvidence?.transcription?.nanbei?.locator
  if (mingDiagram?.status !== 'source-rule anchors visually closed; connector lines retained as diagram evidence and not flattened into fabricated cells' || JSON.stringify(mingDiagram?.visualReview?.dpi) !== JSON.stringify([420, 600]) || mingDiagram?.diagram?.branchRing?.join('') !== '巳午未申酉戌亥子丑寅卯辰' || mingDiagram?.diagram?.anchors?.explicit?.ziwei !== '丑' || mingDiagram?.diagram?.anchors?.explicit?.tianfu !== '卯' || JSON.stringify(mingDiagram?.diagram?.anchors?.samePalaces) !== JSON.stringify(['寅', '申']) || JSON.stringify(nanbeiTable?.visualReview?.dpi) !== JSON.stringify([420])) errors.push('source_rule_visual_review_or_proof')
  if (candidate.correction?.changedRowCount !== 10 || candidate.correction?.unchangedRowCount !== 2 || candidate.correction?.predecessorPreserved !== true) errors.push('correction_counts')
  if (candidate.predecessor?.integratedBaseline?.matchCount !== 25 || candidate.predecessor?.integratedBaseline?.mismatchCount !== 125 || candidate.predecessor?.integratedBaseline?.firstMismatch !== 'integrated-bureau-2-day-01') errors.push('predecessor_baseline')
  if (candidate.search?.candidateCount !== 696 || candidate.search?.rowCount !== 150 || candidate.search?.exactFitIds?.includes('affine-same-rotation-06') !== true) errors.push('search_coverage_or_exact_fit')
  if (candidate.search?.sourceDirectionProof?.rotation06ResidualCount !== 0) errors.push('rotation06_residual')
  if (candidate.rows?.length !== 150 || candidate.rows?.some(row => row.rotation06Equality !== true)) errors.push('row_coverage_or_rotation06')
  if (candidate.boundaries?.semanticCrossEditionIdentity !== 'equivalent_representation_proven') errors.push('semantic_boundary')
  if (candidate.subverdicts?.predecessorTranscription !== 'transcription_defect_resolved' || candidate.subverdicts?.nanbeiVsProduction !== 'equivalent_representation_proven' || candidate.subverdicts?.mingVsNanbei !== 'equivalent_representation_proven' || candidate.subverdicts?.overall !== 'equivalent_representation_proven') errors.push('subverdict_boundary')
  if (candidate.implementationImpact?.changed !== false || (candidate.implementationImpact?.filesChanged?.length ?? -1) !== 0) errors.push('implementation_impact')
  if (canonicalJson(candidate.sourceEvidence) !== canonicalJson(expected.sourceEvidence) || canonicalJson(candidate.correction) !== canonicalJson(expected.correction) || canonicalJson(candidate.predecessor) !== canonicalJson(expected.predecessor) || canonicalJson(candidate.search) !== canonicalJson(expected.search) || canonicalJson(candidate.rows) !== canonicalJson(expected.rows) || canonicalJson(candidate.artifactHashes) !== canonicalJson(expected.artifactHashes)) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const candidate = JSON.parse(await readFile(path, 'utf8'))
  const failures = await checkRepresentationSearchArtifact(candidate)
  console.log(JSON.stringify({ pass: failures.length === 0, verdict: candidate.verdictToken, candidateCount: candidate.search?.candidateCount, exactFitIds: candidate.search?.exactFitIds, failures }, null, 2))
  if (failures.length) process.exitCode = 1
}
