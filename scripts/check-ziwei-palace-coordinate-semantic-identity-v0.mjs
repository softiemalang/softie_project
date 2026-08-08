import { createHash } from 'node:crypto'
import { readFile, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildArtifact, canonicalJson, BASIS_HEAD, MATERIALIZER_VERSION, SCHEMA } from './materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

const PDF = resolvePdfSourcePathSync('nanbei_quanbao_219p')
const PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const comparable = value => { const copy = structuredClone(value); delete copy.observedHead; delete copy.artifactIdentity; return copy }

export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const errors = []
  let expected
  try { expected = await buildArtifact({ observedHead: candidate.observedHead }) } catch (error) { errors.push(`observed_head_provenance:${error.message}`); return [...new Set(errors)] }
  if (candidate.schemaVersion !== SCHEMA || candidate.basisHead !== BASIS_HEAD || candidate.verdictToken !== 'complete_ziwei_palace_coordinate_semantic_identity_evidence_uncommitted') errors.push('identity_or_verdict')
  if (candidate.sourceWitnessIndex?.source?.pages !== 219 || candidate.sourceWitnessIndex.source.sha256 !== PDF_SHA256 || candidate.sourceWitnessIndex.source.actualBytesVerified !== true) errors.push('source_identity')
  if ((candidate.sourceWitnessIndex?.sourceRefs || []).length !== 5 || candidate.sourceWitnessIndex.sourceRefs.some(ref => !Number.isInteger(ref.page) || !ref.region?.bboxPx || ref.pdf?.sha256 !== PDF_SHA256)) errors.push('source_ref_page_region')
  if (candidate.sourceWitnessIndex?.priorScreening?.screenedPages !== 219 || candidate.sourceWitnessIndex.priorScreening.screeningModified !== false) errors.push('screening_boundary')
  if (candidate.repositoryConventionInventory?.length !== 10 || candidate.repositoryConventionInventory.some(x => !x.path || !/^[0-9a-f]{64}$/.test(x.sha256))) errors.push('repository_inventory')
  if (candidate.candidateMatrix?.candidateCount !== 170 || candidate.candidateMatrix.relationResults?.length !== 170) errors.push('candidate_count')
  if (candidate.candidateMatrix?.domain?.rowCount !== 150 || candidate.rows?.length !== 150 || candidate.candidateMatrix.domain.bureaus.join(',') !== '2,3,4,5,6') errors.push('row_domain')
  if (!candidate.candidateMatrix.exactFitIds.includes('rotation-06') || !candidate.candidateMatrix.exactFitIds.includes('source-base-direction') || candidate.candidateMatrix.exactFitIds.includes('identity')) errors.push('candidate_elimination')
  const rotation = candidate.candidateMatrix.relationResults.find(x => x.candidateId === 'rotation-06')
  if (!rotation || rotation.matchCount !== 150 || rotation.mismatchCount !== 0 || rotation.firstDivergence !== null) errors.push('rotation06_result')
  if (candidate.rows.some(x => !x.contexts?.rawOrdinal || !x.contexts?.earthlyBranchLabel || !x.contexts?.diagramPosition || !x.contexts?.palaceName || !x.contexts?.sourceDirection || !x.contexts?.productionDirection)) errors.push('comparison_context')
  if (candidate.rows.some(x => x.source?.palaceName?.status !== 'unresolved_semantic_identity' || x.production?.palaceName?.status !== 'repository_convention_only')) errors.push('palace_name_boundary')
  if (candidate.claims?.length !== 4 || candidate.claims.find(x => x.id === 'semantic_identity')?.status !== 'blocked_semantic_identity_insufficient' || candidate.claims.find(x => x.id === 'exact_transform')?.status !== 'exact_transform_only') errors.push('claim_ledger_boundary')
  const nodeSet = new Set(candidate.relationGraph?.nodes || [])
  if (!candidate.relationGraph?.edges?.length || candidate.relationGraph.edges.some(x => !nodeSet.has(x.from) || !nodeSet.has(x.to))) errors.push('relation_graph_orphan')
  if (candidate.blockerRegistry?.length !== 1 || candidate.blockerRegistry[0]?.id !== 'blocker-palace-semantic-identity' || candidate.blockerRegistry[0]?.status !== 'blocked') errors.push('blocker_registry')
  if (candidate.readinessImpact?.stableClaimCount !== 0 || candidate.readinessImpact?.readiness !== 'not_safe_to_start' || candidate.readinessImpact?.grounding !== 'blocked' || candidate.readinessImpact?.activation !== 'experimental' || candidate.readinessImpact.productionMutation || candidate.readinessImpact.contractMutation) errors.push('readiness_or_mutation')
  if (candidate.conclusions?.semanticStatus !== 'blocked_semantic_identity_insufficient') errors.push('semantic_verdict')
  try { if (sha256(readFileSync(PDF)) !== PDF_SHA256) errors.push('authoritative_pdf_hash') } catch { errors.push('authoritative_pdf_missing') }
  for (const item of candidate.immutableExistingBytes ?? []) { try { if (sha256(readFileSync(resolve(root, item.path))) !== item.sha256) errors.push(`immutable_existing:${item.path}`) } catch { errors.push(`immutable_missing:${item.path}`) } }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(expected))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const candidate = JSON.parse(await (await import('node:fs/promises')).readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8'))
  const failures = await checkArtifact(candidate)
  console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2))
  if (failures.length) process.exitCode = 1
}
