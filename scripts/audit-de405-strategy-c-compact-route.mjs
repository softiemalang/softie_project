import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const options = Object.fromEntries(process.argv.slice(2).reduce((all, value, index, args) => value.startsWith('--') ? [...all, [value.slice(2), args[index + 1]]] : all, []))
const shadowPath = options.shadow
const canonicalPath = options.canonical
const routePath = options.route
const outputPath = options.output
if (!shadowPath || !canonicalPath || !routePath || !outputPath) throw new Error('usage: audit-de405-strategy-c-compact-route.mjs --shadow shadow.jsonl --canonical canonical.jsonl --route compact.jsonl --output output.json')
const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const stateBits = state => state?.map(value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }) ?? null
const identity = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return { path, sizeBytes: (await stat(path)).size, sha256: hash.digest('hex') } }
const shadow = lines(shadowPath)
const canonical = lines(canonicalPath)
const route = lines(routePath)
const counts = { rows: 0, identityErrors: 0, canonicalErrors: 0, shadowErrors: 0, baselineExact: 0, candidateExact: 0, candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, routeIdentityExact: 0, routeIdentityMismatch: 0, recordIdentityExact: 0, recordIdentityMismatch: 0, legCountMismatch: 0, evaluatorComparisons: 0, evaluatorStateExact: 0, evaluatorStateMismatch: 0, firstDivergence: null, firstRouteMismatch: null, firstEvaluatorMismatch: null }
while (true) {
  const [shadowNext, canonicalNext, routeNext] = await Promise.all([shadow.next(), canonical.next(), route.next()])
  if (shadowNext.done || canonicalNext.done || routeNext.done) { if (!(shadowNext.done && canonicalNext.done && routeNext.done)) throw new Error('shadow, canonical, and compact route streams have different lengths'); break }
  const shadowRow = JSON.parse(shadowNext.value)
  const canonicalRow = JSON.parse(canonicalNext.value)
  const routeRow = JSON.parse(routeNext.value)
  counts.rows++
  const canonicalId = canonicalRow.sampleId ?? canonicalRow.caseId
  const canonicalEtBits = canonicalRow.queryEtHex ?? canonicalRow.etBits
  if (shadowRow.sampleId !== canonicalId || shadowRow.queryEtBits !== canonicalEtBits || routeRow.caseId !== shadowRow.sampleId) counts.identityErrors++
  if (canonicalRow.error) counts.canonicalErrors++
  if (shadowRow.error) counts.shadowErrors++
  const canonicalBits = canonicalRow.stateBits ?? stateBits(canonicalRow.stateKmKmPerSec)
  const baselineExact = same(shadowRow.baselinePairStateBits, canonicalBits)
  const candidateExact = same(shadowRow.candidatePairStateBits, canonicalBits)
  const changed = !same(shadowRow.baselinePairStateBits, shadowRow.candidatePairStateBits)
  if (baselineExact) counts.baselineExact++
  if (candidateExact) counts.candidateExact++
  if (changed) counts.candidateChanged++
  if (!baselineExact && candidateExact) counts.candidateResolved++
  if (baselineExact && !candidateExact) counts.candidateRegressed++
  if (!baselineExact && !counts.firstDivergence) counts.firstDivergence = { sampleId: shadowRow.sampleId, baselinePairStateBits: shadowRow.baselinePairStateBits, candidatePairStateBits: shadowRow.candidatePairStateBits, canonicalStateBits: canonicalBits }
  const shadowLegs = [...(shadowRow.targetLegs || []), ...(shadowRow.centerLegs || [])]
  const routeSegments = [...routeRow.segments].sort((a, b) => a.legIndex - b.legIndex)
  const routeRecords = [...routeRow.records].sort((a, b) => a.legIndex - b.legIndex)
  const routeEvaluations = [...routeRow.evaluations].sort((a, b) => a.legIndex - b.legIndex)
  const routeExact = routeSegments.length === shadowLegs.length && routeSegments.every((event, index) => event.identity === shadowLegs[index].segmentIdentity)
  const recordExact = routeRecords.length === shadowLegs.length && routeRecords.every((event, index) => event.recordIndex === shadowLegs[index].recordIndex)
  if (routeSegments.length !== shadowLegs.length) counts.legCountMismatch++
  if (routeExact) counts.routeIdentityExact++; else { counts.routeIdentityMismatch++; if (!counts.firstRouteMismatch) counts.firstRouteMismatch = { sampleId: shadowRow.sampleId, actual: routeSegments.map(event => event.identity), shadow: shadowLegs.map(leg => leg.segmentIdentity) } }
  if (recordExact) counts.recordIdentityExact++; else counts.recordIdentityMismatch++
  for (let index = 0; index < Math.min(routeEvaluations.length, shadowLegs.length); index++) {
    counts.evaluatorComparisons++
    if (same(routeEvaluations[index].stateBits, shadowLegs[index].candidateStateBits)) counts.evaluatorStateExact++
    else { counts.evaluatorStateMismatch++; if (!counts.firstEvaluatorMismatch) counts.firstEvaluatorMismatch = { sampleId: shadowRow.sampleId, legIndex: routeEvaluations[index].legIndex, actual: routeEvaluations[index].stateBits, shadow: shadowLegs[index].candidateStateBits } }
  }
}
const result = { schemaVersion: 1, recordType: 'de405_strategy_c_compact_route_audit', inputs: { shadow: await identity(shadowPath), canonical: await identity(canonicalPath), compactRoute: await identity(routePath) }, counts, gates: { inputIdentity: counts.identityErrors === 0, baselineExactFullCorpus: counts.baselineExact === counts.rows, candidateExactFullCorpus: counts.candidateExact === counts.rows, candidateRegression: counts.candidateRegressed === 0, executionErrors: counts.canonicalErrors === 0 && counts.shadowErrors === 0, routeIdentityExact: counts.routeIdentityMismatch === 0 && counts.legCountMismatch === 0, recordIdentityExact: counts.recordIdentityMismatch === 0, evaluatorStateExact: counts.evaluatorStateMismatch === 0 }, productionActivation: false }
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
