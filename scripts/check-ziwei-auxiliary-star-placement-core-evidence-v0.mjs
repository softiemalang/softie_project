import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

import { checkArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, BASIS_HEAD, MATERIALIZER_PATH, MATERIALIZER_VERSION, SCHEMA, STAR_IDS, buildArtifact } from './materialize-ziwei-auxiliary-star-placement-core-evidence-v0.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const parse = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'))
const same = (a, b) => canonicalIdentityJson(a) === canonicalIdentityJson(b)
const stableArtifact = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const { observedHead, artifactIdentity, ...stable } = value
  return stable
}

function sourceRefSet(value) {
  const refs = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(visit)
    if (typeof node.sourceRef === 'string') refs.push(node.sourceRef)
    Object.values(node).forEach(visit)
  }
  visit(value)
  return refs.sort()
}

export function checkBundle(bundle, root = ROOT) {
  const expected = buildArtifact()
  const errors = []
  const artifact = bundle?.artifact
  const files = bundle?.files || {}
  if (!artifact || artifact.schemaVersion !== SCHEMA || artifact.basisHead !== BASIS_HEAD) errors.push('schema_or_basis_head')
  if (!['partial_ziwei_auxiliary_star_placement_evidence_with_explicit_blockers', 'complete_ziwei_auxiliary_star_placement_core_evidence_without_promotion'].includes(artifact?.verdict)) errors.push('verdict')
  if (artifact?.verdict !== expected.artifact.verdict) errors.push('verdict')
  if (!same(artifact?.targetStars?.map((item) => item.id), STAR_IDS)) errors.push('star_coverage')
  if (!same(artifact?.boundaries, expected.artifact.boundaries)) errors.push('promotion_boundary')
  if (!same(artifact?.sourceEvidence, expected.artifact.sourceEvidence)) errors.push('source_identity_or_ocr_boundary')
  if (!same(artifact?.occurrenceSummary, expected.artifact.occurrenceSummary)) errors.push('occurrence_summary')
  if (!same(artifact?.comparisonSummary, expected.artifact.comparisonSummary)) errors.push('comparison_summary')
  if (!same(artifact?.dependencySummary, expected.artifact.dependencySummary)) errors.push('dependency')
  if (!same(artifact?.artifactHashes, expected.artifact.artifactHashes)) errors.push('artifact_hash')
  if (!same(stableArtifact(artifact), stableArtifact(expected.artifact))) errors.push('complete_reproducibility')

  for (const name of Object.keys(expected.files)) {
    if (!same(files[name], expected.files[name])) {
      if (name === 'inventory') errors.push('locator')
      else if (name === 'transcription') {
        if (!same(sourceRefSet(files[name]), sourceRefSet(expected.files[name]))) errors.push('source_ref')
        else errors.push('transcription')
      } else if (name === 'occurrences') errors.push('occurrence_row')
      else if (name === 'comparison') errors.push('verdict')
      else if (name === 'dependency-graph') errors.push('dependency')
      else errors.push(`file:${name}`)
    }
  }

  const inventory = files.inventory
  if (inventory?.coverage?.fullPdfPageCount?.ming_nanyangtang !== 528 || inventory?.coverage?.fullPdfPageCount?.nanbei_shanren !== 219) errors.push('pdf_coverage')
  if (inventory?.coverage?.noPdfCopyOrRenderStored !== true) errors.push('pdf_copy_boundary')
  if (!inventory?.locators?.every((item) => item.id && item.sourceRef && item.title && item.confidence)) errors.push('locator')

  const transcription = files.transcription
  if (transcription?.ocrPolicy?.canonicalTranscription !== false || transcription?.ocrPolicy?.role !== 'exploration_only_not_canonical') errors.push('ocr_canonical')
  if (!transcription?.locators?.every((item) => item.directReading && item.confidence && Array.isArray(item.uncertainty))) errors.push('transcription')
  if (!transcription?.locators?.every((item) => item.pdfPage !== null || item.readingMode === 'full_pdf_scan_negative_locator')) errors.push('locator')

  const occurrences = files.occurrences
  if (occurrences?.sourceOccurrences?.length !== 820 || occurrences?.productionOccurrences?.length !== 68) errors.push('occurrence_row')
  if (!same(new Set(occurrences?.sourceOccurrences?.map((row) => row.occurrenceId)).size, 820)) errors.push('occurrence_row')
  if (!occurrences?.sourceOccurrences?.every((row) => row.sourceRefs?.length && row.ruleId && row.requestedStar && Object.prototype.hasOwnProperty.call(row, 'normalizedOutput'))) errors.push('source_ref')
  if (!occurrences?.sourceOccurrences?.some((row) => row.dependency?.kind === 'derived' && row.dependency.from === 'lucun')) errors.push('dependency')

  const comparison = files.comparison
  if (comparison?.summary?.exactMatchCount !== 136 || comparison?.summary?.mismatchCount !== 0 || comparison?.summary?.comparableCount !== 136) errors.push('comparison_summary')
  if (!comparison?.verdicts?.every((item) => item.verdict && item.sourceRefs?.length)) errors.push('verdict')
  if (!comparison?.rows?.every((row) => row.sourceRefs?.length)) errors.push('source_ref')

  const transform = files['transform-search']
  if (!transform?.searches?.every((item) => item.candidateCount === 24 && item.exactFitIds.length === 1 && item.exactFitIds[0] === 'rotation_0' && item.caseSpecificAdjustmentsAllowed === false)) errors.push('transform_search')
  const graph = files['dependency-graph']
  if (!same(graph?.accounting, expected.files['dependency-graph'].accounting) || graph?.edges?.length !== 2) errors.push('dependency')

  errors.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION }))
  return [...new Set(errors)]
}

export function checkArtifact(root = ROOT) {
  const expected = buildArtifact()
  const files = Object.fromEntries(Object.keys(expected.files).map((name) => [name, parse(`${ARTIFACT_DIR}/${name}.json`)]))
  const artifact = parse(`${ARTIFACT_DIR}/complete.json`)
  const errors = checkBundle({ artifact, files }, root)
  for (const [name, value] of Object.entries(expected.files)) {
    const path = resolve(root, `${ARTIFACT_DIR}/${name}.json`)
    const bytes = readFileSync(path)
    if (artifact.artifactHashes?.[`${name}.json`]?.byteSha256 !== createSha256(bytes)) errors.push(`artifact_hash:${name}`)
    const sidecar = parse(`${ARTIFACT_DIR}/${name}.json.integrity.json`)
    if (sidecar.byteSha256 !== createSha256(bytes) || sidecar.path !== `${ARTIFACT_DIR}/${name}.json`) errors.push(`integrity_sidecar:${name}`)
    if (!same(value, files[name])) errors.push(`file:${name}`)
  }
  for (const path of [`${ARTIFACT_DIR}/complete.json`, `${ARTIFACT_DIR}/conclusion.md`]) {
    const sidecar = parse(`${path}.integrity.json`)
    const bytes = readFileSync(resolve(root, path))
    if (sidecar.byteSha256 !== createSha256(bytes) || sidecar.path !== path) errors.push(`integrity_sidecar:${path}`)
  }
  return [...new Set(errors)]
}

function createSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkArtifact()
  if (errors.length) {
    console.error(JSON.stringify({ schema: SCHEMA, errors }, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify({ schema: SCHEMA, status: 'ok', basisHead: BASIS_HEAD }, null, 2))
  }
}
