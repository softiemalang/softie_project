import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, BASIS_HEAD, MATERIALIZER_PATH, MATERIALIZER_VERSION, PDF_SOURCES, SCHEMA } from './materialize-ziwei-ming-four-transformations-source-scope-v1.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const TYPES = ['hua_lu', 'hua_quan', 'hua_ke', 'hua_ji']

export function loadDocuments(root = ROOT) {
  const dir = resolve(root, ARTIFACT_DIR)
  const json = name => JSON.parse(readFileSync(resolve(dir, name), 'utf8'))
  return {
    complete: json('complete.json'),
    inventory: json('inventory.json'),
    topology: json('scan-topology.json'),
    candidates: json('candidate-witnesses.json'),
    direct: json('direct-transcription.json'),
    matrix: json('resolution-matrix.json'),
    comparison: json('comparison.json'),
    production: json('production-trace.json'),
    validation: json('validation.json'),
    fieldKit: json('source-acquisition-field-kit.json'),
    conclusion: readFileSync(resolve(dir, 'conclusion.md'), 'utf8'),
  }
}

function push(errors, condition, message) {
  if (!condition) errors.push(message)
}

function validateSourceIdentity(errors, inventory) {
  for (const source of Object.values(PDF_SOURCES)) {
    const recorded = inventory.sourceIdentity?.[source.id]
    push(errors, Boolean(recorded), 'source identity missing:' + source.id)
    if (!recorded) continue
    try {
      const bytes = readFileSync(source.path)
      const info = execFileSync(PDFINFO, [source.path], { encoding: 'utf8' })
      const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0)
      const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
      push(errors, sha256(bytes) === source.sha256 && recorded.actualByteSha256 === source.sha256 && recorded.fileHash === undefined, 'source hash mismatch:' + source.id)
      push(errors, pages === source.pageCount && recorded.pageCount === source.pageCount, 'source page count mismatch:' + source.id)
      push(errors, !encrypted && recorded.encrypted === false, 'source encryption mismatch:' + source.id)
    } catch (error) {
      errors.push('source identity unreadable:' + source.id + ':' + (error.code || error.message))
    }
  }
}

function validateRows(errors, documents) {
  const { complete, topology, candidates, direct, matrix, comparison, production, validation, fieldKit } = documents
  const locators = new Map((direct.locators || []).map(item => [item.id, item]))
  const directRows = direct.rawSourceRows || []
  push(errors, directRows.length === 44, 'direct transcription count:' + directRows.length)
  push(errors, matrix.cells?.length === 36, 'resolution matrix count:' + matrix.cells?.length)
  push(errors, matrix.summary?.sourceRuleNotLocated === 36 && matrix.summary?.mismatches === 0, 'resolution matrix summary invalid')
  push(errors, production.rows?.length === 40, 'production trace count:' + production.rows?.length)
  push(errors, direct.locators?.length >= 4, 'locator inventory incomplete')
  for (const locator of direct.locators || []) {
    push(errors, typeof locator.id === 'string' && typeof locator.sourceId === 'string', 'locator identity missing')
    push(errors, locator.tier === 'A' || locator.tier === 'B', 'locator tier missing:' + locator.id)
    push(errors, locator.readingMode && locator.confidence, 'locator reading metadata missing:' + locator.id)
    if (locator.sourceId === 'ming_nanyangtang' && locator.pdfPage !== null) push(errors, Number.isInteger(locator.pdfPage) && locator.pdfPage >= 145 && locator.pdfPage <= 160, 'Ming locator page outside focused range:' + locator.id)
  }
  const seen = new Set()
  for (const row of directRows) {
    const key = row.edition + ':' + row.stem + ':' + row.transformation
    push(errors, !seen.has(key), 'duplicate direct row:' + key)
    seen.add(key)
    push(errors, STEMS.includes(row.stem) && TYPES.includes(row.transformation), 'invalid direct axis:' + key)
    push(errors, row.sourceTier === (row.edition === 'ming_nanyangtang' ? 'A' : 'B'), 'direct source tier invalid:' + key)
    push(errors, Array.isArray(row.sourceRefs) && row.sourceRefs.length > 0, 'direct sourceRef missing:' + key)
    for (const sourceRef of row.sourceRefs || []) {
      push(errors, typeof sourceRef.sourceRef === 'string' && typeof sourceRef.sourceId === 'string', 'direct sourceRef identity missing:' + key)
      push(errors, Object.prototype.hasOwnProperty.call(sourceRef, 'fileIdentitySha256'), 'direct source file identity missing:' + key)
      if (sourceRef.locatorType === 'official_iiif_same_witness') push(errors, typeof sourceRef.imageSha256 === 'string' && sourceRef.canvasId && sourceRef.width && sourceRef.height, 'official plate identity missing:' + key)
      if (sourceRef.locatorType === 'direct_high_resolution_plate') push(errors, sourceRef.pdfPage === 17 && sourceRef.printedFolio === '四十二', 'Nanbei locator boundary missing:' + key)
    }
    if (row.edition === 'ming_nanyangtang') push(errors, row.stem === '甲' ? row.rawTarget !== null && row.normalizedStarId : row.rawTarget === null && row.normalizedStarId === null && row.sourceStatus === 'source_rule_not_located', 'Ming null/direct boundary invalid:' + key)
  }
  for (const cell of matrix.cells || []) {
    const key = cell.stem + ':' + cell.transformation
    push(errors, STEMS.slice(1).includes(cell.stem) && TYPES.includes(cell.transformation), 'matrix axis invalid:' + key)
    push(errors, cell.cellStatus === 'source_rule_not_located' && cell.rawTarget === null && cell.normalizedStarId === null, 'blocked cell promoted:' + key)
    push(errors, cell.comparisonStatus === 'not_compared_source_unlocated' && cell.mismatch === false, 'blocked comparison boundary invalid:' + key)
    push(errors, cell.blocker === 'independent_tier_a_witness_unavailable', 'cell blocker missing:' + key)
  }
  push(errors, comparison.rows?.length === 80, 'comparison count:' + comparison.rows?.length)
  push(errors, comparison.summary?.comparableCount === 44 && comparison.summary?.exactNormalizedMatchCount === 44 && comparison.summary?.mismatchCount === 0 && comparison.summary?.sourceRuleNotLocatedCount === 36, 'comparison summary invalid')
  push(errors, comparison.rows?.filter(row => !row.comparable).every(row => row.verdict === 'source_rule_not_located' && row.mismatch === false && row.normalizedMatch === null), 'unlocated comparison treated as mismatch')
  push(errors, comparison.rows?.filter(row => !row.comparable).every(row => row.mismatch === false), 'unlocated comparison row treated as mismatch')
  push(errors, comparison.comparisonBoundary?.nanbeiAndProductionNeverPopulateMingCells === true, 'comparison contamination boundary missing')
  push(errors, topology.sourcePageCount === 528 && topology.fullScan.renderedPageCount === 528, 'topology page count missing')
  push(errors, topology.fullScan.uniqueRenderHashCount === 528 && topology.fullScan.exactDuplicateGroupCount === 0 && topology.fullScan.pageHashDigest?.length === 528, 'topology duplicate audit invalid')
  push(errors, JSON.stringify(topology.focusedHighResolutionReview.reviewedPdfPages) === JSON.stringify(Array.from({ length: 26 }, (_, i) => i + 140)), 'focused high-resolution page coverage invalid')
  push(errors, topology.topologyVerdict?.coreRangeMissingPageEvidence === false && topology.topologyVerdict?.coreRangeDuplicateEvidence === false, 'core topology verdict invalid')
  push(errors, candidates.candidates?.length >= 6, 'candidate inventory incomplete')
  push(errors, candidates.candidates?.some(candidate => candidate.id === 'national_archives_japan_iiif_same_witness' && candidate.tier === 'A'), 'official Tier A same-witness candidate missing')
  push(errors, candidates.candidates?.filter(candidate => candidate.tier === 'A' && String(candidate.identityRelation).includes('independent alternate') && !String(candidate.identityRelation).includes('not an independent alternate')).length === 0, 'independent Tier A incorrectly claimed')
  push(errors, validation.tierValidation?.tierAIndependentAlternateCopyCount === 0 && validation.tierValidation?.tierBOrCUsedToFillMing === false, 'tier boundary invalid')
  push(errors, fieldKit.requiredIfBlocked === true && fieldKit.items?.some(item => item.priority === 'P0'), 'field kit missing')
  push(errors, complete.verdict === 'blocked_ziwei_ming_four_transformations_tier_a_witness_unavailable', 'verdict must remain blocked')
  push(errors, complete.basisHead === BASIS_HEAD, 'basis HEAD mismatch')
  push(errors, complete.observedHeadPolicy?.currentHeadEqualityGate === false, 'observedHead policy invalid')
  push(errors, complete.boundaries?.productionEngineModified === false && complete.boundaries?.sourcePromotion === false && complete.boundaries?.predecessorOverwritten === false, 'safety boundary invalid')
  push(errors, direct.predecessorOverwritten === false, 'predecessor overwrite flag invalid')
  push(errors, locators.get('ming-p152-甲-four-transformations-example')?.directReading?.includes('如甲生人'), '甲 direct transcription missing')
}

export function validatePayload(documents) {
  const errors = []
  push(errors, documents.complete.schemaVersion === SCHEMA, 'schema mismatch')
  push(errors, documents.inventory.schemaVersion === SCHEMA && documents.direct.schemaVersion === SCHEMA, 'inventory/direct schema mismatch')
  push(errors, documents.topology.schemaVersion === SCHEMA && documents.matrix.schemaVersion === SCHEMA, 'topology/matrix schema mismatch')
  push(errors, documents.comparison.schemaVersion === SCHEMA && documents.validation.schemaVersion === SCHEMA, 'comparison/validation schema mismatch')
  validateRows(errors, documents)
  return errors
}

export function validateSidecars(errors, documents, root = ROOT) {
  const complete = documents.complete
  for (const [name, path] of Object.entries(complete.artifactFiles || {})) {
    const absolute = resolve(root, path)
    const sidecarPath = absolute + '.integrity.json'
    push(errors, existsSync(absolute), 'artifact output missing:' + path)
    push(errors, existsSync(sidecarPath), 'integrity sidecar missing:' + path)
    if (!existsSync(absolute) || !existsSync(sidecarPath)) continue
    try {
      const bytes = readFileSync(absolute)
      const sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8'))
      push(errors, sidecar.schemaVersion === 'artifact-integrity-sidecar-v1', 'sidecar schema mismatch:' + path)
      push(errors, sidecar.byteSha256 === sha256(bytes) && sidecar.byteLength === bytes.length && sidecar.path === path, 'sidecar byte mismatch:' + path)
      const artifactName = path.startsWith(ARTIFACT_DIR + '/') ? path.slice((ARTIFACT_DIR + '/').length) : path
      const expected = complete.artifactHashes?.[artifactName]
      if (expected) push(errors, expected.path === path && expected.byteLength === bytes.length && expected.byteSha256 === sha256(bytes), 'complete artifact hash mismatch:' + path)
    } catch (error) {
      errors.push('sidecar unreadable:' + path + ':' + error.message)
    }
  }
  const completePath = resolve(root, complete.artifactFiles.complete)
  if (existsSync(completePath)) {
    const parsed = JSON.parse(readFileSync(completePath, 'utf8'))
    push(errors, documents.complete.artifactIdentity?.artifactPayloadSha256 === parsed.artifactIdentity?.artifactPayloadSha256, 'complete artifact reload mismatch')
  }
}

export function checkArtifact(root = ROOT) {
  const errors = []
  let documents
  try { documents = loadDocuments(root) } catch (error) { return ['artifact load failed:' + error.message] }
  errors.push(...validatePayload(documents))
  validateSourceIdentity(errors, documents.inventory)
  errors.push(...checkArtifactIdentity(documents.complete, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION }))
  validateSidecars(errors, documents, root)
  return errors
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const errors = checkArtifact()
  if (errors.length) {
    console.error(JSON.stringify({ schema: SCHEMA, passed: false, errors }, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify({ schema: SCHEMA, passed: true, verdict: 'blocked_ziwei_ming_four_transformations_tier_a_witness_unavailable', currentHeadGate: false }, null, 2))
  }
}
