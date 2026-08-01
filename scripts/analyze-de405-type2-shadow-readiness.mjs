import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const impactPath = resolve(root, process.argv[2] || '/private/tmp/de405-type2-shadow-impact-final.jsonl')
const widerSummaryPath = resolve(root, process.argv[3] || '/private/tmp/de405-route-wider-regression-final-a.json')
const widerRowsPath = resolve(root, process.argv[4] || '/private/tmp/de405-route-wider-regression-final-a.json.rows.jsonl')
const exclusionsPath = resolve(root, process.argv[5] || 'artifacts/de405-wider-corpus-exclusion-inventory.json')
const projectRouteFidelityPath = resolve(root, process.argv[6] || '/private/tmp/de405-project-route-shadow-fidelity.json')
const determinismPath = resolve(root, process.argv[7] || 'artifacts/de405-type2-shadow-determinism.json')
const outputPath = resolve(root, process.argv[8] || 'artifacts/de405-type2-shadow-readiness.json')
const parseJsonLines = text => text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const impactRows = parseJsonLines(await readFile(impactPath, 'utf8'))
const wider = await readJson(widerSummaryPath)
const exclusions = await readJson(exclusionsPath)
const projectRouteFidelity = await readJson(projectRouteFidelityPath)
const determinism = await readJson(determinismPath)
const impactSummary = await readJson(`${impactPath}.summary.json`)
const gates = []
const gate = (name, pass, evidence) => { gates.push({ name, pass, evidence }) }
gate('impact_corpus_1701', impactRows.length === 1701, { rows: impactRows.length })
gate('impact_baseline_runner_fidelity', impactRows.every(row => row.baseline?.runnerFidelity === true), { rows: impactRows.length, mismatches: impactRows.filter(row => row.baseline?.runnerFidelity !== true).length })
gate('impact_route_invariants', impactRows.every(row => row.invariants?.routeInvariant === true), { violations: impactRows.filter(row => row.invariants?.routeInvariant !== true).length })
gate('impact_no_unexpected', impactRows.every(row => !(row.experimental?.changedFromProjectPair && !row.experimental?.pairExactOfficial && row.baseline?.projectPairExactOfficial)), { unexpected: impactRows.filter(row => row.experimental?.changedFromProjectPair && !row.experimental?.pairExactOfficial && row.baseline?.projectPairExactOfficial).length })
gate('impact_established_aggregate_reconciliation', impactSummary.baselineReproductionCount === 1222 && impactSummary.shadowOfficialPairParityCount === 1583 && impactSummary.shadowOutputChangedFromProductionCount === 371 && impactSummary.shadowResolvedCount === 361 && impactSummary.unexpectedChangeCount === 0 && impactSummary.inputCount === 1701, { inputCount: impactSummary.inputCount, baselineExact: impactSummary.baselineReproductionCount, candidateExact: impactSummary.shadowOfficialPairParityCount, changed: impactSummary.shadowOutputChangedFromProductionCount, resolved: impactSummary.shadowResolvedCount, regressions: impactSummary.unexpectedChangeCount })
gate('wider_corpus_150671', wider.shadow?.counts?.shadowRows === 150671, { rows: wider.shadow?.counts?.shadowRows })
gate('wider_no_missing_or_execution_errors', wider.shadow?.counts?.missingRows === 0 && wider.shadow?.counts?.executionErrors === 0, { missingRows: wider.shadow?.counts?.missingRows, executionErrors: wider.shadow?.counts?.executionErrors })
gate('wider_no_candidate_regressions', wider.shadow?.counts?.candidateRegressed === 0, { candidateRegressed: wider.shadow?.counts?.candidateRegressed })
gate('wider_no_route_invariant_violations', wider.shadow?.counts?.routeInvariantViolations === 0, { violations: wider.shadow?.counts?.routeInvariantViolations })
gate('wider_transition_reconciliation', Object.values(wider.shadow?.counts?.transitionCounts || {}).reduce((sum, count) => sum + count, 0) === wider.shadow?.counts?.shadowRows, { transitionCounts: wider.shadow?.counts?.transitionCounts })
gate('exclusion_reconciliation', exclusions.theoreticalRows - exclusions.excludedCount === exclusions.manifestRows && exclusions.status === 'complete', { theoreticalRows: exclusions.theoreticalRows, excludedCount: exclusions.excludedCount, manifestRows: exclusions.manifestRows, status: exclusions.status })
gate('project_route_baseline_fidelity', projectRouteFidelity.counts?.baselineFinalMismatchProbe === 0 && projectRouteFidelity.routeInvariant?.violations === 0 && projectRouteFidelity.counts?.recordIdentityMismatch === 0 && projectRouteFidelity.counts?.subintervalMismatch === 0, { baselineFinalMismatchProbe: projectRouteFidelity.counts?.baselineFinalMismatchProbe, routeInvariantViolations: projectRouteFidelity.routeInvariant?.violations, recordIdentityMismatch: projectRouteFidelity.counts?.recordIdentityMismatch, subintervalMismatch: projectRouteFidelity.counts?.subintervalMismatch })
gate('deterministic_materialization', determinism.allByteIdentical === true, { allByteIdentical: determinism.allByteIdentical, outputs: Object.keys(determinism.outputs || {}) })
const rowCounts = { rows: 0, baselineExact: 0, candidateChanged: 0, transitions: {} }
const firstDifference = { type2Arithmetic: 0, downstreamComposition: 0, unavailable: 0 }
const byEpochKind = new Map()
const rowsHash = createHash('sha256')
const input = createInterface({ input: createReadStream(widerRowsPath), crlfDelay: Infinity })
for await (const line of input) {
  if (!line.trim()) continue
  rowsHash.update(line + '\n')
  const row = JSON.parse(line)
  rowCounts.rows++
  if (row.baselineExact) rowCounts.baselineExact++
  if (row.changed) rowCounts.candidateChanged++
  rowCounts.transitions[row.transition] = (rowCounts.transitions[row.transition] || 0) + 1
  const epoch = byEpochKind.get(row.epochKind) || { total: 0, changed: 0, candidateExact: 0 }
  epoch.total++
  if (row.changed) epoch.changed++
  if (row.candidateExact) epoch.candidateExact++
  byEpochKind.set(row.epochKind, epoch)
  const legs = [...(row.targetLegs || []), ...(row.centerLegs || [])]
  const changedLeg = legs.some(leg => JSON.stringify(leg.baselineStateBits) !== JSON.stringify(leg.candidateStateBits))
  if (row.changed) {
    const differsAtType2 = legs.some(leg => leg.baselineAccumulatorBeforeBits && leg.candidateAccumulatorBeforeBits && JSON.stringify(leg.baselineAccumulatorBeforeBits) !== JSON.stringify(leg.candidateAccumulatorBeforeBits)) || changedLeg
    if (differsAtType2) firstDifference.type2Arithmetic++
    else firstDifference.downstreamComposition++
  }
}
gate('wider_rows_count', rowCounts.rows === wider.shadow?.counts?.shadowRows, { streamed: rowCounts.rows, summary: wider.shadow?.counts?.shadowRows })
gate('wider_rows_baseline_exact_inventory', rowCounts.baselineExact === wider.shadow?.counts?.baselinePairExactCspice, { streamed: rowCounts.baselineExact, summary: wider.shadow?.counts?.baselinePairExactCspice })
gate('wider_rows_changed_inventory', rowCounts.candidateChanged === wider.shadow?.counts?.candidateChanged, { streamed: rowCounts.candidateChanged, summary: wider.shadow?.counts?.candidateChanged })
gate('wider_rows_transition_sum', Object.values(rowCounts.transitions).reduce((sum, count) => sum + count, 0) === rowCounts.rows, { transitions: rowCounts.transitions })
const allPass = gates.every(item => item.pass)
const readinessCategory = allPass && firstDifference.downstreamComposition === 0 ? 'promising_but_requires_additional_validation' : 'not_ready_due_to_regression'
const summary = {
  schemaVersion: 1,
  recordType: 'de405_type2_shadow_readiness',
  readinessCategory,
  allGatesPass: allPass,
  scope: 'official_order_type2_production_equivalent_shadow_only',
  claimsForbidden: ['production_behavior_changed', 'canonical_selection_resolved', 'selection_ambiguous_rows_resolved', 'classification_contract_resolved'],
  gates,
  impact: { inputRows: impactRows.length, summary: impactSummary ? { baselineExact: impactSummary.baselineReproductionCount, candidateExact: impactSummary.shadowOfficialPairParityCount, candidateChanged: impactSummary.shadowOutputChangedFromProductionCount, candidateResolved: impactSummary.shadowResolvedCount, candidateRegressed: impactSummary.unexpectedChangeCount } : null },
  wider: { streamedRows: rowCounts.rows, baselineExact: rowCounts.baselineExact, candidateChanged: rowCounts.candidateChanged, transitionCounts: rowCounts.transitions, byEpochKind: Object.fromEntries([...byEpochKind].sort(([a], [b]) => a.localeCompare(b))), firstDifference },
  deterministicRowsSha256: rowsHash.digest('hex'),
  sourceArtifacts: { impactPath: 'de405-type2-experimental-shadow-impact.jsonl', widerSummaryPath: 'de405-route-wider-regression-shadow.json', widerRowsPath: 'de405-route-wider-regression.rows.jsonl', exclusionsPath: 'de405-wider-corpus-exclusion-inventory.json', projectRouteFidelityPath: 'de405-project-route-shadow-fidelity.json', remainingMismatchPath: 'de405-type2-shadow-remaining-mismatch.json', rootCausePath: 'de405-route-root-cause-summary.json', determinismPath: 'de405-type2-shadow-determinism.json', buildIdentityPath: 'de405-type2-shadow-build-identity.json' },
}
await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output: outputPath, readinessCategory, allGatesPass: allPass, firstDifference }, null, 2))
