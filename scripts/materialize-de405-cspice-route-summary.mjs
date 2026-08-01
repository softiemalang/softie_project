import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const build = resolve(root, 'tools/de405-cspice-route-diagnostic/build')
const artifactDir = resolve(root, 'artifacts')
const parseJsonl = text => text.trim().split('\n').filter(Boolean).map(JSON.parse)
const input = parseJsonl(await readFile(resolve(build, 'ambiguous-input.jsonl'), 'utf8'))
const results = parseJsonl(await readFile(resolve(build, 'ambiguous-results.jsonl'), 'utf8'))
const uninstrumentedResults = parseJsonl(await readFile(resolve(build, 'uninstrumented-results.jsonl'), 'utf8'))
const events = parseJsonl(await readFile(resolve(build, 'ambiguous-events.jsonl'), 'utf8'))
const projectEvents = parseJsonl(await readFile(resolve(build, 'project-route-events.jsonl'), 'utf8'))
const project = parseJsonl(await readFile(resolve(root, 'artifacts/de405-spk-center-chain-decomposition.jsonl'), 'utf8'))
const prior = JSON.parse(await readFile(resolve(root, 'artifacts/de405-type2-experimental-official-order-summary.json'), 'utf8'))
const ids = new Set(input.map(row => row.sampleId))
const projectById = new Map(project.filter(row => ids.has(row.sampleId)).map(row => [row.sampleId, row]))
const resultById = new Map(results.map(row => [row.caseId, row]))
const numberBits = value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, true); return `0x${view.getBigUint64(0, true).toString(16).padStart(16, '0')}` }
const uninstrumentedById = new Map(uninstrumentedResults.map(row => [row.sampleId, row]))
let neutralityParity = 0; let neutralityMissing = 0
for (const result of results) { const uninstrumented = uninstrumentedById.get(result.caseId); if (!uninstrumented) { neutralityMissing++; continue } if (JSON.stringify(result.stateBits) === JSON.stringify((uninstrumented.stateKmKmPerSec || []).map(numberBits))) neutralityParity++ }
const groupEvents = rows => {
  const groups = new Map()
  for (const event of rows) { if (!groups.has(event.caseId)) groups.set(event.caseId, []); groups.get(event.caseId).push(event) }
  return groups
}
const groupCspiceEvents = rows => {
  const groups = new Map(); let current = null
  for (const event of rows) {
    if (event.eventType === 'request_start') { current = event.caseId; groups.set(current, [event]) }
    else if (current) groups.get(current).push(event)
  }
  return groups
}
const cspiceById = groupCspiceEvents(events)
const projectByEventId = groupEvents(projectEvents)
const bitsEqual = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
const identityOf = (event, record) => ({ targetId: event.targetId, centerId: event.centerId, frameId: event.frameId, segmentType: event.segmentType, beginAddress: event.beginAddress, endAddress: event.endAddress, recordNumber: record.recordNumber, evaluatorType: 2 })
const routeGroups = new Map()
const firstDivergence = []
const counts = {}
const secondaryCounts = {}
const breakdown = { target: {}, observer: {}, segmentType: {}, chainLength: {}, legIndex: {}, selectedSegment: {}, selectedRecord: {} }
const bump = (map, key) => { const normalized = String(key); map[normalized] = (map[normalized] || 0) + 1 }
let corpusRows = []
let exactFinalStateMatches = 0
let observableRouteIdentityExact = 0
for (const inputRow of input) {
  const caseId = inputRow.sampleId
  const cEvents = cspiceById.get(caseId) || []
  const pEvents = projectByEventId.get(caseId) || []
  const projectRow = projectById.get(caseId)
  const result = resultById.get(caseId)
  if (!projectRow || !result || cEvents.length === 0 || pEvents.length === 0) throw new Error(`missing route evidence for ${caseId}`)
  const cSegments = cEvents.filter(event => event.eventType === 'segment_selected')
  const cRecords = cEvents.filter(event => event.eventType === 'record_selected')
  const cEvaluators = cEvents.filter(event => event.eventType === 'evaluator_output')
  const cAdds = cEvents.filter(event => event.eventType === 'accumulator_add')
  const cSubtract = cEvents.find(event => event.eventType === 'accumulator_subtract')
  const cOrientation = cEvents.filter(event => event.eventType.startsWith('orientation_'))
  const pLegs = pEvents.filter(event => event.eventType === 'chain_leg')
  const pFinal = pEvents.find(event => event.eventType === 'request_final')
  if (bitsEqual(result.stateBits, projectRow.projectDirectBits || projectRow.projectStateBits || pFinal?.finalStateBits)) exactFinalStateMatches++
  if (cSegments.length === pLegs.length && cSegments.every((segment, index) => segment.targetId === pLegs[index].bodyId && segment.centerId === pLegs[index].parentBodyId && segment.frameId === pLegs[index].frameId && segment.beginAddress === pLegs[index].beginAddress && segment.endAddress === pLegs[index].endAddress && cRecords[index].recordNumber === pLegs[index].recordNumber)) observableRouteIdentityExact++
  if (cSegments.length !== pLegs.length) secondaryCounts.chain_length_divergence = (secondaryCounts.chain_length_divergence || 0) + 1
  const routeIdentity = cSegments.map((segment, index) => identityOf(segment, cRecords[index]))
  const routeKey = JSON.stringify({ legs: routeIdentity, orientation: cOrientation.map(event => event.eventType), addCount: cAdds.length })
  const routeId = createHash('sha256').update(routeKey).digest('hex')
  const projectFinalBits = projectRow.projectDirectBits || projectRow.projectStateBits || pFinal?.finalStateBits
  let primary = null
  let detail = null
  if (result.error) { primary = 'execution_error'; detail = 'instrumented_request_error' }
  else if (!bitsEqual(result.stateBits, projectFinalBits)) { primary = 'final_assembly_divergence'; detail = 'project_and_cspice_final_state_bits_differ' }
  else if (cSegments.length !== pLegs.length) { primary = 'chain_length_divergence'; detail = `cspice_${cSegments.length}_legs_project_${pLegs.length}_legs` }
  else {
    for (let i = 0; i < pLegs.length; i++) {
      const c = cSegments[i]; const r = cRecords[i]; const e = cEvaluators[i]; const p = pLegs[i]
      if (c.targetId !== p.bodyId || c.centerId !== p.parentBodyId || c.frameId !== p.frameId || c.beginAddress !== p.beginAddress || c.endAddress !== p.endAddress) { primary = 'segment_selection_divergence'; detail = `leg_${i}`; break }
      if (r.recordNumber !== p.recordNumber) { primary = 'record_selection_divergence'; detail = `leg_${i}`; break }
      if (!bitsEqual(e.stateBits, p.rawLegStateBits)) { primary = 'raw_leg_state_divergence'; detail = `leg_${i}`; break }
    }
    if (!primary) {
      const pComposed = pLegs.filter(leg => leg.legOrdinal > 0)
      if (cAdds.length !== pComposed.length) { primary = 'accumulator_operation_divergence'; detail = 'addition_count' }
      else for (let i = 0; i < cAdds.length; i++) if (!bitsEqual(cAdds[i].accumulatorAfterBits, pComposed[i].accumulatorAfterBits) || !bitsEqual(cAdds[i].accumulatorBeforeBits, pComposed[i].accumulatorBeforeBits)) { primary = 'accumulator_output_divergence'; detail = `addition_${i}`; break }
    }
    if (!primary && cSubtract && (!bitsEqual(cSubtract.leftOperandBits, projectRow.projectTargetToSsbBits) || !bitsEqual(cSubtract.rightOperandBits, projectRow.projectCenterToSsbBits))) { primary = 'final_assembly_divergence'; detail = 'final_subtraction_operands' }
  }
  if (!primary) primary = 'route_exact_final_exact'
  counts[primary] = (counts[primary] || 0) + 1
  bump(breakdown.target, inputRow.targetId); bump(breakdown.observer, inputRow.centerId ?? 399); bump(breakdown.chainLength, cSegments.length)
  for (let i = 0; i < cSegments.length; i++) { bump(breakdown.legIndex, i); bump(breakdown.segmentType, cSegments[i].segmentType); bump(breakdown.selectedSegment, `${cSegments[i].targetId}:${cSegments[i].centerId}:${cSegments[i].beginAddress}:${cSegments[i].endAddress}`); bump(breakdown.selectedRecord, `${cSegments[i].targetId}:${cRecords[i].recordNumber}`) }
  if (!routeGroups.has(routeId)) routeGroups.set(routeId, { routeId, routeKey, sourceCases: [], firstDivergence: {} })
  const group = routeGroups.get(routeId); group.sourceCases.push(caseId); group.firstDivergence[primary] = (group.firstDivergence[primary] || 0) + 1
  firstDivergence.push({ schemaVersion: 1, caseId, primaryFirstDivergence: primary, detail, routeId, cspiceObservableLegCount: cSegments.length, projectObservableLegCount: pLegs.length, finalStateBits: result.stateBits })
  corpusRows.push({ caseId, routeId, primary })
}
if (input.length !== 1701 || results.length !== 1701 || projectById.size !== 1701 || firstDivergence.length !== 1701) throw new Error('authoritative corpus does not reconcile to 1701')
await mkdir(artifactDir, { recursive: true })
const eventText = await readFile(resolve(build, 'ambiguous-events.jsonl'))
const resultText = await readFile(resolve(build, 'ambiguous-results.jsonl'))
const projectEventText = await readFile(resolve(build, 'project-route-events.jsonl'))
const manifestText = await readFile(resolve(build, 'route-build.json'))
const manifest = JSON.parse(manifestText)
const routeMap = { schemaVersion: 1, recordType: 'de405_cspice_route_map', publicEntryPoint: { function: 'spkez_c', sourceFile: 'CSPICE_N0067/src/cspice/spkez_c.c', role: 'C wrapper entry', instrumentation: 'linked uninstrumented' }, functions: [
  { function: 'spkez_', sourceFile: 'CSPICE_N0067/src/cspice/spkez.c', role: 'state request and aberration dispatch', instrumentation: 'linked uninstrumented' },
  { function: 'spkgeo_', sourceFile: 'CSPICE_N0067/src/cspice/spkgeo.c', role: 'target/observer center-chain traversal, frame branches, final subtraction', instrumentation: 'copied diagnostic source; VADDG/VSUBG/MOVED/MXV/MXVG event wrappers' },
  { function: 'spksfs_', sourceFile: 'CSPICE_N0067/src/cspice/spkbsr.c', role: 'loaded-SPK segment search and priority selection', instrumentation: 'linked uninstrumented; selected descriptor observed at SPKPVN boundary' },
  { function: 'spkpvn_', sourceFile: 'CSPICE_N0067/src/cspice/spkpvn.c', role: 'descriptor unpack and evaluator dispatch', instrumentation: 'copied diagnostic source; segment event' },
  { function: 'spkr02_', sourceFile: 'CSPICE_N0067/src/cspice/spkr02.c', role: 'Type 2 record number and DAF address selection', instrumentation: 'copied diagnostic source; record event' },
  { function: 'spke02_', sourceFile: 'CSPICE_N0067/src/cspice/spke02.c', role: 'Type 2 evaluator', instrumentation: 'copied diagnostic source; evaluator state event' },
  { function: 'chbint_', sourceFile: 'CSPICE_N0067/src/cspice/chbint.c', role: 'Chebyshev interpolation called by SPKE02', instrumentation: 'linked uninstrumented' }
].map(entry => ({ ...entry, sourceSha256: manifest.routeSourceFiles[entry.sourceFile.split('/').pop()] || null, floatingPointBehavior: entry.instrumentation.includes('wrapper') || entry.instrumentation.includes('event') ? 'event emission outside arithmetic expressions' : 'unchanged linked source' })) }
const inventory = [...routeGroups.values()].sort((a, b) => a.routeId.localeCompare(b.routeId)).map(route => ({ schemaVersion: 1, routeId: route.routeId, routeKey: JSON.parse(route.routeKey), sourceCaseCount: route.sourceCases.length, sourceCases: [...route.sourceCases].sort(), firstDivergence: route.firstDivergence }))
const inventoryText = inventory.map(row => JSON.stringify(row)).join('\n') + '\n'
await writeFile(resolve(artifactDir, 'de405-cspice-route-events.jsonl'), eventText)
await writeFile(resolve(artifactDir, 'de405-cspice-route-results.jsonl'), resultText)
await writeFile(resolve(artifactDir, 'de405-project-route-events.jsonl'), projectEventText)
await writeFile(resolve(artifactDir, 'de405-cspice-route-first-divergence.jsonl'), firstDivergence.map(row => JSON.stringify(row)).join('\n') + '\n')
await writeFile(resolve(artifactDir, 'de405-cspice-route-inventory.jsonl'), inventoryText)
await writeFile(resolve(artifactDir, 'de405-cspice-route-map.json'), JSON.stringify(routeMap, null, 2) + '\n')
await writeFile(resolve(artifactDir, 'de405-cspice-route-neutrality.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_cspice_route_neutrality', inputCount: input.length, instrumentedEvaluations: results.length, uninstrumentedEvaluations: uninstrumentedResults.length, missingUninstrumentedCases: neutralityMissing, finalStateBitwiseParity: neutralityParity, classificationAndCoverageOutcome: neutralityMissing === 0 && results.every(result => !result.error) && uninstrumentedResults.every(result => result.selectionEvidenceStatus !== 'out_of_coverage') ? 'identical_comparable_success' : 'requires_review' }, null, 2) + '\n')
const summary = { schemaVersion: 2, recordType: 'de405_cspice_route_summary', inputCount: input.length, cspiceEvaluations: results.length, eventCount: events.length, projectEventCount: projectEvents.length, projectRouteEvaluations: projectById.size, missingCases: 0, executionErrors: results.filter(row => row.error).length, instrumentedUninstrumentedFinalBitwiseParity: neutralityParity, exactFinalStateMatches, observableRouteIdentityExact, uniqueRouteCount: inventory.length, duplicateCollapseCount: input.length - inventory.length, primaryFirstDivergence: counts, secondaryDifferences: secondaryCounts, priorComparison: { baselinePairMatches: prior.shadowImpact.baselineReproductionCount, shadowOutputChanged: prior.shadowImpact.shadowOutputChangedFromProductionCount, shadowExactCspiceParity: prior.shadowImpact.shadowOfficialPairParityCount, shadowType2ChainParityImprovements: prior.shadowImpact.outcomeCounts.selection_ambiguous_shadow_type2_chain_reproduced_official, unaffectedCases: prior.shadowImpact.unaffectedNonEvaluatorRootCauseCount, positionPolynomialFirstDivergence: prior.phase154.positionPolynomialCount, velocityDerivativeFirstDivergence: prior.phase154.velocityDerivativeCount }, breakdown, observabilityBoundary: { segmentSelection: 'observable', recordSelection: 'observable', evaluatorDispatch: 'observable_for_type_2', chainLegSequence: 'observable_as_event_sequence', orientationOrSign: 'observable_as_operation_events', accumulatorBeforeAfter: 'observable_via_vaddg_vsubg_wrappers', finalAssembly: 'observable_via_vsubg_operands_and_output', finalState: 'observable_and_neutrality_checked' }, corpusSha256: createHash('sha256').update(input.map(row => row.sampleId).sort().join('\n') + '\n').digest('hex'), sourceBuildManifestSha256: createHash('sha256').update(manifestText).digest('hex'), eventArtifactSha256: createHash('sha256').update(eventText).digest('hex'), projectEventArtifactSha256: createHash('sha256').update(projectEventText).digest('hex'), resultArtifactSha256: createHash('sha256').update(resultText).digest('hex'), inventoryArtifactSha256: createHash('sha256').update(inventoryText).digest('hex'), neutralityArtifactSha256: createHash('sha256').update(JSON.stringify({ neutralityParity, neutralityMissing })).digest('hex') }
await writeFile(resolve(artifactDir, 'de405-cspice-route-summary.json'), JSON.stringify(summary, null, 2) + '\n')
await writeFile(resolve(artifactDir, 'de405-cspice-route-build-manifest.json'), manifestText)
console.log(JSON.stringify(summary, null, 2))
