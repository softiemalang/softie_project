import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

/**
 * Computes size, sha256, and line count (if applicable) for a file path.
 */
export async function getFileMetadata(filePath) {
  const absolutePath = resolve(filePath)
  const fileStat = await stat(absolutePath)

  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`Invalid file: ${filePath} (must exist, be a regular file, and size > 0)`)
  }

  const content = await readFile(absolutePath)
  const size = content.length
  const sha256 = createHash('sha256').update(content).digest('hex')

  let lineCount = null
  if (filePath.endsWith('.jsonl')) {
    const text = content.toString('utf8').trim()
    lineCount = text ? text.split('\n').filter(Boolean).length : 0
  }

  return {
    path: absolutePath,
    size,
    sha256,
    lineCount,
    content
  }
}

/**
 * Parses JSONL content string into array of objects.
 */
export function parseJsonLines(contentBufferOrString) {
  const text = (typeof contentBufferOrString === 'string' ? contentBufferOrString : contentBufferOrString.toString('utf8')).trim()
  if (!text) return []
  const lines = text.split('\n').filter(Boolean)
  return lines.map((line, index) => {
    try {
      return JSON.parse(line)
    } catch (err) {
      throw new Error(`Failed to parse JSONL line ${index + 1}: ${err.message}`)
    }
  })
}

/**
 * Canonical deterministic serializer for classification summary.
 */
export function serializeClassificationSummaryCanonical(summaryObj) {
  const keysOrder = [
    'schemaVersion',
    'recordType',
    'analysisStatus',
    'sourceSampleCount',
    'sourceFiles',
    'inputs',
    'selectionAmbiguousCount',
    'selectionEquivalentCount',
    'selectionUnresolvedCount',
    'outOfCoverageCount',
    'expectedExactEndExclusionCount',
    'unexpectedOutOfCoverageCount',
    'duplicateClassificationIdentities',
    'classificationCounts',
    'totalClassificationCount'
  ]

  const ordered = {}

  for (const key of keysOrder) {
    if (summaryObj[key] !== undefined) {
      ordered[key] = summaryObj[key]
    }
  }

  // Include any additional keys not in explicit list, sorted alphabetically
  const remainingKeys = Object.keys(summaryObj)
    .filter(k => !keysOrder.includes(k))
    .sort((a, b) => a.localeCompare(b))

  for (const key of remainingKeys) {
    ordered[key] = summaryObj[key]
  }

  return JSON.stringify(ordered, null, 2) + '\n'
}

/**
 * Deterministically generates a DE405 classification summary object and writes to output path if specified.
 */
export async function generateClassificationSummary(options = {}) {
  const summaryPath = options.summary || 'artifacts/de405-jpl-cspice-residual-sweep.summary.json'
  const manifestPath = options.manifest || 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl'
  const samplesPath = options.samples || 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'
  const classificationsPath = options.classifications || 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl'
  const outputPath = options.output
  const force = Boolean(options.force)

  // 1. Preflight File Integrity
  const summaryMeta = await getFileMetadata(summaryPath)
  const manifestMeta = await getFileMetadata(manifestPath)
  const samplesMeta = await getFileMetadata(samplesPath)
  const classificationsMeta = await getFileMetadata(classificationsPath)

  let summaryData
  try {
    summaryData = JSON.parse(summaryMeta.content.toString('utf8'))
  } catch (err) {
    throw new Error(`Preflight error: summary file is invalid JSON: ${err.message}`)
  }

  const manifestRows = parseJsonLines(manifestMeta.content)
  const samplesRows = parseJsonLines(samplesMeta.content)
  const classificationsRows = parseJsonLines(classificationsMeta.content)

  // 2. Preflight Residual Sample Count
  const manifestCount = manifestRows.length
  const samplesCount = samplesRows.length

  if (manifestCount !== samplesCount) {
    throw new Error(`Preflight error: manifest count (${manifestCount}) != samples count (${samplesCount})`)
  }

  const summarySampleCount = summaryData?.summary?.sourceSampleCount ??
                             summaryData?.sourceSampleCount ??
                             summaryData?.evaluatedSampleCount ??
                             summaryData?.evaluatedSamples

  if (summarySampleCount !== undefined && summarySampleCount !== manifestCount) {
    throw new Error(`Preflight error: summary sample count (${summarySampleCount}) != manifest count (${manifestCount})`)
  }

  // 3. Preflight Manifest and Samples Identity
  const manifestSampleIds = new Set()
  for (let i = 0; i < manifestRows.length; i++) {
    const row = manifestRows[i]
    if (!row.sampleId) {
      throw new Error(`Preflight error: manifest row ${i + 1} missing sampleId`)
    }
    if (manifestSampleIds.has(row.sampleId)) {
      throw new Error(`Preflight error: duplicate manifest sampleId: ${row.sampleId}`)
    }
    manifestSampleIds.add(row.sampleId)
  }

  const samplesSampleIds = new Set()
  for (let i = 0; i < samplesRows.length; i++) {
    const row = samplesRows[i]
    if (!row.sampleId) {
      throw new Error(`Preflight error: samples row ${i + 1} missing sampleId`)
    }
    if (samplesSampleIds.has(row.sampleId)) {
      throw new Error(`Preflight error: duplicate samples sampleId: ${row.sampleId}`)
    }
    if (!manifestSampleIds.has(row.sampleId)) {
      throw new Error(`Preflight error: samples sampleId ${row.sampleId} missing from manifest`)
    }
    samplesSampleIds.add(row.sampleId)
  }

  for (const id of manifestSampleIds) {
    if (!samplesSampleIds.has(id)) {
      throw new Error(`Preflight error: manifest sampleId ${id} missing from samples`)
    }
  }

  // 4. Preflight Classification Identity & Totals
  const classificationCategoryCounts = {}
  const classificationSampleIds = new Set()
  let duplicateClassificationIdentities = 0

  for (let i = 0; i < classificationsRows.length; i++) {
    const row = classificationsRows[i]
    const sampleId = row.sampleId
    if (!sampleId) {
      throw new Error(`Preflight error: classification row ${i + 1} missing sampleId`)
    }
    if (!manifestSampleIds.has(sampleId)) {
      throw new Error(`Preflight error: classification sampleId ${sampleId} missing from manifest/samples`)
    }
    if (classificationSampleIds.has(sampleId)) {
      duplicateClassificationIdentities++
      throw new Error(`Preflight error: duplicate classification sampleId: ${sampleId}`)
    }
    classificationSampleIds.add(sampleId)

    const category = row.classification || row.kind || 'unknown'
    classificationCategoryCounts[category] = (classificationCategoryCounts[category] || 0) + 1
  }

  // Sort category keys deterministically
  const sortedCategoryCounts = {}
  for (const key of Object.keys(classificationCategoryCounts).sort((a, b) => a.localeCompare(b))) {
    sortedCategoryCounts[key] = classificationCategoryCounts[key]
  }

  const unresolvedCount = (sortedCategoryCounts.candidate_state_different || 0) +
                          (sortedCategoryCounts.state_equivalent_selection_different || 0) +
                          (sortedCategoryCounts.selection_unresolved || 0)

  const outOfCoverageCount = (sortedCategoryCounts.unexpected_out_of_coverage || 0) +
                             (sortedCategoryCounts.out_of_coverage || 0)

  const analysisStatus = outOfCoverageCount > 0 ? 'incomplete' : 'complete'

  // Build canonical summary object
  const summaryObj = {
    schemaVersion: 1,
    recordType: 'de405_sweep_classification_summary',
    analysisStatus,
    sourceSampleCount: manifestCount,
    sourceFiles: {
      summary: {
        path: summaryMeta.path,
        size: summaryMeta.size,
        sha256: summaryMeta.sha256,
        lineCount: summaryMeta.lineCount
      },
      manifest: {
        path: manifestMeta.path,
        size: manifestMeta.size,
        sha256: manifestMeta.sha256,
        lineCount: manifestMeta.lineCount
      },
      samples: {
        path: samplesMeta.path,
        size: samplesMeta.size,
        sha256: samplesMeta.sha256,
        lineCount: samplesMeta.lineCount
      },
      classifications: {
        path: classificationsMeta.path,
        size: classificationsMeta.size,
        sha256: classificationsMeta.sha256,
        lineCount: classificationsMeta.lineCount
      }
    },
    inputs: {
      summarySha256: summaryMeta.sha256,
      manifestSha256: manifestMeta.sha256,
      samplesSha256: samplesMeta.sha256,
      classificationSha256: classificationsMeta.sha256
    },
    selectionAmbiguousCount: unresolvedCount,
    selectionEquivalentCount: 0,
    selectionUnresolvedCount: unresolvedCount,
    outOfCoverageCount: outOfCoverageCount,
    expectedExactEndExclusionCount: 0,
    unexpectedOutOfCoverageCount: outOfCoverageCount,
    duplicateClassificationIdentities,
    classificationCounts: sortedCategoryCounts,
    totalClassificationCount: classificationsRows.length
  }

  if (outputPath) {
    const resolvedOutput = resolve(outputPath)
    let exists = false
    try {
      await stat(resolvedOutput)
      exists = true
    } catch {
      exists = false
    }

    if (exists && !force) {
      throw new Error(`output_exists: ${resolvedOutput} already exists (use --force to overwrite)`)
    }

    const canonicalJson = serializeClassificationSummaryCanonical(summaryObj)
    const tmpPath = `${resolvedOutput}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
    await mkdir(dirname(resolvedOutput), { recursive: true })
    await writeFile(tmpPath, canonicalJson, 'utf8')

    // Verify temp file parse
    const readBack = await readFile(tmpPath, 'utf8')
    JSON.parse(readBack)

    await rename(tmpPath, resolvedOutput)
  }

  return summaryObj
}

/**
 * Validates freshness of a classification summary artifact against current source files.
 */
export async function validateClassificationSummaryFreshness(classificationSummaryPath, options = {}) {
  const mismatches = []
  const resolvedSummaryPath = resolve(classificationSummaryPath)

  let summaryMeta
  let parsedSummary

  try {
    summaryMeta = await getFileMetadata(resolvedSummaryPath)
    parsedSummary = JSON.parse(summaryMeta.content.toString('utf8'))
  } catch (err) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: null,
      mismatches: [
        {
          source: 'classificationSummary',
          field: 'file',
          recorded: 'valid_json_file',
          actual: `invalid_or_missing: ${err.message}`
        }
      ]
    }
  }

  if (parsedSummary?.schemaVersion !== 1) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: parsedSummary?.schemaVersion ?? null,
      mismatches: [
        {
          source: 'classificationSummary',
          field: 'schemaVersion',
          recorded: parsedSummary?.schemaVersion ?? 'missing',
          actual: 1
        }
      ]
    }
  }

  // Get current source files metadata
  const summaryPath = options.summary || 'artifacts/de405-jpl-cspice-residual-sweep.summary.json'
  const manifestPath = options.manifest || 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl'
  const samplesPath = options.samples || 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'
  const classificationsPath = options.classifications || 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl'

  let manifestMeta, samplesMeta, classificationsMeta, residualSummaryMeta, classificationsRows
  try {
    manifestMeta = await getFileMetadata(manifestPath)
    samplesMeta = await getFileMetadata(samplesPath)
    classificationsMeta = await getFileMetadata(classificationsPath)
    residualSummaryMeta = await getFileMetadata(summaryPath)
    classificationsRows = parseJsonLines(classificationsMeta.content)
  } catch (err) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: 1,
      mismatches: [
        {
          source: 'sourceFiles',
          field: 'read',
          recorded: 'accessible',
          actual: `error: ${err.message}`
        }
      ]
    }
  }

  // Check inputs / sourceFiles recorded hashes & sizes
  const recordedFiles = parsedSummary.sourceFiles || {}
  const recordedInputs = parsedSummary.inputs || {}

  // 1. Manifest checks
  const recManifestSha = recordedInputs.manifestSha256 || recordedFiles.manifest?.sha256
  if (!recManifestSha) {
    mismatches.push({ source: 'manifest', field: 'missing_provenance', recorded: 'missing', actual: manifestMeta.sha256 })
  } else if (recManifestSha !== manifestMeta.sha256) {
    mismatches.push({ source: 'manifest', field: 'sha256', recorded: recManifestSha, actual: manifestMeta.sha256 })
  }

  const recManifestSize = recordedFiles.manifest?.size
  if (recManifestSize !== undefined && recManifestSize !== manifestMeta.size) {
    mismatches.push({ source: 'manifest', field: 'size', recorded: recManifestSize, actual: manifestMeta.size })
  }

  const recManifestLineCount = recordedFiles.manifest?.lineCount
  if (recManifestLineCount !== undefined && recManifestLineCount !== manifestMeta.lineCount) {
    mismatches.push({ source: 'manifest', field: 'lineCount', recorded: recManifestLineCount, actual: manifestMeta.lineCount })
  }

  // 2. Samples checks
  const recSamplesSha = recordedInputs.samplesSha256 || recordedFiles.samples?.sha256
  if (!recSamplesSha) {
    mismatches.push({ source: 'samples', field: 'missing_provenance', recorded: 'missing', actual: samplesMeta.sha256 })
  } else if (recSamplesSha !== samplesMeta.sha256) {
    mismatches.push({ source: 'samples', field: 'sha256', recorded: recSamplesSha, actual: samplesMeta.sha256 })
  }

  const recSamplesSize = recordedFiles.samples?.size
  if (recSamplesSize !== undefined && recSamplesSize !== samplesMeta.size) {
    mismatches.push({ source: 'samples', field: 'size', recorded: recSamplesSize, actual: samplesMeta.size })
  }

  const recSamplesLineCount = recordedFiles.samples?.lineCount
  if (recSamplesLineCount !== undefined && recSamplesLineCount !== samplesMeta.lineCount) {
    mismatches.push({ source: 'samples', field: 'lineCount', recorded: recSamplesLineCount, actual: samplesMeta.lineCount })
  }

  // 3. Classifications checks
  const recClassificationsSha = recordedInputs.classificationSha256 || recordedFiles.classifications?.sha256
  if (!recClassificationsSha) {
    mismatches.push({ source: 'classifications', field: 'missing_provenance', recorded: 'missing', actual: classificationsMeta.sha256 })
  } else if (recClassificationsSha !== classificationsMeta.sha256) {
    mismatches.push({ source: 'classifications', field: 'sha256', recorded: recClassificationsSha, actual: classificationsMeta.sha256 })
  }

  const recClassificationsSize = recordedFiles.classifications?.size
  if (recClassificationsSize !== undefined && recClassificationsSize !== classificationsMeta.size) {
    mismatches.push({ source: 'classifications', field: 'size', recorded: recClassificationsSize, actual: classificationsMeta.size })
  }

  const recClassificationsLineCount = recordedFiles.classifications?.lineCount
  if (recClassificationsLineCount !== undefined && recClassificationsLineCount !== classificationsMeta.lineCount) {
    mismatches.push({ source: 'classifications', field: 'lineCount', recorded: recClassificationsLineCount, actual: classificationsMeta.lineCount })
  }

  // 4. Residual Summary checks
  const recSummarySha = recordedInputs.summarySha256 || recordedFiles.summary?.sha256
  if (recSummarySha && recSummarySha !== residualSummaryMeta.sha256) {
    mismatches.push({ source: 'summary', field: 'sha256', recorded: recSummarySha, actual: residualSummaryMeta.sha256 })
  }

  // 5. Source sample count check
  if (parsedSummary.sourceSampleCount !== manifestMeta.lineCount) {
    mismatches.push({
      source: 'sourceSampleCount',
      field: 'count',
      recorded: parsedSummary.sourceSampleCount,
      actual: manifestMeta.lineCount
    })
  }

  // 6. Category & unresolved counts check
  const actualCategoryCounts = {}
  for (const row of classificationsRows) {
    const cat = row.classification || row.kind || 'unknown'
    actualCategoryCounts[cat] = (actualCategoryCounts[cat] || 0) + 1
  }

  const actualUnresolved = (actualCategoryCounts.candidate_state_different || 0) +
                           (actualCategoryCounts.state_equivalent_selection_different || 0) +
                           (actualCategoryCounts.selection_unresolved || 0)

  const actualOutOfCoverage = (actualCategoryCounts.unexpected_out_of_coverage || 0) +
                              (actualCategoryCounts.out_of_coverage || 0)

  if (parsedSummary.selectionUnresolvedCount !== undefined && parsedSummary.selectionUnresolvedCount !== actualUnresolved) {
    mismatches.push({
      source: 'classifications',
      field: 'selectionUnresolvedCount',
      recorded: parsedSummary.selectionUnresolvedCount,
      actual: actualUnresolved
    })
  }

  if (parsedSummary.outOfCoverageCount !== undefined && parsedSummary.outOfCoverageCount !== actualOutOfCoverage) {
    mismatches.push({
      source: 'classifications',
      field: 'outOfCoverageCount',
      recorded: parsedSummary.outOfCoverageCount,
      actual: actualOutOfCoverage
    })
  }

  // Deterministically sort mismatches by source ASC, then field ASC
  mismatches.sort((a, b) => {
    const srcCmp = a.source.localeCompare(b.source)
    if (srcCmp !== 0) return srcCmp
    return a.field.localeCompare(b.field)
  })

  if (mismatches.length > 0) {
    return {
      status: 'stale',
      fresh: false,
      schemaVersion: 1,
      mismatches
    }
  }

  return {
    status: 'fresh',
    fresh: true,
    schemaVersion: 1,
    mismatches: []
  }
}
