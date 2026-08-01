import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const sourcePath = resolve(root, process.argv[2] || 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const productionResultsPath = resolve(root, process.argv[3] || '/private/tmp/de405-wider-production-route-results.jsonl')
const productionEventsPath = resolve(root, process.argv[4] || '/private/tmp/de405-wider-production-route-events.jsonl')
const shadowPath = resolve(root, process.argv[5] || '/private/tmp/de405-wider-shadow-manifest-order.jsonl')
const outputPath = resolve(root, process.argv[6] || 'artifacts/de405-production-route-shadow-fidelity.json')
const parse = line => JSON.parse(line)
const bitsEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const segmentIdentity = row => `target:${row.targetId}:center:${row.centerId}:frame:${row.frameId}:begin:${row.beginAddress}:end:${row.endAddress}`

async function *lines(path) {
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of input) if (line.trim()) yield parse(line)
}

async function *eventGroups(path) {
  let group = []
  for await (const event of lines(path)) {
    if (event.eventType === 'request_start' && group.length) {
      yield group
      group = []
    }
    group.push(event)
  }
  if (group.length) yield group
}

const source = lines(sourcePath)
const productionResults = lines(productionResultsPath)
const shadow = lines(shadowPath)
const events = eventGroups(productionEventsPath)
const counts = {
  sourceRows: 0,
  productionRows: 0,
  shadowRows: 0,
  productionErrors: 0,
  shadowMissing: 0,
  shadowBaselineFinalExactProduction: 0,
  shadowBaselineFinalMismatchProduction: 0,
  shadowCandidateFinalExactProduction: 0,
  shadowCandidateFinalMismatchProduction: 0,
  candidateChanged: 0,
  candidateResolved: 0,
  candidateRegressed: 0,
  routeIdentityExact: 0,
  routeIdentityMismatch: 0,
  segmentMismatch: 0,
  recordMismatch: 0,
  subintervalMismatch: 0,
  evaluatorDispatchMismatch: 0,
  legStateBaselineExactProduction: 0,
  legStateBaselineMismatchProduction: 0,
  routeFinalExactProduction: 0,
  routeFinalMismatchProduction: 0,
  routeEventMalformed: 0,
  routeEventCountMismatch: 0,
}
const routeIdentities = new Set()
const evaluatorInputs = new Set()
const changedRecords = new Set()
const resolvedRecords = new Set()
const mismatchSamples = []
const routeMismatchSamples = []
const candidateChangedSamples = []
const transitionCounts = new Map()
const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1)

while (true) {
  const [sourceNext, productionNext, shadowNext, eventNext] = await Promise.all([source.next(), productionResults.next(), shadow.next(), events.next()])
  if (sourceNext.done || productionNext.done || shadowNext.done || eventNext.done) {
    if (!(sourceNext.done && productionNext.done && shadowNext.done && eventNext.done)) throw new Error('source, production, shadow, and event streams have different lengths')
    break
  }
  const sourceRow = sourceNext.value
  const productionRow = productionNext.value
  const shadowRow = shadowNext.value
  const eventGroup = eventNext.value
  counts.sourceRows++
  counts.productionRows++
  counts.shadowRows++
  const sampleId = sourceRow.sampleId
  if (productionRow.caseId !== sampleId || shadowRow.sampleId !== sampleId || eventGroup[0]?.caseId !== sampleId) throw new Error(`case ordering mismatch at ${sampleId}`)
  if (productionRow.error) counts.productionErrors++
  const productionBits = productionRow.stateBits
  const baselineExact = bitsEqual(shadowRow.baselinePairStateBits, productionBits)
  const candidateExact = bitsEqual(shadowRow.candidatePairStateBits, productionBits)
  const changed = !bitsEqual(shadowRow.baselinePairStateBits, shadowRow.candidatePairStateBits)
  if (baselineExact) counts.shadowBaselineFinalExactProduction++
  else counts.shadowBaselineFinalMismatchProduction++
  if (candidateExact) counts.shadowCandidateFinalExactProduction++
  else counts.shadowCandidateFinalMismatchProduction++
  if (changed) counts.candidateChanged++
  if (!baselineExact && candidateExact) counts.candidateResolved++
  if (baselineExact && !candidateExact) counts.candidateRegressed++
  const transition = baselineExact && candidateExact ? 'baseline_exact_candidate_exact' : baselineExact && !candidateExact ? 'baseline_exact_candidate_regressed' : !baselineExact && candidateExact ? 'baseline_mismatch_candidate_exact' : changed ? 'baseline_mismatch_candidate_changed_still_mismatch' : 'baseline_mismatch_candidate_unchanged'
  bump(transitionCounts, transition)
  if (changed && candidateChangedSamples.length < 20) candidateChangedSamples.push(sampleId)
  if (!baselineExact && mismatchSamples.length < 20) mismatchSamples.push({ sampleId, productionBits, baselineBits: shadowRow.baselinePairStateBits, candidateBits: shadowRow.candidatePairStateBits })

  const eventLegs = []
  const segments = new Map()
  const records = new Map()
  const evaluators = new Map()
  for (const event of eventGroup) {
    if (event.eventType === 'segment_selected') segments.set(event.legIndex, event)
    else if (event.eventType === 'record_selected') records.set(event.legIndex, event)
    else if (event.eventType === 'evaluator_output') evaluators.set(event.legIndex, event)
  }
  const legIndexes = [...segments.keys()].sort((a, b) => a - b)
  for (const legIndex of legIndexes) {
    const segment = segments.get(legIndex)
    const record = records.get(legIndex)
    const evaluator = evaluators.get(legIndex)
    if (!record || !evaluator || evaluator.evaluatorType !== 2) {
      counts.routeEventMalformed++
      continue
    }
    const leg = { legIndex, body: segment.targetId, parent: segment.centerId, frameId: segment.frameId, segmentIdentity: segmentIdentity({ targetId: segment.targetId, centerId: segment.centerId, frameId: segment.frameId, beginAddress: segment.beginAddress, endAddress: segment.endAddress }), recordIndex: record.recordNumber - 1, recordBeginAddress: record.recordBeginAddress, recordSize: record.recordSize, evaluatorType: evaluator.evaluatorType, recordMidEtBits: evaluator.recordMidEtBits, recordRadiusBits: evaluator.recordRadiusBits, baselineStateBits: evaluator.stateBits }
    eventLegs.push(leg)
    evaluatorInputs.add(`${leg.segmentIdentity}#${leg.recordIndex}@${sourceRow.queryEtHex}`)
    routeIdentities.add(eventLegs.map(item => `${item.body}>${item.parent}@${item.segmentIdentity}#${item.recordIndex}`).join('|'))
  }
  if (eventLegs.length !== (shadowRow.targetLegs?.length || 0) + (shadowRow.centerLegs?.length || 0)) counts.routeEventCountMismatch++
  const shadowLegs = [...(shadowRow.targetLegs || []), ...(shadowRow.centerLegs || [])]
  const eventKeys = new Set(eventLegs.map(leg => `${leg.segmentIdentity}#${leg.recordIndex}`))
  const shadowKeys = new Set(shadowLegs.map(leg => `${leg.segmentIdentity}#${leg.recordIndex}`))
  const routeExact = eventKeys.size === shadowKeys.size && [...eventKeys].every(key => shadowKeys.has(key))
  if (routeExact) counts.routeIdentityExact++
  else {
    counts.routeIdentityMismatch++
    if (routeMismatchSamples.length < 20) routeMismatchSamples.push({ sampleId, eventKeys: [...eventKeys], shadowKeys: [...shadowKeys] })
  }
  for (const eventLeg of eventLegs) {
    const shadowLeg = shadowLegs.find(leg => `${leg.segmentIdentity}#${leg.recordIndex}` === `${eventLeg.segmentIdentity}#${eventLeg.recordIndex}`)
    if (!shadowLeg) { counts.segmentMismatch++; continue }
    if (shadowLeg.recordBits?.[0] !== eventLeg.recordMidEtBits || shadowLeg.recordBits?.[1] !== eventLeg.recordRadiusBits) counts.subintervalMismatch++
    if (shadowLeg.baselineStateBits && bitsEqual(shadowLeg.baselineStateBits, eventLeg.baselineStateBits)) counts.legStateBaselineExactProduction++
    else counts.legStateBaselineMismatchProduction++
    if (shadowLeg.candidateStateBits && !bitsEqual(shadowLeg.baselineStateBits, shadowLeg.candidateStateBits)) changedRecords.add(`${eventLeg.segmentIdentity}#${eventLeg.recordIndex}`)
    if (candidateExact && shadowLeg.candidateStateBits && !bitsEqual(shadowLeg.baselineStateBits, shadowLeg.candidateStateBits)) resolvedRecords.add(`${eventLeg.segmentIdentity}#${eventLeg.recordIndex}`)
  }
  if (bitsEqual(shadowRow.baselinePairStateBits, productionBits)) counts.routeFinalExactProduction++
  else counts.routeFinalMismatchProduction++
}
const summary = {
  schemaVersion: 1,
  recordType: 'de405_production_route_shadow_fidelity',
  scope: 'instrumented_cspice_spkez_c_route_vs_shared_baseline_candidate_shadow',
  sourceCorpus: { path: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', rowCount: counts.sourceRows },
  counts: { ...counts, transitionCounts: Object.fromEntries([...transitionCounts].sort(([a], [b]) => a.localeCompare(b))), uniqueRouteIdentities: routeIdentities.size, uniqueType2EvaluatorInputs: evaluatorInputs.size, changedRecords: changedRecords.size, resolvedRecords: resolvedRecords.size },
  routeInvariant: { method: 'instrumented_cspice_event_chain_compared_to_shadow_emitted_route', segmentMismatches: counts.segmentMismatch, recordMismatches: counts.recordMismatch, subintervalMismatches: counts.subintervalMismatch, evaluatorDispatchMismatches: counts.evaluatorDispatchMismatch, routeEventCountMismatches: counts.routeEventCountMismatch, violations: counts.routeIdentityMismatch },
  baselineFidelity: { finalStateExactRows: counts.shadowBaselineFinalExactProduction, finalStateMismatchRows: counts.shadowBaselineFinalMismatchProduction, instrumentedLegStateExactRows: counts.legStateBaselineExactProduction, instrumentedLegStateMismatchRows: counts.legStateBaselineMismatchProduction, productionErrors: counts.productionErrors, shadowMissing: counts.shadowMissing },
  candidate: { changedRows: counts.candidateChanged, resolvedRows: counts.candidateResolved, regressedRows: counts.candidateRegressed, candidateExactRows: counts.shadowCandidateFinalExactProduction, candidateMismatchRows: counts.shadowCandidateFinalMismatchProduction },
  firstMismatches: mismatchSamples,
  routeMismatchSamples,
  candidateChangedSamples,
}
await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output: outputPath, counts: summary.counts, routeInvariant: summary.routeInvariant }, null, 2))
