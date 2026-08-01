import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const manifestPath = resolve(root, process.argv[2] || 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl')
const segmentsPath = resolve(root, process.argv[3] || '/private/tmp/de405-segments.jsonl')
const outputPath = resolve(root, process.argv[4] || 'artifacts/de405-wider-corpus-exclusion-inventory.json')
const parseJsonLines = text => text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
const float64Hex = value => {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setFloat64(0, value, false)
  return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}`
}
const nextFloat64 = (value, direction) => {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setFloat64(0, value, false)
  let bits = view.getBigUint64(0, false)
  if (direction > 0) bits += 1n
  else bits -= 1n
  view.setBigUint64(0, bits, false)
  return view.getFloat64(0, false)
}
const epochKinds = [
  ['record_quarter', 0.25],
  ['record_midpoint', 0.5],
  ['record_three_quarter', 0.75],
]
const manifest = parseJsonLines(await readFile(manifestPath, 'utf8'))
const segments = parseJsonLines(await readFile(segmentsPath, 'utf8'))
const manifestIds = new Set(manifest.map(row => row.sampleId))
const selectedOrdinals = [...new Set(manifest.map(row => row.segmentOrdinal))].sort((a, b) => a - b)
const selectedSegments = selectedOrdinals.map(ordinal => segments.find(row => row.segmentOrdinal === ordinal))
if (selectedSegments.some(segment => !segment)) throw new Error('segment metadata is missing a selected ordinal')
const theoreticalRows = selectedSegments.reduce((sum, segment) => sum + segment.recordCount * epochKinds.length + (segment.recordCount - 1) * 3 + 2, 0)
const excludedRows = []
const expectedInterior = []
const expectedKnot = []
const expectedCoverage = []
for (const segment of selectedSegments) {
  for (let recordIndex = 0; recordIndex < segment.recordCount; recordIndex++) {
    for (const [epochKind, fraction] of epochKinds) {
      const sampleId = `segment-${segment.segmentOrdinal}-record-${recordIndex}-${epochKind}`
      expectedInterior.push(sampleId)
      if (manifestIds.has(sampleId)) continue
      const queryEt = segment.initEt + (recordIndex + fraction) * segment.intlenSec
      const outsideStart = queryEt < segment.segmentStartEt
      const outsideEnd = queryEt > segment.segmentEndEt
      const category = outsideStart || outsideEnd ? 'out_of_coverage_producer_filter' : 'manifest_omission_not_explained_by_coverage'
      excludedRows.push({
        sampleId,
        targetId: segment.targetId,
        centerId: segment.centerId,
        frameId: segment.frameId,
        segmentOrdinal: segment.segmentOrdinal,
        recordIndex,
        epochKind,
        queryEt,
        queryEtHex: float64Hex(queryEt),
        segmentCoverageStartEt: segment.segmentStartEt,
        segmentCoverageEndEt: segment.segmentEndEt,
        coverageEvidence: { outsideStart, outsideEnd, inequality: outsideStart ? 'queryEt < segmentStartEt' : outsideEnd ? 'queryEt > segmentEndEt' : null },
        exclusionCategory: category,
        status: category === 'out_of_coverage_producer_filter' ? 'explained' : 'requires_investigation',
      })
    }
  }
  for (let knotIndex = 1; knotIndex < segment.recordCount; knotIndex++) {
    const exactEt = segment.initEt + knotIndex * segment.intlenSec
    for (const [epochKind, queryEt] of [['next_down_knot', nextFloat64(exactEt, -1)], ['exact_knot', exactEt], ['next_up_knot', nextFloat64(exactEt, 1)]]) {
      const sampleId = `segment-${segment.segmentOrdinal}-knot-${knotIndex}-${epochKind}`
      expectedKnot.push(sampleId)
      if (!manifestIds.has(sampleId)) excludedRows.push({ sampleId, segmentOrdinal: segment.segmentOrdinal, knotIndex, epochKind, queryEt, queryEtHex: float64Hex(queryEt), exclusionCategory: 'unexpected_knot_manifest_omission', status: 'requires_investigation' })
    }
  }
  for (const [recordIndex, epochKind, queryEt] of [[0, 'segment_coverage_start', segment.segmentStartEt], [segment.recordCount - 1, 'segment_coverage_end', segment.segmentEndEt]]) {
    const sampleId = `segment-${segment.segmentOrdinal}-record-${recordIndex}-${epochKind}`
    expectedCoverage.push(sampleId)
    if (!manifestIds.has(sampleId)) excludedRows.push({ sampleId, segmentOrdinal: segment.segmentOrdinal, recordIndex, epochKind, queryEt, queryEtHex: float64Hex(queryEt), exclusionCategory: 'unexpected_coverage_edge_manifest_omission', status: 'requires_investigation' })
  }
}
excludedRows.sort((a, b) => a.sampleId.localeCompare(b.sampleId))
const summary = {
  schemaVersion: 2,
  recordType: 'de405_wider_corpus_exclusion_inventory',
  sourceManifest: { path: 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl', rowCount: manifest.length },
  selectedSegmentOrdinals: selectedOrdinals,
  expectedRowBreakdown: { interiorRecordSamples: expectedInterior.length, knotSamples: expectedKnot.length, coverageEdgeSamples: expectedCoverage.length },
  theoreticalRows,
  manifestRows: manifest.length,
  excludedCount: excludedRows.length,
  excludedRows,
  countsByCategory: Object.fromEntries([...excludedRows.reduce((map, row) => map.set(row.exclusionCategory, (map.get(row.exclusionCategory) || 0) + 1), new Map())]),
  reconciliation: `${theoreticalRows} theoretical rows - ${excludedRows.length} absent manifest identities = ${manifest.length} manifest rows`,
  status: excludedRows.every(row => row.status === 'explained') ? 'complete' : 'blocked_by_unexplained_exclusions',
}
await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output: outputPath, theoreticalRows, manifestRows: manifest.length, excludedCount: excludedRows.length, status: summary.status }, null, 2))
