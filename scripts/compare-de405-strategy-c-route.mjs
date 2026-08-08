import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const [shadowPath, eventsPath, outputPath] = process.argv.slice(2)
if (!shadowPath || !eventsPath || !outputPath) throw new Error('usage: compare-de405-strategy-c-route.mjs shadow.jsonl route-events.jsonl output.json')
const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const identity = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return { path, sizeBytes: (await stat(path)).size, sha256: hash.digest('hex') } }
const shadow = lines(shadowPath)
const events = lines(eventsPath)
let pendingEvent = null
const takeEvent = async () => {
  if (pendingEvent) { const current = pendingEvent; pendingEvent = null; return current }
  const current = await events.next()
  return current.done ? null : JSON.parse(current.value)
}
const takeCase = async () => {
  const first = await takeEvent()
  if (!first) return null
  if (first.eventType !== 'request_start') throw new Error(`route event stream does not start a case: ${first.eventType}`)
  const caseEvents = [first]
  while (true) {
    const event = await takeEvent()
    if (!event) break
    if (event.eventType === 'request_start') { pendingEvent = event; break }
    caseEvents.push(event)
  }
  return { caseId: first.caseId, events: caseEvents }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const routeLeg = event => `target:${event.targetId}:center:${event.centerId}:frame:${event.frameId}:begin:${event.beginAddress}:end:${event.endAddress}`
const counts = { rows: 0, identityErrors: 0, routeCaseErrors: 0, routeIdentityExact: 0, routeIdentityMismatch: 0, recordIdentityExact: 0, recordIdentityMismatch: 0, legCountMismatch: 0, evaluatorComparisons: 0, evaluatorStateExact: 0, evaluatorStateMismatch: 0, candidateRouteComparableRows: 0, candidateRouteComparableExactRows: 0, candidateRouteComparableMismatchRows: 0, firstRouteMismatch: null, firstEvaluatorMismatch: null }
while (true) {
  const sourceLine = await shadow.next()
  if (sourceLine.done) break
  const shadowRow = JSON.parse(sourceLine.value)
  const routeCase = await takeCase()
  if (!routeCase) throw new Error(`missing route case for ${shadowRow.sampleId}`)
  counts.rows++
  if (routeCase.caseId !== shadowRow.sampleId) { counts.identityErrors++; counts.routeCaseErrors++; continue }
  const segments = routeCase.events.filter(event => event.eventType === 'segment_selected').sort((a, b) => a.legIndex - b.legIndex)
  const records = routeCase.events.filter(event => event.eventType === 'record_selected').sort((a, b) => a.legIndex - b.legIndex)
  const evaluations = routeCase.events.filter(event => event.eventType === 'evaluator_output').sort((a, b) => a.legIndex - b.legIndex)
  const shadowLegs = [...(shadowRow.targetLegs || []), ...(shadowRow.centerLegs || [])]
  const routeIdentityEqual = segments.length === shadowLegs.length && segments.every((event, index) => routeLeg(event) === shadowLegs[index].segmentIdentity)
  const recordIdentityEqual = records.length === shadowLegs.length && records.every((event, index) => event.recordNumber - 1 === shadowLegs[index].recordIndex)
  if (segments.length !== shadowLegs.length) counts.legCountMismatch++
  if (routeIdentityEqual) counts.routeIdentityExact++; else { counts.routeIdentityMismatch++; if (!counts.firstRouteMismatch) counts.firstRouteMismatch = { sampleId: shadowRow.sampleId, actual: segments.map(routeLeg), shadow: shadowLegs.map(leg => leg.segmentIdentity) } }
  if (recordIdentityEqual) counts.recordIdentityExact++; else counts.recordIdentityMismatch++
  for (let index = 0; index < Math.min(evaluations.length, shadowLegs.length); index++) {
    counts.evaluatorComparisons++
    if (same(evaluations[index].stateBits, shadowLegs[index].candidateStateBits)) counts.evaluatorStateExact++
    else if (!counts.firstEvaluatorMismatch) counts.firstEvaluatorMismatch = { sampleId: shadowRow.sampleId, legIndex: evaluations[index].legIndex, actual: evaluations[index].stateBits, shadowCandidate: shadowLegs[index].candidateStateBits }
    if (!same(evaluations[index].stateBits, shadowLegs[index].candidateStateBits)) counts.evaluatorStateMismatch++
  }
  if (routeIdentityEqual && recordIdentityEqual) {
    counts.candidateRouteComparableRows++
    if (same(shadowRow.candidatePairStateBits, shadowRow.shadowPairStateBits)) counts.candidateRouteComparableExactRows++; else counts.candidateRouteComparableMismatchRows++
  }
}
const shadowIdentity = await identity(shadowPath)
const routeIdentity = await identity(eventsPath)
const result = { schemaVersion: 1, recordType: 'de405_strategy_c_route_comparison', inputs: { shadow: { path: 'de405-strategy-c-shadow-current.jsonl', sizeBytes: shadowIdentity.sizeBytes, sha256: shadowIdentity.sha256 }, routeEvents: { path: 'de405-full-route-events.jsonl', sizeBytes: routeIdentity.sizeBytes, sha256: routeIdentity.sha256 }, rows: counts.rows }, counts, interpretation: { routeIdentityObserved: counts.routeIdentityMismatch === 0 && counts.legCountMismatch === 0, evaluatorStateObserved: counts.evaluatorStateMismatch === 0, productionActivation: false, shadowCandidateUsesSameRouteWhenIdentitiesMatch: counts.candidateRouteComparableMismatchRows === 0 } }
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
