import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const options = Object.fromEntries(process.argv.slice(2).reduce((all, value, index, args) => value.startsWith('--') ? [...all, [value.slice(2), args[index + 1]]] : all, []))
const shadowPath = options.shadow
const canonicalPath = options.canonical
const outputPath = options.output
if (!shadowPath || !canonicalPath || !outputPath) throw new Error('usage: audit-de405-strategy-c-numeric-stream.mjs --shadow shadow.jsonl --canonical canonical.jsonl --output output.json')
const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const stateBits = state => state?.map(value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }) ?? null
const identity = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return { path, sizeBytes: (await stat(path)).size, sha256: hash.digest('hex') } }
const shadow = lines(shadowPath)
const canonical = lines(canonicalPath)
const counts = { rows: 0, identityErrors: 0, canonicalErrors: 0, shadowErrors: 0, baselineExact: 0, candidateExact: 0, candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, firstDivergence: null }
while (true) {
  const [shadowNext, canonicalNext] = await Promise.all([shadow.next(), canonical.next()])
  if (shadowNext.done || canonicalNext.done) { if (shadowNext.done !== canonicalNext.done) throw new Error('shadow and canonical streams have different lengths'); break }
  const shadowRow = JSON.parse(shadowNext.value)
  const canonicalRow = JSON.parse(canonicalNext.value)
  counts.rows++
  const canonicalId = canonicalRow.sampleId ?? canonicalRow.caseId
  const canonicalEtBits = canonicalRow.queryEtHex ?? canonicalRow.etBits
  if (shadowRow.sampleId !== canonicalId || shadowRow.queryEtBits !== canonicalEtBits) counts.identityErrors++
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
}
const result = { schemaVersion: 1, recordType: 'de405_strategy_c_numeric_stream_audit', inputs: { shadow: await identity(shadowPath), canonical: await identity(canonicalPath) }, counts, gates: { inputIdentity: counts.identityErrors === 0, baselineExactFullCorpus: counts.baselineExact === counts.rows, candidateExactFullCorpus: counts.candidateExact === counts.rows, candidateRegression: counts.candidateRegressed === 0, executionErrors: counts.canonicalErrors === 0 && counts.shadowErrors === 0 }, productionActivation: false }
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
