import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { checkArtifactIdentity, stableArtifactContentEqual } from '../src/artifactIdentity.js'
import { buildArtifact, BASIS_HEAD, canonicalJson, MATERIALIZER_VERSION, SCHEMA, VERDICT } from './materialize-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'))

export function checkBundle(candidate, expected) {
  const errors = []
  if (!candidate || candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT || candidate.basisHead !== BASIS_HEAD) errors.push('schema_or_basis')
  if (!stableArtifactContentEqual(candidate, expected)) errors.push('payload_not_reproducible')
  const rows = candidate.concordance?.rows || []
  const pages = rows.map(row => row.localPdfPage).filter(Number.isInteger).sort((a, b) => a - b)
  if (pages.length !== 528 || pages.some((page, index) => page !== index + 1)) errors.push('local_page_coverage')
  if (new Set(rows.map(row => `${row.volumeId}:${row.leafOrdinal}:${row.side}`)).size !== rows.length) errors.push('duplicate_nara_side_mapping')
  if (candidate.concordance?.localPdfPageCount !== 528 || candidate.concordance?.naraSideCount !== 532 || candidate.concordance?.omittedSideCount !== 4) errors.push('concordance_counts')
  const expectedRelations = { exact_same_leaf: 0, same_text_different_capture: 522, probable_correspondence: 6, unresolved: 4 }
  for (const [relation, count] of Object.entries(expectedRelations)) if (candidate.concordance?.relationCounts?.[relation] !== count) errors.push(`relation_count:${relation}`)
  if (candidate.manifests?.volumes?.some(volume => volume.entries?.length !== volume.leafCount || volume.entries.some((entry, index) => entry.stableIndex !== index || entry.leafOrdinal !== index + 1 || entry.canvasWidth !== 6300 || entry.canvasHeight !== 4750))) errors.push('manifest_index_shape')
  if (candidate.captureReview?.allLeafsReviewed !== true || candidate.captureReview?.reviewedLeafCount !== 266 || candidate.captureReview?.nativeSamples?.some(sample => sample.review !== 'direct_visual_native_max' || sample.dimensions?.width !== 3000 || sample.dimensions?.height !== 2262)) errors.push('capture_review_boundary')
  if (candidate.semanticWitness?.status !== 'blocked_semantic_identity_insufficient' || candidate.semanticWitness?.completeBindingCount !== 0 || candidate.semanticWitness?.requiredBindingCount !== 12) errors.push('semantic_identity_promoted')
  if (candidate.semanticWitness?.representationRelations?.rotation06?.status !== 'representation_only' || candidate.semanticWitness?.representationRelations?.rotation06?.semanticAuthority !== false || candidate.semanticWitness?.representationRelations?.sourceBaseDirection?.semanticAuthority !== false) errors.push('numeric_relation_promoted')
  if (candidate.semanticWitness?.lineage?.independentWitness !== false || candidate.semanticWitness?.lineage?.sameRecord !== true || candidate.semanticWitness?.lineage?.sameEditionVolumePair !== true) errors.push('same_record_boundary')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.productionRuleModified !== false || candidate.boundaries?.publicContractModified !== false || candidate.boundaries?.readinessModified !== false || candidate.boundaries?.productionModified !== false || candidate.boundaries?.existingArtifactsModified !== false || candidate.boundaries?.existingRouteModified !== false || candidate.boundaries?.imagesStoredInGit !== false || candidate.boundaries?.pdfStoredInGit !== false || candidate.boundaries?.contractMutation !== false) errors.push('mutation_or_readiness_boundary')
  errors.push(...checkArtifactIdentity(candidate, { root: ROOT, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION, allowGenerationBaseInput: true, allowVerifierInputDrift: true }))
  return [...new Set(errors)]
}

export async function checkArtifact(path = `artifacts/${SCHEMA}/complete.json`) {
  const absolute = resolve(ROOT, path); const candidate = JSON.parse(await readFile(absolute, 'utf8')); const expected = await buildArtifact(); const errors = checkBundle(candidate, expected)
  const body = readFileSync(absolute); const sidecar = parse(`${path}.integrity.json`)
  if (sidecar.artifactByteSha256 !== sha256(body)) errors.push('complete_integrity_sidecar')
  const dir = dirname(absolute)
  for (const name of ['manifest-index.json', 'concordance.json', 'semantic-observations.json', 'relation-graph.json']) {
    const filePath = resolve(dir, name); const bytes = readFileSync(filePath); const side = JSON.parse(readFileSync(`${filePath}.integrity.json`, 'utf8'))
    if (side.artifactByteSha256 !== sha256(bytes)) errors.push(`auxiliary_integrity:${name}`)
  }
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = process.argv[2] || `artifacts/${SCHEMA}/complete.json`; const errors = await checkArtifact(path)
  console.log(JSON.stringify({ schema: SCHEMA, pass: errors.length === 0, errors }, null, 2)); if (errors.length) process.exitCode = 1
}
