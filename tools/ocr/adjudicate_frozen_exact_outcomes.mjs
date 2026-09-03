#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import {
  adjudicateFrozenExactOutcomes,
  buildPpOcrV6RecognitionArchiveManifest,
  checkFrozenExactAdjudication,
  checkPpOcrV6RecognitionArchiveManifest,
} from '../../src/ocr/historicalOcrAdjudication.js'
import { canonicalHistoricalOcrJson } from '../../src/ocr/historicalOcrTeam.js'

const root = process.cwd()
const qwenPath = resolve(root, '../malang_lab/documents/Web Research Broker Lab/benchmark/historical-ocr-recognition-qwen-groq-v1/result-2026-09-03.json')
const outputDir = resolve(root, 'artifacts/historical-ocr-ppocrv6-rec')
const adjudicationPath = resolve(outputDir, 'exact-outcome-adjudication.json')
const archivePath = resolve(outputDir, 'archive-manifest.json')
const evidencePath = resolve(outputDir, 'evidence.json')

const candidates = [
  {
    workerId: 'pp-ocrv6-small-rec',
    path: resolve(root, 'artifacts/historical-ocr-ppocrv6-rec/small-run.json'),
    lineContainer: value => value.lineResults,
    lineId: line => line?.lineId,
    exact: run => run?.exactMatch,
  },
  {
    workerId: 'pp-ocrv6-medium-rec',
    path: resolve(root, 'artifacts/historical-ocr-ppocrv6-rec/medium-run.json'),
    lineContainer: value => value.lineResults,
    lineId: line => line?.lineId,
    exact: run => run?.exactMatch,
  },
  {
    workerId: 'qwen',
    path: qwenPath,
    lineContainer: value => (value.cases || []).flatMap(item => item.lines || []),
    lineId: line => line?.line_id,
    exact: run => run?.exact_match,
  },
]

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function locator(path) {
  return relative(root, path) || '.'
}

function readExactOnly(candidate) {
  const value = JSON.parse(readFileSync(candidate.path, 'utf8'))
  const lines = candidate.lineContainer(value)
  if (!Array.isArray(lines) || lines.length === 0) throw new Error(`${candidate.workerId}:line_container_invalid`)
  const exactByLine = {}
  for (const line of lines) {
    const lineId = candidate.lineId(line)
    if (typeof lineId !== 'string' || lineId.length === 0) throw new Error(`${candidate.workerId}:line_id_invalid`)
    if (Object.hasOwn(exactByLine, lineId)) throw new Error(`${candidate.workerId}:duplicate_line_id:${lineId}`)
    if (!Array.isArray(line.runs) || line.runs.length !== 2) throw new Error(`${candidate.workerId}:${lineId}:repeat_count_invalid`)
    const exactFlags = line.runs.map(run => candidate.exact(run))
    if (!exactFlags.every(flag => typeof flag === 'boolean')) throw new Error(`${candidate.workerId}:${lineId}:exact_boolean_missing`)
    exactByLine[lineId] = exactFlags
  }
  return { workerId: candidate.workerId, exactByLine }
}

function writeCanonical(path, value) {
  writeFileSync(path, canonicalHistoricalOcrJson(value), 'utf8')
}

const extracted = candidates.map(readExactOnly)
const lineIds = Object.keys(extracted[0].exactByLine)
for (const candidate of extracted.slice(1)) {
  if (canonicalHistoricalOcrJson(Object.keys(candidate.exactByLine).sort()) !== canonicalHistoricalOcrJson([...lineIds].sort())) {
    throw new Error(`${candidate.workerId}:frozen_line_set_mismatch`)
  }
}

const adjudication = adjudicateFrozenExactOutcomes({ lineIds, candidates: extracted })
const adjudicationErrors = checkFrozenExactAdjudication(adjudication)
if (adjudicationErrors.length > 0) throw new Error(`adjudication_invalid:${adjudicationErrors.join(',')}`)

const sourceArtifacts = candidates.slice(0, 2).map(candidate => ({
  workerId: candidate.workerId,
  path: locator(candidate.path),
  sha256: sha256File(candidate.path),
  retained: true,
}))
sourceArtifacts.push({
  workerId: 'pp-ocrv6-rec',
  artifactKind: 'contract-evidence',
  path: locator(evidencePath),
  sha256: sha256File(evidencePath),
  retained: true,
})
const comparisonSources = [{
  workerId: 'qwen',
  path: locator(qwenPath),
  sha256: sha256File(qwenPath),
  comparisonOnly: true,
  rawPredictionTextRetained: false,
}]
const archive = buildPpOcrV6RecognitionArchiveManifest({
  adjudication,
  adjudicationPath: locator(adjudicationPath),
  sourceArtifacts,
  comparisonSources,
})
const archiveErrors = checkPpOcrV6RecognitionArchiveManifest(archive, { adjudication })
if (archiveErrors.length > 0) throw new Error(`archive_manifest_invalid:${archiveErrors.join(',')}`)

writeCanonical(adjudicationPath, adjudication)
writeCanonical(archivePath, archive)
console.log(JSON.stringify({
  adjudicationPath: locator(adjudicationPath),
  archivePath: locator(archivePath),
  exactOnly: true,
  uniqueTextAnswerStatus: adjudication.overall.uniqueTextAnswerStatus,
  ppOcrv6UniqueExactLineCount: adjudication.overall.ppOcrv6UniqueExactLineCount,
  qwenUniqueExactLineCount: adjudication.overall.qwenUniqueExactLineCount,
  archivePpOcrv6BaseRecognition: adjudication.overall.archivePpOcrv6BaseRecognition,
  BLOCK_OCR_ROUTE: archive.routeBoundary.BLOCK_OCR_ROUTE,
  OCRProviderEnabled: archive.routeBoundary.OCRProvider.enabled,
}, null, 2))
