import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const rowsPath = resolve(root, process.argv[2] || '/private/tmp/de405-route-wider-regression-current2.json.rows.jsonl')
const outputPath = resolve(root, process.argv[3] || 'artifacts/de405-type2-shadow-remaining-mismatch.json')
const counts = { totalRows: 0, baselineExact: 0, baselineMismatch: 0, candidateExact: 0, candidateMismatch: 0, candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, unchangedMismatch: 0, changedStillMismatch: 0, nonType2: 0, routeInvariantViolations: 0, coverageChanged: 0, errorChanged: 0 }
const byCause = new Map()
const byEpochKind = new Map()
const byTarget = new Map()
const samples = { unchangedMismatch: [], changedStillMismatch: [] }
const bump = (map, key, field = 'count') => { const value = map.get(String(key)) || { [field]: 0 }; value[field]++; map.set(String(key), value) }
const rl = createInterface({ input: createReadStream(rowsPath), crlfDelay: Infinity })
for await (const line of rl) {
  if (!line.trim()) continue
  const row = JSON.parse(line)
  counts.totalRows++
  if (row.baselineExact) counts.baselineExact++
  else counts.baselineMismatch++
  if (row.candidateExact) counts.candidateExact++
  else counts.candidateMismatch++
  if (row.changed) counts.candidateChanged++
  if (!row.baselineExact && row.candidateExact) counts.candidateResolved++
  if (row.baselineExact && !row.candidateExact) counts.candidateRegressed++
  if (!row.routeInvariant) counts.routeInvariantViolations++
  const allLegs = [...(row.targetLegs || []), ...(row.centerLegs || [])]
  if (allLegs.some(leg => leg.evaluatorType !== 2)) counts.nonType2++
  let cause = null
  if (row.transition === 'baseline_mismatch_candidate_unchanged') { cause = 'type2_same_bits_or_candidate_not_resolving_mismatch'; counts.unchangedMismatch++; if (samples.unchangedMismatch.length < 20) samples.unchangedMismatch.push(row.sampleId) }
  else if (row.transition === 'baseline_mismatch_candidate_changed_still_mismatch') { cause = 'type2_changed_but_reference_mismatch_remains'; counts.changedStillMismatch++; if (samples.changedStillMismatch.length < 20) samples.changedStillMismatch.push(row.sampleId) }
  if (cause) bump(byCause, cause)
  bump(byEpochKind, row.epochKind)
  bump(byTarget, row.targetId)
}
const summary = {
  schemaVersion: 1,
  recordType: 'de405_type2_shadow_remaining_mismatch',
  scope: 'wider_type2_production_equivalent_shadow',
  counts,
  causeClassification: Object.fromEntries([...byCause].sort(([a], [b]) => a.localeCompare(b))),
  byEpochKind: Object.fromEntries([...byEpochKind].sort(([a], [b]) => a.localeCompare(b))),
  byTarget: Object.fromEntries([...byTarget].sort(([a], [b]) => Number(a) - Number(b))),
  representativeSampleIds: samples,
  evidenceBoundary: 'The two remaining categories are transition-level classifications. No wider root-cause claim is made beyond the recorded Type-2 state-change boundary; the existing 1,701-case root-cause clusters remain the authoritative detailed cause analysis.',
  unresolved: counts.changedStillMismatch + counts.unchangedMismatch,
}
await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output: outputPath, counts, unresolved: summary.unresolved }, null, 2))
