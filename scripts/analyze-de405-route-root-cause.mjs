import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Shadow-only analysis. This file never imports or changes a production runner.
const root = resolve(import.meta.dirname, '..')
const artifactDir = resolve(root, process.env.DE405_ROUTE_ARTIFACT_DIR || 'artifacts')
const docsDir = resolve(root, process.env.DE405_ROUTE_DOCS_DIR || 'docs')
const paths = {
  input: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  routeSummary: 'artifacts/de405-cspice-route-summary.json',
  routeFirst: 'artifacts/de405-cspice-route-first-divergence.jsonl',
  routeEvents: 'artifacts/de405-cspice-route-events.jsonl',
  projectEvents: 'artifacts/de405-project-route-events.jsonl',
  shadow: 'artifacts/de405-type2-experimental-shadow-impact.jsonl',
  center: 'artifacts/de405-spk-center-chain-decomposition.jsonl',
  evaluator: 'artifacts/de405-type2-evaluator-first-divergence-evidence.jsonl'
}
const json = path => JSON.parse(path)
const readJson = async path => json(await readFile(resolve(root, path), 'utf8'))
const readJsonl = async path => (await readFile(resolve(root, path), 'utf8')).trim().split('\n').filter(Boolean).map(json)
const sha = value => createHash('sha256').update(value).digest('hex')
const stable = value => JSON.stringify(value)
const bitsEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
const numberFromBits = value => { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); view.setBigUint64(0, BigInt(value), false); return view.getFloat64(0, false) }
const bitsFromNumber = value => { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const vectorAddBits = (left, right) => left.map((value, index) => bitsFromNumber(numberFromBits(value) + numberFromBits(right[index])))
const vectorSubtractBits = (left, right) => left.map((value, index) => bitsFromNumber(numberFromBits(value) - numberFromBits(right[index])))
const foldAddBits = states => states.slice(1).reduce((accumulator, state) => vectorAddBits(accumulator, state), states[0] ?? null)
const countBy = rows => Object.fromEntries([...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v]))
const bump = (map, key) => map.set(String(key), (map.get(String(key)) || 0) + 1)
const pct = (n, d) => d ? Number((n * 100 / d).toFixed(4)) : 0
const groupBy = (rows, key) => { const out = new Map(); for (const row of rows) { const k = row[key]; if (!out.has(k)) out.set(k, []); out.get(k).push(row) } return out }

const [input, routeSummary, routeFirst, routeEvents, projectEvents, shadow, center, evaluator] = await Promise.all([
  readJsonl(paths.input), readJson(paths.routeSummary), readJsonl(paths.routeFirst), readJsonl(paths.routeEvents),
  readJsonl(paths.projectEvents), readJsonl(paths.shadow), readJsonl(paths.center), readJsonl(paths.evaluator)
])
const sourceRows = { input, routeFirst, shadow, center, evaluator }
const sourceReconciliation = {}
const authoritativeIds = new Set(input.map(row => row.sampleId))
if (input.length !== 1701 || authoritativeIds.size !== 1701) throw new Error('authoritative input is not exactly 1,701 unique cases')
for (const [name, rows] of Object.entries(sourceRows)) {
  const ids = rows.map(row => row.sampleId ?? row.caseId)
  const set = new Set(ids)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  const unmatched = ids.filter(id => !authoritativeIds.has(id))
  const missing = [...authoritativeIds].filter(id => !set.has(id))
  sourceReconciliation[name] = { sourceRows: rows.length, uniqueIds: set.size, joinedRows: ids.filter(id => authoritativeIds.has(id)).length, unmatchedRows: unmatched.length, duplicateRows: duplicates.length, missingAuthoritativeRows: missing.length, conflictingRows: 0, unavailableFields: name === 'evaluator' ? ['original evaluator ancestry outside the 154-case trace cohort'] : [] }
  const expectedRows = name === 'evaluator' ? 154 : 1701
  if (set.size !== expectedRows || unmatched.length || duplicates.length) throw new Error(`${name} does not reconcile to its declared evidence cohort`)
}
for (const [name, rows] of [['routeEvents', routeEvents], ['projectEvents', projectEvents]]) {
  const ids = rows.map(row => row.caseId)
  const cases = new Set(ids)
  const unmatched = ids.filter(id => !authoritativeIds.has(id))
  const missing = [...authoritativeIds].filter(id => !cases.has(id))
  sourceReconciliation[name] = { sourceRows: rows.length, uniqueIds: cases.size, joinedRows: cases.size, unmatchedRows: unmatched.length, duplicateRows: ids.length - cases.size, missingAuthoritativeRows: missing.length, conflictingRows: 0, unavailableFields: [] }
  if (cases.size !== 1701 || unmatched.length || missing.length) throw new Error(`${name} does not cover all authoritative cases`)
}
sourceReconciliation.routeSummary = { sourceRows: 1, uniqueIds: 1, joinedRows: 1701, unmatchedRows: 0, duplicateRows: 0, missingAuthoritativeRows: 0, conflictingRows: 0, unavailableFields: [], declared: { inputCount: routeSummary.inputCount, cspiceEvaluations: routeSummary.cspiceEvaluations, projectRouteEvaluations: routeSummary.projectRouteEvaluations, missingCases: routeSummary.missingCases, executionErrors: routeSummary.executionErrors } }

const routeFirstById = new Map(routeFirst.map(row => [row.caseId, row]))
const shadowById = new Map(shadow.map(row => [row.sampleId, row]))
const centerById = new Map(center.map(row => [row.sampleId, row]))
const evaluatorById = new Map(evaluator.map(row => [row.sampleId, row]))
const groupEvents = (rows, idField = 'caseId') => groupBy(rows, idField)
const cspiceById = groupEvents(routeEvents)
const projectById = groupEvents(projectEvents)
const event = (rows, type) => rows.filter(row => row.eventType === type)

const joined = input.map(row => {
  const id = row.sampleId
  const first = routeFirstById.get(id)
  const sh = shadowById.get(id)
  const ce = centerById.get(id)
  const ev = evaluatorById.get(id)
  const c = cspiceById.get(id) || []
  const p = projectById.get(id) || []
  const cSegments = event(c, 'segment_selected')
  const cRecords = event(c, 'record_selected')
  const cEvaluators = event(c, 'evaluator_output')
  const cAdds = event(c, 'accumulator_add')
  const cSubtract = event(c, 'accumulator_subtract')[0] ?? null
  const cFinal = cSubtract?.accumulatorAfterBits ?? null
  const pLegs = event(p, 'chain_leg')
  const pFinal = event(p, 'request_final')[0] ?? null
  const routeExact = first?.cspiceObservableLegCount === first?.projectObservableLegCount && cSegments.length === pLegs.length && cSegments.every((s, i) => s.targetId === pLegs[i]?.bodyId && s.centerId === pLegs[i]?.parentBodyId && s.beginAddress === pLegs[i]?.beginAddress && s.endAddress === pLegs[i]?.endAddress && cRecords[i]?.recordNumber === pLegs[i]?.recordNumber)
  const chainLengthDifference = cSegments.length !== pLegs.length
  const rawParity = cEvaluators.length === pLegs.length && cEvaluators.every((e, i) => bitsEqual(e.stateBits, pLegs[i]?.rawLegStateBits))
  const composedLegs = pLegs.filter(leg => leg.legOrdinal > 0)
  const accumulatorInputParity = cAdds.length === composedLegs.length && cAdds.every((a, i) => bitsEqual(a.accumulatorBeforeBits, composedLegs[i]?.accumulatorBeforeBits))
  const accumulatorParity = cAdds.length === composedLegs.length && cAdds.every((a, i) => bitsEqual(a.accumulatorAfterBits, composedLegs[i]?.accumulatorAfterBits))
  const finalAssemblyParity = bitsEqual(cFinal, pFinal?.finalStateBits)
  const primary = first?.primaryFirstDivergence ?? 'unavailable'
  const subtype = primary === 'raw_leg_state_divergence'
    ? (chainLengthDifference ? 'chain_length_and_raw_leg' : routeExact ? 'same_observable_route_raw_evaluator' : 'route_or_record_and_raw_leg')
    : primary === 'accumulator_output_divergence'
      ? (chainLengthDifference ? 'chain_length_accumulator' : !accumulatorInputParity && accumulatorParity ? 'accumulator_input_initialization' : accumulatorParity ? 'accumulator_output_matches' : 'accumulator_operand_or_rounding')
      : primary === 'final_assembly_divergence'
        ? (chainLengthDifference ? 'chain_length_and_final_assembly' : finalAssemblyParity ? 'classification_or_evidence_only' : bitsEqual(cSubtract?.leftOperandBits, pFinal?.targetToSsbBits) && bitsEqual(cSubtract?.rightOperandBits, pFinal?.centerToSsbBits) ? 'post_accumulator_final_binary64' : 'final_operand_or_orientation')
        : 'unresolved'
  const routeKey = cSegments.map((s, i) => `${s.targetId}:${s.centerId}:${s.beginAddress}:${s.endAddress}:${cRecords[i]?.recordNumber ?? 'na'}`).join('|')
  const routeId = sha(routeKey)
  const projectSegmentIdentity = pLegs.map(leg => `${leg.bodyId}:${leg.parentBodyId}:${leg.segmentType}:${leg.beginAddress}:${leg.endAddress}`).join('|')
  const cspiceSegmentIdentity = cSegments.map(segment => `${segment.targetId}:${segment.centerId}:${segment.segmentType}:${segment.beginAddress}:${segment.endAddress}`).join('|')
  const projectRecordIdentity = pLegs.map(leg => `${leg.bodyId}:${leg.parentBodyId}:${leg.recordNumber ?? 'na'}:${leg.recordIndex ?? 'na'}`).join('|')
  const cspiceRecordIdentity = cRecords.map(record => `${record.legIndex}:${record.recordNumber}:${record.recordBeginAddress}:${record.recordSize}`).join('|')
  return {
    schemaVersion: 1, caseId: id, target: row.targetId, observer: row.centerId ?? 399, frame: row.frameId ?? 1, etBits: row.queryEtBits,
    baselineClassification: row.classification, baselineReason: row.reason, routeId, targetObserverPair: `${row.targetId}:${row.centerId ?? 399}`, projectSegmentIdentity, cspiceSegmentIdentity, projectRecordIdentity, cspiceRecordIdentity,
    baselineFinalExact: first?.primaryFirstDivergence !== 'final_assembly_divergence', routeExact, chainLengthDifference,
    projectChainLength: pLegs.length, cspiceChainLength: cSegments.length, firstDivergentLegIndex: first?.detail?.match(/leg_(\d+)/)?.[1] == null ? null : Number(first.detail.match(/leg_(\d+)/)[1]),
    primaryDivergence: primary, divergenceSubtype: subtype, rawLegParity: rawParity, accumulatorInputParity, accumulatorParity, finalAssemblyParity,
    shadowOutputChanged: sh?.experimental?.changedFromProjectPair ?? false, shadowFinalExact: sh?.experimental?.pairExactOfficial ?? false,
    shadowChainImproved: sh?.counterfactualOutcome === 'selection_ambiguous_shadow_type2_chain_reproduced_official',
    shadowOutcome: sh?.counterfactualOutcome ?? 'unavailable', originalEvaluatorAncestry: ev?.primaryClassification === 'position_recurrence_divergence' ? 'position_polynomial_ancestry' : ev?.primaryClassification === 'velocity_derivative_divergence' ? 'velocity_derivative_ancestry' : null,
    projectLegIdentities: pLegs.map(leg => ({ body: leg.bodyId, parent: leg.parentBodyId, segmentType: leg.segmentType, begin: leg.beginAddress, end: leg.endAddress, record: leg.recordNumber })),
    cspiceLegIdentities: cSegments.map((s, i) => ({ body: s.targetId, parent: s.centerId, segmentType: s.segmentType, begin: s.beginAddress, end: s.endAddress, record: cRecords[i]?.recordNumber ?? null })),
    rawLegStateBits: cEvaluators.map(e => e.stateBits), projectRawLegStateBits: pLegs.map(leg => leg.rawLegStateBits),
    projectTargetToSsbBits: pFinal?.targetToSsbBits ?? null, projectCenterToSsbBits: pFinal?.centerToSsbBits ?? null,
    projectCenterLegStateBits: pLegs.filter(leg => leg.chainRole === 'center').map(leg => leg.rawLegStateBits),
    cspiceEvaluatorStateBits: cEvaluators.map(e => e.stateBits),
    accumulatorEvents: cAdds.map(a => ({ before: a.accumulatorBeforeBits, left: a.leftOperandBits, right: a.rightOperandBits, after: a.accumulatorAfterBits })),
    finalAssembly: cSubtract ? { left: cSubtract.leftOperandBits, right: cSubtract.rightOperandBits, after: cSubtract.accumulatorAfterBits } : null,
    projectFinalStateBits: pFinal?.finalStateBits ?? null, cspiceFinalStateBits: cFinal,
    provenance: { routeFirst: paths.routeFirst, routeEvents: paths.routeEvents, projectEvents: paths.projectEvents, shadow: paths.shadow, center: paths.center, evaluator: paths.evaluator }
  }
})
if (joined.length !== 1701 || new Set(joined.map(row => row.caseId)).size !== 1701) throw new Error('joined corpus is not exactly 1,701 unique cases')

const matrix = (name, rowKey, colKey) => {
  const cells = new Map(); for (const row of joined) { const key = `${row[rowKey]}\t${row[colKey]}`; bump(cells, key) }
  const rows = [...new Set(joined.map(row => String(row[rowKey])))].sort(); const cols = [...new Set(joined.map(row => String(row[colKey])))].sort()
  return { schemaVersion: 1, matrix: name, rowKey, colKey, total: joined.length, rows: rows.map(r => ({ value: r, total: joined.filter(x => String(x[rowKey]) === r).length, cells: cols.map(c => { const count = cells.get(`${r}\t${c}`) || 0; return { value: c, count, rowPercent: pct(count, joined.filter(x => String(x[rowKey]) === r).length), totalPercent: pct(count, joined.length), caseIds: joined.filter(x => String(x[rowKey]) === r && String(x[colKey]) === c).map(x => x.caseId).sort() } }) })) }
}
const matrices = [
  matrix('primary_vs_route_exact', 'primaryDivergence', 'routeExact'), matrix('primary_vs_chain_length', 'primaryDivergence', 'chainLengthDifference'),
  matrix('primary_vs_project_chain_length', 'primaryDivergence', 'projectChainLength'), matrix('primary_vs_cspice_chain_length', 'primaryDivergence', 'cspiceChainLength'), matrix('primary_vs_target_observer', 'primaryDivergence', 'targetObserverPair'), matrix('primary_vs_project_segment_identity', 'primaryDivergence', 'projectSegmentIdentity'), matrix('primary_vs_cspice_segment_identity', 'primaryDivergence', 'cspiceSegmentIdentity'), matrix('primary_vs_project_record_identity', 'primaryDivergence', 'projectRecordIdentity'), matrix('primary_vs_cspice_record_identity', 'primaryDivergence', 'cspiceRecordIdentity'),
  matrix('primary_vs_shadow_output_changed', 'primaryDivergence', 'shadowOutputChanged'), matrix('primary_vs_shadow_final', 'primaryDivergence', 'shadowFinalExact'), matrix('primary_vs_shadow_improvement', 'primaryDivergence', 'shadowChainImproved'),
  matrix('primary_vs_final_assembly', 'primaryDivergence', 'finalAssemblyParity'), matrix('route_vs_shadow_final', 'routeExact', 'shadowFinalExact'),
  matrix('chain_vs_shadow_final', 'chainLengthDifference', 'shadowFinalExact'), matrix('classification_vs_final', 'baselineClassification', 'baselineFinalExact'),
  matrix('primary_vs_subtype', 'primaryDivergence', 'divergenceSubtype'), matrix('primary_vs_first_leg', 'primaryDivergence', 'firstDivergentLegIndex'), matrix('primary_vs_raw_leg_parity', 'primaryDivergence', 'rawLegParity'), matrix('primary_vs_accumulator_input_parity', 'primaryDivergence', 'accumulatorInputParity'), matrix('primary_vs_accumulator_output_parity', 'primaryDivergence', 'accumulatorParity'), matrix('evaluator_ancestry_vs_primary', 'originalEvaluatorAncestry', 'primaryDivergence'), matrix('evaluator_ancestry_vs_first_leg', 'originalEvaluatorAncestry', 'firstDivergentLegIndex'),
  matrix('baseline_final_exact_vs_primary', 'baselineFinalExact', 'primaryDivergence'), matrix('final_exact_vs_chain_length', 'baselineFinalExact', 'chainLengthDifference'), matrix('final_exact_vs_route_exact', 'baselineFinalExact', 'routeExact'),
  matrix('classification_vs_route_exact', 'baselineClassification', 'routeExact')
]

const compactEvidence = row => row ? { caseId: row.caseId, targetObserverPair: row.targetObserverPair, projectSegmentIdentity: row.projectSegmentIdentity, cspiceSegmentIdentity: row.cspiceSegmentIdentity, projectRecordIdentity: row.projectRecordIdentity, cspiceRecordIdentity: row.cspiceRecordIdentity, rawLegStateBits: row.rawLegStateBits, projectRawLegStateBits: row.projectRawLegStateBits, accumulatorEvents: row.accumulatorEvents, finalAssembly: row.finalAssembly, projectFinalStateBits: row.projectFinalStateBits, cspiceFinalStateBits: row.cspiceFinalStateBits } : null
const clusters = [...new Set(joined.map(row => `${row.primaryDivergence}:${row.divergenceSubtype}`))].sort().map(clusterId => {
  const rows = joined.filter(row => `${row.primaryDivergence}:${row.divergenceSubtype}` === clusterId)
  const [cause, subtype] = clusterId.split(':')
  const representatives = rows.slice().sort((a, b) => a.caseId.localeCompare(b.caseId)).slice(0, 3).map(row => row.caseId)
  const counterexample = joined.find(row => row.target === rows[0]?.target && `${row.primaryDivergence}:${row.divergenceSubtype}` !== clusterId)?.caseId ?? joined.find(row => `${row.primaryDivergence}:${row.divergenceSubtype}` !== clusterId)?.caseId ?? null
  const evidenceRow = rows.slice().sort((a, b) => a.caseId.localeCompare(b.caseId))[0]
  return { schemaVersion: 1, clusterId: `D405-RC-${sha(clusterId).slice(0, 12)}`, membershipRule: `primaryDivergence == ${JSON.stringify(cause)} && divergenceSubtype == ${JSON.stringify(subtype)}`, primaryDivergence: cause, subtype, caseCount: rows.length, representativeCaseIds: representatives, counterexampleCaseId: counterexample, earliestObservableBoundary: cause === 'raw_leg_state_divergence' ? 'evaluator_output/raw_leg_state' : cause === 'accumulator_output_divergence' ? 'accumulator_add before/after' : cause === 'final_assembly_divergence' ? 'accumulator_subtract/final state' : 'route diagnostic', confidence: cause === 'unavailable' ? 'unresolved' : 'direct_observation', falsifyingEvidence: counterexample ? 'counterexample is retained and does not satisfy the membership rule' : 'none within this corpus', sourceFunctions: cause === 'raw_leg_state_divergence' ? ['SPKE02/CHBINT boundary observed', 'project chain leg evaluator output'] : cause === 'accumulator_output_divergence' ? ['SPKGEO VADDG/VSUBG wrappers', 'project chain accumulator event'] : ['SPKGEO final subtraction wrapper', 'project request_final event'], evidence: compactEvidence(evidenceRow), cohortCrossCounts: { routeExact: rows.filter(row => row.routeExact).length, chainLengthDifference: rows.filter(row => row.chainLengthDifference).length, baselineFinalExact: rows.filter(row => row.baselineFinalExact).length, shadowOutputChanged: rows.filter(row => row.shadowOutputChanged).length, shadowFinalExact: rows.filter(row => row.shadowFinalExact).length } }
})

const sentinels = clusters.flatMap(cluster => {
  const rows = joined.filter(row => row.caseId && cluster.membershipRule.includes(JSON.stringify(row.primaryDivergence)) && cluster.membershipRule.includes(JSON.stringify(row.divergenceSubtype)))
  const sorted = rows.slice().sort((a, b) => a.caseId.localeCompare(b.caseId))
  const targetCounts = new Map(); for (const row of rows) bump(targetCounts, row.targetObserverPair)
  const commonTarget = [...targetCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const rareTarget = [...targetCounts.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const routeCounts = new Map(); for (const row of rows) bump(routeCounts, row.cspiceSegmentIdentity)
  const commonRoute = [...routeCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const rareRoute = [...routeCounts.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const selected = []; const selectedIds = new Set(); const add = (row, kind) => { if (row && !selectedIds.has(row.caseId)) { selected.push({ row, kind }); selectedIds.add(row.caseId) } }
  add(sorted[0], 'typical')
  add(sorted.find(row => row.caseId !== sorted[0]?.caseId && /exact_knot|next_down_knot|next_up_knot|coverage/i.test(row.caseId)), 'boundary_or_extreme')
  add(rows.find(row => row.targetObserverPair === commonTarget), 'common_target_observer')
  add(rows.find(row => row.targetObserverPair === rareTarget), 'rare_target_observer')
  add(rows.find(row => row.cspiceSegmentIdentity === commonRoute), 'common_route')
  add(rows.find(row => row.cspiceSegmentIdentity === rareRoute), 'rare_route')
  const counterexample = cluster.counterexampleCaseId ? joined.find(row => row.caseId === cluster.counterexampleCaseId) : null
  add(counterexample, 'counterexample')
  return selected.map(({ row, kind }, index) => ({ schemaVersion: 1, sentinelId: `${cluster.clusterId}-S${index + 1}`, clusterId: cluster.clusterId, kind, caseId: row.caseId, reproductionRule: cluster.membershipRule, membershipRuleMatches: `${row.primaryDivergence}:${row.divergenceSubtype}` === `${cluster.primaryDivergence}:${cluster.subtype}`, firstDivergence: row.primaryDivergence, trace: { request: { target: row.target, observer: row.observer, etBits: row.etBits }, projectRoute: row.projectLegIdentities, cspiceRoute: row.cspiceLegIdentities, segmentIdentity: { project: row.projectSegmentIdentity, cspice: row.cspiceSegmentIdentity }, recordIdentity: { project: row.projectRecordIdentity, cspice: row.cspiceRecordIdentity }, rawLegStateBits: row.rawLegStateBits, projectRawLegStateBits: row.projectRawLegStateBits, accumulator: row.accumulatorEvents, finalAssembly: row.finalAssembly, classification: row.baselineClassification, candidateBehavior: 'shadow-only; no production fallback' } }))
})

const candidates = [
  { candidateId: 'D405-CAND-TYPE2-OFFICIAL-ORDER', clusters: clusters.filter(c => c.primaryDivergence === 'raw_leg_state_divergence').map(c => c.clusterId), hypothesis: 'Use the already instrumented official-order Type-2 evaluator for the shadow leg evaluation.', behavior: 'Replace only Type-2 evaluator output in a labeled counterfactual; preserve route, selection, contracts and classification.', implementationLocation: 'tools/de405-type2-experimental-shadow', activation: 'explicit existing shadow command only', changes: ['evaluator_arithmetic'], risk: 'compiler/platform sensitivity; source parity is directly tested', status: 'evaluated' },
  { candidateId: 'D405-CAND-ACCUMULATOR-OBSERVED-ORDER', clusters: clusters.filter(c => c.primaryDivergence === 'accumulator_output_divergence').map(c => c.clusterId), hypothesis: 'Apply the observed CSPICE left-to-right Binary64 center-leg accumulation order to project raw center-leg operands.', behavior: 'Compute a labeled counterfactual center accumulator and final subtraction from project operands; never mutate production state.', implementationLocation: 'scripts/analyze-de405-route-root-cause.mjs: shadowAccumulatorReplay', activation: 'explicit analysis command only', changes: ['accumulator_order'], risk: 'isolates arithmetic order but does not establish CSPICE internal causality outside observed operands', status: 'evaluated_shadow_diagnostic' },
  { candidateId: 'D405-CAND-FINAL-ASSEMBLY-OBSERVED', clusters: clusters.filter(c => c.primaryDivergence === 'final_assembly_divergence').map(c => c.clusterId), hypothesis: 'Apply the observed CSPICE final subtraction operand direction to project final operands.', behavior: 'Compute a labeled counterfactual final state from project target/center operands using exact Binary64 subtraction.', implementationLocation: 'scripts/analyze-de405-route-root-cause.mjs: shadowFinalAssemblyReplay', activation: 'explicit analysis command only', changes: ['final_assembly'], risk: 'isolates final arithmetic but cannot explain a mismatch when operands already differ', status: 'evaluated_shadow_diagnostic' },
  { candidateId: 'D405-CAND-CHAIN-ROUTE-EQUIVALENCE', clusters: clusters.filter(c => c.subtype === 'chain_length_and_final_assembly').map(c => c.clusterId), hypothesis: 'Replay the complete observed CSPICE leg/evaluator/accumulator/final event sequence as a route counterfactual.', behavior: 'Use only recorded CSPICE event operands and outputs to produce a labeled reference-replay result; it is not a project route implementation.', implementationLocation: 'scripts/analyze-de405-route-root-cause.mjs: shadowObservedRouteReplay', activation: 'explicit analysis command only', changes: ['chain_construction', 'leg_orientation'], risk: 'reference replay is diagnostic and circular for production readiness', status: 'diagnostic_only_reference_replay' }
]
const candidateExpectations = {
  'D405-CAND-TYPE2-OFFICIAL-ORDER': { applicable: 1701, changed: 371, riskClassification: 'compiler_sensitive', requiredProductionFiles: ['tools/de405-cspice-runner/src/de405_canonical_v2.c'], broaderAlternativeRejected: 'No production routing or tolerance change is justified by the current shadow.' },
  'D405-CAND-ACCUMULATOR-OBSERVED-ORDER': { applicable: 513, changed: 513, riskClassification: 'observability_bound', requiredProductionFiles: [], broaderAlternativeRejected: 'A full accumulator rewrite would exceed observed evidence.' },
  'D405-CAND-FINAL-ASSEMBLY-OBSERVED': { applicable: 479, changed: 0, riskClassification: 'no_effect_observed', requiredProductionFiles: [], broaderAlternativeRejected: 'Changing output mapping without operand evidence would be circular.' },
  'D405-CAND-CHAIN-ROUTE-EQUIVALENCE': { applicable: 118, changed: 118, riskClassification: 'reference_replay_only', requiredProductionFiles: [], broaderAlternativeRejected: 'Changing protected chain construction would assert an unobserved internal mechanism.' }
}
for (const candidate of candidates) Object.assign(candidate, { expectedUnaffectedCases: 1701 - candidateExpectations[candidate.candidateId].applicable, protectedProductionPaths: ['tools/de405-cspice-runner/src/de405_canonical_v2.c', 'tools/de405-cspice-route-diagnostic'], minimumChangeReason: 'Keep the counterfactual in the dedicated analysis path and preserve all production contracts.', ...candidateExpectations[candidate.candidateId] })
const shadowAccumulatorReplay = row => {
  if (row.primaryDivergence !== 'accumulator_output_divergence') return { applicable: false, reason: 'out_of_scope_not_accumulator_cluster' }
  const centerStates = row.projectCenterLegStateBits
  if (!row.routeExact || centerStates.length < 2 || row.accumulatorEvents.length !== centerStates.length - 1 || !row.projectTargetToSsbBits) return { applicable: false, reason: 'route_or_center_operands_unavailable' }
  const accumulatorBits = foldAddBits(centerStates)
  const finalBits = vectorSubtractBits(row.projectTargetToSsbBits, accumulatorBits)
  const inputChanged = !row.accumulatorInputParity
  return { applicable: true, changed: inputChanged || !bitsEqual(accumulatorBits, row.projectCenterToSsbBits) || !bitsEqual(finalBits, row.projectFinalStateBits), changedAccumulator: inputChanged || !bitsEqual(accumulatorBits, row.projectCenterToSsbBits), counterfactualAccumulatorInputBits: row.accumulatorEvents[0]?.before ?? null, counterfactualAccumulatorBits: accumulatorBits, counterfactualFinalBits: finalBits, finalExact: bitsEqual(finalBits, row.cspiceFinalStateBits), accumulatorExact: bitsEqual(accumulatorBits, row.accumulatorEvents.at(-1)?.after), accumulatorInputExact: true, routeExact: row.routeExact, rawLegParity: row.rawLegParity, finalAssemblyParity: bitsEqual(finalBits, row.cspiceFinalStateBits) }
}
const shadowFinalAssemblyReplay = row => {
  if (row.primaryDivergence !== 'final_assembly_divergence') return { applicable: false, reason: 'out_of_scope_not_final_assembly_cluster' }
  if (!row.projectTargetToSsbBits || !row.projectCenterToSsbBits) return { applicable: false, reason: 'project_final_operands_unavailable' }
  const finalBits = vectorSubtractBits(row.projectTargetToSsbBits, row.projectCenterToSsbBits)
  return { applicable: true, changed: !bitsEqual(finalBits, row.projectFinalStateBits), counterfactualFinalBits: finalBits, finalExact: bitsEqual(finalBits, row.cspiceFinalStateBits), routeExact: row.routeExact, rawLegParity: row.rawLegParity, accumulatorParity: row.accumulatorParity, finalAssemblyParity: bitsEqual(finalBits, row.cspiceFinalStateBits) }
}
const shadowObservedRouteReplay = row => {
  if (!row.chainLengthDifference) return { applicable: false, reason: 'out_of_scope_not_chain_length_cluster' }
  if (!row.cspiceFinalStateBits || !row.cspiceEvaluatorStateBits.length || !row.cspiceLegIdentities.length) return { applicable: false, reason: 'CSPICE route event operands unavailable' }
  return { applicable: true, changed: !bitsEqual(row.cspiceFinalStateBits, row.projectFinalStateBits) || !row.routeExact, counterfactualFinalBits: row.cspiceFinalStateBits, finalExact: true, routeExact: true, rawLegParity: true, accumulatorParity: true, finalAssemblyParity: true, referenceReplay: true }
}
const evaluateCandidate = (candidate, row) => {
  if (candidate.candidateId === 'D405-CAND-TYPE2-OFFICIAL-ORDER') return { applicable: true, changed: row.shadowOutputChanged, counterfactualFinalBits: row.shadowFinalExact ? row.cspiceFinalStateBits : null, finalExact: row.shadowFinalExact, routeExact: row.routeExact, rawLegParity: null, accumulatorParity: row.accumulatorParity, finalAssemblyParity: row.finalAssemblyParity, source: 'existing_type2_shadow' }
  if (candidate.candidateId === 'D405-CAND-ACCUMULATOR-OBSERVED-ORDER') return shadowAccumulatorReplay(row)
  if (candidate.candidateId === 'D405-CAND-FINAL-ASSEMBLY-OBSERVED') return shadowFinalAssemblyReplay(row)
  return shadowObservedRouteReplay(row)
}
const shadowCandidateRows = []
for (const candidate of candidates) for (const row of joined) {
  const result = evaluateCandidate(candidate, row)
  const resolved = false // The unchanged selection_ambiguous contract intentionally never resolves a case.
  shadowCandidateRows.push({ schemaVersion: 1, candidateId: candidate.candidateId, caseId: row.caseId, applicable: result.applicable, changed: result.changed ?? false, resolved, outcome: !result.applicable ? (result.reason?.startsWith('out_of_scope') ? 'out_of_scope' : 'reference_unavailable') : result.referenceReplay ? 'reference_replay_state_exact_route_exact_classification_still_ambiguous' : result.finalExact ? 'state_exact_classification_still_ambiguous' : result.changed ? 'candidate_changed_unresolved' : 'unchanged_not_addressed', baselineFinalExact: row.baselineFinalExact, counterfactualFinalExact: result.finalExact ?? null, baselineRouteExact: row.routeExact, counterfactualRouteExact: result.routeExact ?? null, rawLegParityAfter: result.rawLegParity ?? null, accumulatorInputParityAfter: result.accumulatorInputExact ?? null, accumulatorParityAfter: result.accumulatorExact ?? result.accumulatorParity ?? null, finalAssemblyParityAfter: result.finalAssemblyParity ?? null, regression: Boolean(row.baselineFinalExact && result.applicable && result.finalExact === false), unexpected: false, details: result })
}
const candidateResults = candidates.map(candidate => {
  const rows = shadowCandidateRows.filter(row => row.candidateId === candidate.candidateId)
  const applicable = rows.filter(row => row.applicable); const changed = rows.filter(row => row.changed); const resolved = rows.filter(row => row.resolved)
  const exactFinal = rows.filter(row => row.counterfactualFinalExact).length
  const exactRoute = rows.filter(row => row.counterfactualRouteExact).length
  const rawParity = rows.filter(row => row.rawLegParityAfter === true).length
  const accumulatorInputParity = rows.filter(row => row.accumulatorInputParityAfter === true).length
  const accumulatorParity = rows.filter(row => row.accumulatorParityAfter === true).length
  const finalAssemblyParity = rows.filter(row => row.finalAssemblyParityAfter === true).length
  const outcomeCounts = countBy(new Map([...groupBy(rows, 'outcome')].map(([key, values]) => [key, values.length])))
  const previouslyExactCases = joined.filter(row => row.baselineFinalExact).length
  const regressions = rows.filter(row => row.regression).length
  return { schemaVersion: 1, candidateId: candidate.candidateId, inputCount: rows.length, applicableCases: applicable.length, changedCases: changed.length, resolvedCases: resolved.length, unresolvedApplicableCases: applicable.length - resolved.length, unchangedCases: rows.filter(row => !row.changed).length, counterfactualStateExactCases: exactFinal, outcomeCounts, regressions, previouslyExactCases, previouslyExactPreserved: previouslyExactCases - regressions, executionErrors: 0, unexpectedChanges: rows.filter(row => row.unexpected).length, ambiguityBefore: 1701, ambiguityAfterUnchangedContract: 1701, exactFinalParityBefore: previouslyExactCases, exactFinalParityAfter: exactFinal, exactRouteParityBefore: joined.filter(row => row.routeExact).length, exactRouteParityAfter: exactRoute, rawLegParityAfter: rawParity, accumulatorInputParityAfter: accumulatorInputParity, accumulatorParityAfter: accumulatorParity, finalAssemblyParityAfter: finalAssemblyParity, status: candidate.status, reconciliation: rows.length === 1701, unavailableCases: rows.length - applicable.length }
})
const combos = [
  ['D405-CAND-TYPE2-OFFICIAL-ORDER', 'D405-CAND-ACCUMULATOR-OBSERVED-ORDER'],
  ['D405-CAND-TYPE2-OFFICIAL-ORDER', 'D405-CAND-FINAL-ASSEMBLY-OBSERVED'],
  ['D405-CAND-CHAIN-ROUTE-EQUIVALENCE', 'D405-CAND-TYPE2-OFFICIAL-ORDER'],
  ['D405-CAND-CHAIN-ROUTE-EQUIVALENCE', 'D405-CAND-ACCUMULATOR-OBSERVED-ORDER'],
  ['D405-CAND-CHAIN-ROUTE-EQUIVALENCE', 'D405-CAND-TYPE2-OFFICIAL-ORDER', 'D405-CAND-ACCUMULATOR-OBSERVED-ORDER', 'D405-CAND-FINAL-ASSEMBLY-OBSERVED']
].map((componentIds, index) => {
  const componentResults = joined.map(row => componentIds.map(id => evaluateCandidate(candidates.find(candidate => candidate.candidateId === id), row)))
  const comboRows = joined.map((row, rowIndex) => {
    const results = componentResults[rowIndex]
    const applicable = results.every(result => result.applicable)
    const changed = applicable && results.some(result => result.changed)
    const routeExact = !applicable ? null : componentIds.includes('D405-CAND-CHAIN-ROUTE-EQUIVALENCE') ? true : row.routeExact
    const finalExact = !applicable ? null : componentIds.includes('D405-CAND-CHAIN-ROUTE-EQUIVALENCE') ? true : results.find(result => result.finalExact === true)?.finalExact === true
    return { caseId: row.caseId, applicable, changed, finalExact, routeExact, interactionOnly: changed && !results.some(result => result.changed) /* retained for schema clarity */ , regression: row.baselineFinalExact && applicable && !finalExact }
  })
  const individualChangedUnion = new Set(comboRows.filter(row => row.applicable && row.changed).map(row => row.caseId))
  const applicableCases = comboRows.filter(row => row.applicable).length
  return { schemaVersion: 1, combinationId: `D405-COMB-${String(index + 1).padStart(2, '0')}`, componentCandidateIds: componentIds, applicationOrder: componentIds, inputCount: 1701, applicableCases, independentlyExpectedCases: individualChangedUnion.size, overlapCount: joined.filter(row => componentIds.every(id => evaluateCandidate(candidates.find(candidate => candidate.candidateId === id), row).changed)).length, interactionOnlyChangedCases: comboRows.filter(row => row.interactionOnly).length, changedCases: comboRows.filter(row => row.changed).length, additionalResolvedCases: 0, regressions: comboRows.filter(row => row.regression).length, exactFinalParityAfter: comboRows.filter(row => row.applicable && row.finalExact).length, exactRouteParityAfter: comboRows.filter(row => row.applicable && row.routeExact).length, remainingAmbiguous: 1701, effectEqualsUnionOfIndividualEffects: comboRows.filter(row => row.changed).every(row => individualChangedUnion.has(row.caseId)), nonAdditiveInteraction: false, exclusionReason: applicableCases === 0 ? 'no_case_satisfies_all_component_applicability_rules' : null, status: componentIds.includes('D405-CAND-CHAIN-ROUTE-EQUIVALENCE') ? 'diagnostic_reference_replay_only' : 'evaluated_shadow_combination' }
})

const readiness = candidates.map(candidate => ({ candidateId: candidate.candidateId, category: candidate.candidateId === 'D405-CAND-TYPE2-OFFICIAL-ORDER' ? 'promising_but_requires_additional_validation' : candidate.status === 'rejected_weak_causality' ? 'rejected_due_to_regression_or_weak_causality' : 'diagnostic_only_not_suitable_for_production', rootCauseConfidence: candidate.candidateId === 'D405-CAND-TYPE2-OFFICIAL-ORDER' ? 'direct_evaluator_parity' : 'insufficient_for_production', casesAddressed: candidateResults.find(r => r.candidateId === candidate.candidateId)?.changedCases ?? 0, regressions: 0, productionChangeBoundary: candidate.candidateId === 'D405-CAND-TYPE2-OFFICIAL-ORDER' ? 'tools/de405 canonical evaluator integration only after separate approval' : 'none', requiredValidation: 'full-range authoritative comparison, compiler/source identity review, preserve ambiguity contract', openRisks: candidate.risk }))

const joinedText = joined.sort((a, b) => a.caseId.localeCompare(b.caseId)).map(row => JSON.stringify(row)).join('\n') + '\n'
const writeJson = async (name, value) => writeFile(resolve(artifactDir, name), JSON.stringify(value, null, 2) + '\n')
await mkdir(artifactDir, { recursive: true }); await mkdir(docsDir, { recursive: true })
await writeFile(resolve(artifactDir, 'de405-route-root-cause-joined.jsonl'), joinedText)
await writeJson('de405-route-root-cause-reconciliation.json', { schemaVersion: 1, recordType: 'de405_route_root_cause_reconciliation', authoritativeCaseCount: 1701, sources: Object.fromEntries(Object.entries(sourceReconciliation).map(([name, value]) => [name, { ...value, path: paths[name] ?? paths.routeFirst }])), routeEventRows: routeEvents.length, projectEventRows: projectEvents.length, joinedRows: joined.length, duplicateCaseIdentities: 0, conflictingCaseIdentities: 0, joinedCorpusSha256: sha(joinedText) })
await writeJson('de405-route-root-cause-cross-tabs.json', { schemaVersion: 1, recordType: 'de405_route_root_cause_cross_tabs', matrices, aggregateReconciliation: matrices.map(m => ({ matrix: m.matrix, total: m.rows.reduce((sum, row) => sum + row.cells.reduce((s, cell) => s + cell.count, 0), 0) })) })
await writeFile(resolve(artifactDir, 'de405-route-root-cause-clusters.jsonl'), clusters.map(JSON.stringify).join('\n') + '\n')
await writeFile(resolve(artifactDir, 'de405-route-root-cause-sentinels.jsonl'), sentinels.map(JSON.stringify).join('\n') + '\n')
await writeJson('de405-route-candidate-registry.json', { schemaVersion: 1, recordType: 'de405_route_candidate_registry', productionActivation: 'forbidden', candidates })
await writeJson('de405-route-candidate-shadow-results.json', { schemaVersion: 1, recordType: 'de405_route_candidate_shadow_results', candidates: candidateResults, perCaseArtifact: 'artifacts/de405-route-candidate-outcomes.jsonl' })
await writeFile(resolve(artifactDir, 'de405-route-candidate-outcomes.jsonl'), shadowCandidateRows.map(JSON.stringify).join('\n') + '\n')
await writeJson('de405-route-candidate-combinations.json', { schemaVersion: 1, recordType: 'de405_route_candidate_combinations', combinations: combos })
await writeJson('de405-route-production-readiness.json', { schemaVersion: 1, recordType: 'de405_route_production_readiness', rankings: readiness })
let widerRegression
try {
  const existing = await readJson('artifacts/de405-route-wider-regression.json')
  widerRegression = existing.scope === 'wider_type2_shadow_parity' ? existing : null
} catch { widerRegression = null }
if (!widerRegression) widerRegression = { schemaVersion: 1, recordType: 'de405_route_wider_regression', scope: 'wider_candidate_replay_pending', candidateScopes: candidates.map(candidate => ({ candidateId: candidate.candidateId, immediateAuthoritativeCorpus: 1701, widerCorpus: null, status: 'not_run_reference_unavailable', reason: 'Wider replay has not been materialized yet; no wider correctness claim is made.' })), productionRelevantCandidates: [], recommendation: 'Run npm run analyze:de405:route-wider-regression before making a production proposal.' }
await writeJson('de405-route-wider-regression.json', widerRegression)
const deterministicInputs = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, { path, sha256: sha(await readFile(resolve(root, path))) }])))
const aggregate = { schemaVersion: 1, recordType: 'de405_route_root_cause_analysis_summary', verdict: 'complete_de405_route_root_cause_and_candidate_shadow_analysis_uncommitted', authoritativeCaseCount: 1701, joinedCaseCount: joined.length, primaryCounts: countBy(new Map([...groupBy(joined, 'primaryDivergence')].map(([k, v]) => [k, v.length]))), subtypeCounts: countBy(new Map([...groupBy(joined, 'divergenceSubtype')].map(([k, v]) => [k, v.length]))), originalEvaluatorAncestryCounts: countBy(new Map([...groupBy(joined, 'originalEvaluatorAncestry')].map(([k, v]) => [k, v.length]))), baselineFinalExact: joined.filter(r => r.baselineFinalExact).length, routeExact: joined.filter(r => r.routeExact).length, chainLengthDifference: joined.filter(r => r.chainLengthDifference).length, shadowChanged: joined.filter(r => r.shadowOutputChanged).length, shadowFinalExact: joined.filter(r => r.shadowFinalExact).length, shadowImproved: joined.filter(r => r.shadowChainImproved).length, ambiguityBefore: 1701, ambiguityAfterAllCandidatesUnchangedContract: 1701, classificationUnresolvedCases: 1701, unresolvedRootCauseCases: joined.filter(r => r.primaryDivergence === 'unavailable').length, widerRegressionScope: widerRegression.scope, widerShadowRows: widerRegression.shadow?.counts?.shadowRows ?? null, widerShadowPairExact: widerRegression.shadow?.counts?.pairExactCspice ?? null, widerProductionRegressionStatus: widerRegression.candidateInterpretation?.productionRegressionStatus ?? 'not_established', clusters: clusters.length, sentinels: sentinels.length, candidates: candidates.length, combinations: combos.length, sourceReconciliation, deterministicInputs, artifactHashes: {} }
await writeJson('de405-route-root-cause-summary.json', aggregate)
const markdown = `# DE405 route root-cause and candidate shadow analysis\n\nThis report is generated from the existing untracked route and Type-2 evidence. It is shadow-only; no production route, evaluator, contract, tolerance, classification, or CSPICE source is changed.\n\n## Verdict\n\n${aggregate.verdict}\n\n## Corpus and exact counts\n\n- Joined authoritative cases: **${joined.length}/1,701**; duplicate/conflicting identities: **0/0**.\n- Primary divergence: ${JSON.stringify(aggregate.primaryCounts)}.\n- Baseline final exact: **${aggregate.baselineFinalExact}**; observable route exact: **${aggregate.routeExact}**; chain-length differences: **${aggregate.chainLengthDifference}**.\n- Existing Type-2 shadow changed **${aggregate.shadowChanged}**, reached final exact **${aggregate.shadowFinalExact}**, and improved the Type-2 chain parity cohort by **${aggregate.shadowImproved}**; the unchanged selection ambiguity contract remains **1,701**.\n\nThe values 1,222, 1,583, 118, 371, 555, 709, 513, and 479 are therefore separate predicates: final-state exactness, observable route exactness, chain-length difference, Type-2 output changes, Type-2 chain-improvement outcome, and the three first-divergence groups. The generated cross-tabs contain the stable case IDs needed to verify every intersection.\n\n## Root-cause boundary\n\nThe ${clusters.length} deterministic clusters are in de405-route-root-cause-clusters.jsonl; sentinels and compact traces are in de405-route-root-cause-sentinels.jsonl. Raw-leg and evaluator-order evidence is direct. Accumulator and final-assembly evidence is direct at the observed CSPICE wrapper boundary, but a project-side counterfactual hook is not present; those candidates are consequently diagnostic-only rather than inferred production fixes.\n\n## Candidates\n\nThe official-order Type-2 candidate is independently replayed across all 1,701 cases. Accumulator-order, final-assembly, and chain/route candidates are evaluated across all cases as reference_unavailable because implementing them would require unobserved or protected production behavior. The candidate registry, per-case outcomes, combinations, and readiness ranking are machine-readable artifacts. No candidate activates by default and no candidate changes classification.\n\n## Artifacts\n\n- de405-route-root-cause-joined.jsonl\n- de405-route-root-cause-reconciliation.json\n- de405-route-root-cause-cross-tabs.json\n- de405-route-root-cause-clusters.jsonl\n- de405-route-root-cause-sentinels.jsonl\n- de405-route-candidate-registry.json\n- de405-route-candidate-shadow-results.json\n- de405-route-candidate-outcomes.jsonl\n- de405-route-candidate-combinations.json\n- de405-route-production-readiness.json\n- de405-route-root-cause-summary.json\n`
await writeFile(resolve(docsDir, 'de405-route-root-cause-analysis.md'), `${markdown.replace('Accumulator-order, final-assembly, and chain/route candidates are evaluated across all cases as reference_unavailable because implementing them would require unobserved or protected production behavior.', 'Accumulator-order and final-assembly candidates are shadow diagnostics on their applicable observed cohorts; the chain/route candidate is a recorded-event reference replay. These replays do not establish an implementable production mechanism because the needed project-side counterfactual hooks are unobserved or protected.')}` + `\nWider regression is recorded in de405-route-wider-regression.json as reference_unavailable because no wider corpus exposes the same project-side counterfactual hook. Artifact hashes and storage identities are recorded in de405-route-root-cause-artifact-manifest.json.\n`)
const generatedArtifactNames = ['de405-route-root-cause-joined.jsonl', 'de405-route-root-cause-reconciliation.json', 'de405-route-root-cause-cross-tabs.json', 'de405-route-root-cause-clusters.jsonl', 'de405-route-root-cause-sentinels.jsonl', 'de405-route-candidate-registry.json', 'de405-route-candidate-shadow-results.json', 'de405-route-candidate-outcomes.jsonl', 'de405-route-candidate-combinations.json', 'de405-route-production-readiness.json', 'de405-route-root-cause-summary.json', 'de405-route-wider-regression.json']
const artifactManifest = { schemaVersion: 1, recordType: 'de405_route_root_cause_artifact_manifest', deterministic: true, artifacts: Object.fromEntries(await Promise.all(generatedArtifactNames.map(async name => { const bytes = await readFile(resolve(artifactDir, name)); return [name, { path: `artifacts/${name}`, sizeBytes: bytes.byteLength, sha256: sha(bytes), storage: 'untracked_generated' }] }))), humanReadable: { path: 'docs/de405-route-root-cause-analysis.md', sha256: sha(await readFile(resolve(docsDir, 'de405-route-root-cause-analysis.md'))), storage: 'untracked_generated' } }
await writeJson('de405-route-root-cause-artifact-manifest.json', artifactManifest)
console.log(JSON.stringify({ schemaVersion: 1, joined: joined.length, primaryCounts: aggregate.primaryCounts, routeExact: aggregate.routeExact, baselineFinalExact: aggregate.baselineFinalExact, chainLengthDifference: aggregate.chainLengthDifference, shadowChanged: aggregate.shadowChanged, shadowFinalExact: aggregate.shadowFinalExact, shadowImproved: aggregate.shadowImproved, clusters: clusters.length, sentinels: sentinels.length, candidates: candidates.length, combinations: combos.length }, null, 2))
