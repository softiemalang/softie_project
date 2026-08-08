import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const options = Object.fromEntries(process.argv.slice(2).reduce((all, value, index, args) => value.startsWith('--') ? [...all, [value.slice(2), args[index + 1]]] : all, []))
const shadowPath = options.shadow
const canonicalPath = options.canonical
const eventsPath = options.events
const outputPath = options.output
if (!shadowPath || !canonicalPath || !eventsPath || !outputPath) throw new Error('usage: audit-de405-strategy-c-full-stream.mjs --shadow shadow.jsonl --canonical canonical.jsonl --events events.jsonl --output output.json')

const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const stateBits = state => state?.map(value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }) ?? null
const routeLeg = event => `target:${event.targetId}:center:${event.centerId}:frame:${event.frameId}:begin:${event.beginAddress}:end:${event.endAddress}`
const identity = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return { path, sizeBytes: (await stat(path)).size, sha256: hash.digest('hex') } }

const shadow = lines(shadowPath)
const canonical = lines(canonicalPath)
const events = lines(eventsPath)
let pendingEvent = null
const takeEvent = async () => {
  if (pendingEvent) { const result = pendingEvent; pendingEvent = null; return result }
  const next = await events.next()
  return next.done ? null : JSON.parse(next.value)
}
const takeCase = async () => {
  const first = await takeEvent()
  if (!first) return null
  if (first.eventType !== 'request_start') throw new Error(`route stream starts with ${first.eventType}`)
  const caseEvents = [first]
  while (true) {
    const next = await takeEvent()
    if (!next) break
    if (next.eventType === 'request_start') { pendingEvent = next; break }
    caseEvents.push(next)
  }
  return { caseId: first.caseId, events: caseEvents }
}

const counts = {
  rows: 0, identityErrors: 0, canonicalErrors: 0, shadowErrors: 0, baselineExact: 0, candidateExact: 0,
  candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, routeIdentityExact: 0,
  routeIdentityMismatch: 0, recordIdentityExact: 0, recordIdentityMismatch: 0, legCountMismatch: 0,
  evaluatorComparisons: 0, evaluatorStateExact: 0, evaluatorStateMismatch: 0, firstDivergence: null,
  firstRouteMismatch: null, firstEvaluatorMismatch: null
}
while (true) {
  const [shadowNext, canonicalNext] = await Promise.all([shadow.next(), canonical.next()])
  if (shadowNext.done || canonicalNext.done) {
    if (shadowNext.done !== canonicalNext.done) throw new Error('shadow and canonical streams have different lengths')
    break
  }
  const shadowRow = JSON.parse(shadowNext.value)
  const canonicalRow = JSON.parse(canonicalNext.value)
  const routeCase = await takeCase()
  if (!routeCase) throw new Error(`missing route case for ${shadowRow.sampleId}`)
  counts.rows++
  if (shadowRow.sampleId !== canonicalRow.sampleId || routeCase.caseId !== shadowRow.sampleId || shadowRow.queryEtBits !== canonicalRow.queryEtHex) counts.identityErrors++
  const canonicalBits = stateBits(canonicalRow.stateKmKmPerSec)
  const baselineExact = same(shadowRow.baselinePairStateBits, canonicalBits)
  const candidateExact = same(shadowRow.candidatePairStateBits, canonicalBits)
  const changed = !same(shadowRow.baselinePairStateBits, shadowRow.candidatePairStateBits)
  if (canonicalRow.error) counts.canonicalErrors++
  if (baselineExact) counts.baselineExact++
  if (candidateExact) counts.candidateExact++
  if (changed) counts.candidateChanged++
  if (!baselineExact && candidateExact) counts.candidateResolved++
  if (baselineExact && !candidateExact) counts.candidateRegressed++
  if (!baselineExact && !counts.firstDivergence) counts.firstDivergence = { sampleId: shadowRow.sampleId, baselinePairStateBits: shadowRow.baselinePairStateBits, candidatePairStateBits: shadowRow.candidatePairStateBits, canonicalStateBits: canonicalBits }
  if (shadowRow.error) counts.shadowErrors++
  const segmentEvents = routeCase.events.filter(event => event.eventType === 'segment_selected').sort((a, b) => a.legIndex - b.legIndex)
  const recordEvents = routeCase.events.filter(event => event.eventType === 'record_selected').sort((a, b) => a.legIndex - b.legIndex)
  const evaluatorEvents = routeCase.events.filter(event => event.eventType === 'evaluator_output').sort((a, b) => a.legIndex - b.legIndex)
  const shadowLegs = [...(shadowRow.targetLegs || []), ...(shadowRow.centerLegs || [])]
  const routeExact = segmentEvents.length === shadowLegs.length && segmentEvents.every((event, index) => routeLeg(event) === shadowLegs[index].segmentIdentity)
  const recordExact = recordEvents.length === shadowLegs.length && recordEvents.every((event, index) => event.recordNumber - 1 === shadowLegs[index].recordIndex)
  if (segmentEvents.length !== shadowLegs.length) counts.legCountMismatch++
  if (routeExact) counts.routeIdentityExact++; else if (!counts.firstRouteMismatch) counts.firstRouteMismatch = { sampleId: shadowRow.sampleId, actual: segmentEvents.map(routeLeg), shadow: shadowLegs.map(leg => leg.segmentIdentity) }
  if (!routeExact) counts.routeIdentityMismatch++
  if (recordExact) counts.recordIdentityExact++; else counts.recordIdentityMismatch++
  for (let index = 0; index < Math.min(evaluatorEvents.length, shadowLegs.length); index++) {
    counts.evaluatorComparisons++
    if (same(evaluatorEvents[index].stateBits, shadowLegs[index].candidateStateBits)) counts.evaluatorStateExact++
    else { counts.evaluatorStateMismatch++; if (!counts.firstEvaluatorMismatch) counts.firstEvaluatorMismatch = { sampleId: shadowRow.sampleId, legIndex: evaluatorEvents[index].legIndex, actual: evaluatorEvents[index].stateBits, shadow: shadowLegs[index].candidateStateBits } }
  }
}
const eventTail = await events.next()
if (!eventTail.done) throw new Error('route stream has more cases than shadow/canonical corpus')
const result = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_full_stream_audit',
  inputs: { shadow: await identity(shadowPath), canonical: await identity(canonicalPath), routeEvents: await identity(eventsPath) },
  counts,
  gates: {
    inputIdentity: counts.identityErrors === 0,
    baselineExactFullCorpus: counts.baselineExact === counts.rows,
    candidateExactFullCorpus: counts.candidateExact === counts.rows,
    candidateRegression: counts.candidateRegressed === 0,
    executionErrors: counts.canonicalErrors === 0 && counts.shadowErrors === 0,
    routeIdentityExact: counts.routeIdentityMismatch === 0 && counts.legCountMismatch === 0,
    recordIdentityExact: counts.recordIdentityMismatch === 0,
    evaluatorStateExact: counts.evaluatorStateMismatch === 0
  },
  productionActivation: false
}
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
