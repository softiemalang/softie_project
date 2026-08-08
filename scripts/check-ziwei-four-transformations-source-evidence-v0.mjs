import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, BASIS_HEAD, MATERIALIZER_PATH, MATERIALIZER_VERSION, PDF_SOURCES, SCHEMA } from './materialize-ziwei-four-transformations-source-evidence-v0.mjs'
import { resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const TYPES = ['hua_lu', 'hua_quan', 'hua_ke', 'hua_ji']
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function loadDocuments(root = ROOT) {
  const dir = resolve(root, ARTIFACT_DIR)
  const json = name => JSON.parse(readFileSync(resolve(dir, name), 'utf8'))
  return {
    complete: json('complete.json'),
    inventory: json('inventory.json'),
    transcription: json('transcription.json'),
    normalizedRules: json('normalized-rules.json'),
    productionTrace: json('production-trace.json'),
    occurrences: json('occurrences.json'),
    comparison: json('comparison.json'),
    validation: json('validation.json'),
    dependencyGraph: json('dependency-graph.json'),
    conclusion: readFileSync(resolve(dir, 'conclusion.md'), 'utf8'),
  }
}

function push(errors, condition, message) {
  if (!condition) errors.push(message)
}

function validateSourceIdentity(errors, inventory) {
  for (const source of Object.values(PDF_SOURCES)) {
    const recorded = inventory.sourceIdentity?.[source.id]
    push(errors, Boolean(recorded), `source identity missing:${source.id}`)
    if (!recorded) continue
    try {
      const accessPath = resolvePdfSourcePathSync(source.id === 'ming_nanyangtang' ? 'nanyangtang_quanbao_528p' : 'nanbei_quanbao_219p')
      const bytes = readFileSync(accessPath)
      const info = execFileSync(PDFINFO, [accessPath], { encoding: 'utf8' })
      const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0)
      const encrypted = (info.match(/^Encrypted:\s+(.+)/m)?.[1] || '').trim().toLowerCase() !== 'no'
      push(errors, sha256(bytes) === source.sha256 && recorded.actualByteSha256 === source.sha256, `source hash mismatch:${source.id}`)
      push(errors, pages === source.pageCount && recorded.pageCount === source.pageCount, `source page count mismatch:${source.id}`)
      push(errors, !encrypted && recorded.encrypted === false, `source encryption mismatch:${source.id}`)
    } catch (error) {
      errors.push(`source identity unreadable:${source.id}:${error.code || error.message}`)
    }
  }
}

function validateRows(errors, documents) {
  const { complete, transcription, normalizedRules, productionTrace, occurrences, comparison, validation, dependencyGraph } = documents
  const sourceRows = occurrences.sourceOccurrences || []
  const productionRows = occurrences.productionOccurrences || []
  const locatorRows = transcription.locators || []
  const locators = new Set(locatorRows.map(item => item.id))
  const canonicalLabels = Object.fromEntries((normalizedRules.aliasTable || []).map(item => [item.normalizedStarId, item.rawGlyph]))
  push(errors, locatorRows.length >= 5, 'locator inventory incomplete')
  for (const locator of locatorRows) {
    push(errors, typeof locator.id === 'string' && typeof locator.sourceId === 'string' && typeof locator.title === 'string', `locator identity missing:${locator.id}`)
    push(errors, typeof locator.readingMode === 'string' && typeof locator.confidence === 'string' && Array.isArray(locator.uncertainty), `locator reading metadata missing:${locator.id}`)
    push(errors, locator.canonical ? Number.isInteger(locator.pdfPage) : locator.pdfPage === null, `locator page boundary invalid:${locator.id}`)
  }
  const sourceKeys = new Set()
  const productionKeys = new Set()
  push(errors, sourceRows.length === 80, `source occurrence count:${sourceRows.length}`)
  push(errors, productionRows.length === 40, `production occurrence count:${productionRows.length}`)
  for (const row of sourceRows) {
    const key = `${row.edition}:${row.stem}:${row.transformation}`
    push(errors, !sourceKeys.has(key), `duplicate source occurrence:${key}`)
    sourceKeys.add(key)
    push(errors, row.edition === 'ming_nanyangtang' || row.edition === 'nanbei_shanren', `invalid source edition:${key}`)
    push(errors, STEMS.includes(row.stem) && TYPES.includes(row.transformation), `invalid source axis:${key}`)
    push(errors, Array.isArray(row.sourceRefs) && row.sourceRefs.length > 0, `sourceRef missing:${key}`)
    for (const sourceRef of row.sourceRefs || []) {
      push(errors, locators.has(sourceRef.sourceRef), `unknown sourceRef:${key}:${sourceRef.sourceRef}`)
      push(errors, typeof sourceRef.sourceId === 'string' && Object.prototype.hasOwnProperty.call(sourceRef, 'pdfPage') && Object.prototype.hasOwnProperty.call(sourceRef, 'printedFolio'), `sourceRef metadata missing:${key}`)
    }
    if (row.rawTarget === null) push(errors, row.normalizedStarId === null && row.sourceStatus === 'source_rule_not_located', `blocked source cell not null:${key}`)
    else {
      push(errors, row.sourceStatus !== 'source_rule_not_located', `blocked source cell has output:${key}`)
      push(errors, typeof row.normalizedStarId === 'string' && row.aliasResolution?.postHoc === false, `alias resolution missing:${key}`)
      push(errors, canonicalLabels[row.normalizedStarId] === row.rawTarget, `alias raw/normalized mismatch:${key}`)
    }
  }
  for (const row of productionRows) {
    const key = `${row.stem}:${row.transformation}`
    push(errors, !productionKeys.has(key), `duplicate production occurrence:${key}`)
    productionKeys.add(key)
    push(errors, STEMS.includes(row.stem) && TYPES.includes(row.transformation), `invalid production axis:${key}`)
    push(errors, row.inputField === 'birthYearStem' && row.status === 'implemented', `production trace missing:${key}`)
    push(errors, typeof row.normalizedStarId === 'string' && typeof row.rawTargetLabel === 'string', `production target missing:${key}`)
    push(errors, Array.isArray(row.callPath) && row.callPath.length >= 3, `production call path missing:${key}`)
  }
  for (const stem of STEMS) {
    push(errors, TYPES.every(type => sourceRows.filter(row => row.edition === 'ming_nanyangtang' && row.stem === stem && row.transformation === type).length === 1), `Ming 4-cell coverage:${stem}`)
    push(errors, TYPES.every(type => sourceRows.filter(row => row.edition === 'nanbei_shanren' && row.stem === stem && row.transformation === type).length === 1), `Nanbei 4-cell coverage:${stem}`)
    push(errors, TYPES.every(type => productionRows.filter(row => row.stem === stem && row.transformation === type).length === 1), `production 4-cell coverage:${stem}`)
  }
  push(errors, validation.sourceCoverage?.actualSourceOccurrences === 80 && validation.sourceCoverage?.allSourceCellsPreserved === true, 'source coverage validation missing')
  push(errors, JSON.stringify(validation.stemOrder?.required) === JSON.stringify(STEMS), 'stem order validation missing')
  push(errors, JSON.stringify(validation.columnOrder?.nanbei?.normalizedComparisonOrder) === JSON.stringify(TYPES), 'Nanbei column order validation missing')
  push(errors, validation.columnOrder?.nanbei?.result === 'proved' && validation.columnOrder?.ming?.result === 'not_proven_for_乙_to_癸', 'column boundary not fail-closed')
  push(errors, validation.aliases?.noPostHocAliasAdded === true && validation.aliases?.rawGlyphsPreserved === true, 'alias validation missing')
  push(errors, normalizedRules.sourceTables?.ming_nanyangtang?.length === 10 && normalizedRules.sourceTables?.nanbei_shanren?.length === 10 && normalizedRules.productionTable?.length === 10, 'normalized 10-row tables missing')
  push(errors, complete.sourceOccurrenceSummary?.sourceByEdition?.ming_nanyangtang === 40 && complete.sourceOccurrenceSummary?.sourceByEdition?.nanbei_shanren === 40, 'complete source summary missing')
  push(errors, productionTrace.rows?.length === 40 && productionTrace.acceptedInputFields?.includes('birthYearStem'), 'production trace summary missing')
  push(errors, comparison.rows?.length === 80, 'comparison row count missing')
  push(errors, comparison.rows?.every(row => row.verdict === 'exact_match' || row.verdict === 'source_rule_not_located' || row.verdict === 'substantive_rule_divergence_proven'), 'comparison verdict outside allowlist')
  push(errors, comparison.summary?.blockedCount === 36 && comparison.summary?.mismatchCount === 0, 'comparison summary mismatch')
  push(errors, dependencyGraph.nodes?.length > 0 && dependencyGraph.edges?.length === 40, 'dependency graph incomplete')
  push(errors, dependencyGraph.nodes?.every(node => typeof node.id === 'string' && typeof node.canonicalLabel === 'string' && typeof node.identityStatus === 'string' && Array.isArray(node.sourceRefs)), 'dependency node provenance missing')
  push(errors, dependencyGraph.edges?.every(edge => edge.from && edge.to && Array.isArray(edge.sourceRefs) && Array.isArray(edge.productionRef)), 'dependency edge provenance missing')
  push(errors, dependencyGraph.dependencyBoundary?.semanticStarIdentityPromoted === false, 'semantic identity promotion boundary missing')
  push(errors, complete.verdict === 'partial_ziwei_four_transformations_evidence_with_explicit_blockers', 'overall verdict not blocked as required')
}

export function validatePayload(documents) {
  const errors = []
  const { complete, inventory, transcription, normalizedRules, productionTrace, occurrences, comparison, validation, dependencyGraph } = documents
  push(errors, complete.schemaVersion === SCHEMA, 'schema mismatch')
  push(errors, complete.basisHead === BASIS_HEAD, 'basis HEAD mismatch')
  push(errors, /^[0-9a-f]{40}$/.test(complete.artifactIdentity?.observedHead || ''), 'observedHead diagnostic missing')
  push(errors, normalizedRules.schemaVersion === SCHEMA, 'normalized rules schema mismatch')
  push(errors, comparison.schemaVersion === SCHEMA, 'comparison schema mismatch')
  push(errors, inventory.schemaVersion === SCHEMA && transcription.schemaVersion === SCHEMA, 'inventory/transcription schema mismatch')
  validateRows(errors, { complete, inventory, transcription, normalizedRules, productionTrace, occurrences, comparison, validation, dependencyGraph })
  return errors
}

function validateSidecars(errors, documents, root = ROOT) {
  const complete = documents.complete
  for (const [name, path] of Object.entries(complete.artifactFiles || {}).filter(([, path]) => typeof path === 'string')) {
    const absolute = resolve(root, path)
    const sidecarPath = `${absolute}.integrity.json`
    push(errors, existsSync(absolute), `artifact output missing:${path}`)
    push(errors, existsSync(sidecarPath), `integrity sidecar missing:${path}`)
    if (!existsSync(absolute) || !existsSync(sidecarPath)) continue
    try {
      const bytes = readFileSync(absolute)
      const sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8'))
      push(errors, sidecar.schemaVersion === 'artifact-integrity-sidecar-v1', `sidecar schema mismatch:${path}`)
      push(errors, sidecar.byteSha256 === sha256(bytes) && sidecar.byteLength === bytes.length && sidecar.path === path, `sidecar byte mismatch:${path}`)
      const expected = complete.artifactHashes?.[`${name}.json`]
      if (expected) push(errors, expected.path === path && expected.byteLength === bytes.length && expected.byteSha256 === sha256(bytes), `complete artifact hash mismatch:${path}`)
    } catch (error) { errors.push(`sidecar unreadable:${path}:${error.message}`) }
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
  try { documents = loadDocuments(root) } catch (error) { return [`artifact load failed:${error.message}`] }
  errors.push(...validatePayload(documents))
  validateSourceIdentity(errors, documents.inventory)
  const identityErrors = checkArtifactIdentity(documents.complete, { root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION })
  errors.push(...identityErrors)
  validateSidecars(errors, documents, root)
  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkArtifact()
  if (errors.length) {
    console.error(JSON.stringify({ schema: SCHEMA, passed: false, errors }, null, 2))
    process.exitCode = 1
  } else console.log(JSON.stringify({ schema: SCHEMA, passed: true, verdict: 'partial_ziwei_four_transformations_evidence_with_explicit_blockers', currentHeadGate: false }, null, 2))
}
