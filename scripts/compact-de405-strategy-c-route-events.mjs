import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error('usage: compact-de405-strategy-c-route-events.mjs events.jsonl compact.jsonl')
const input = createInterface({ input: createReadStream(inputPath), crlfDelay: Infinity })
const output = createWriteStream(outputPath, { flags: 'w' })
let current = null
let rows = 0
const flush = () => {
  if (!current) return
  output.write(`${JSON.stringify(current)}\n`)
  rows++
  current = null
}
for await (const line of input) {
  if (!line) continue
  const event = JSON.parse(line)
  if (event.eventType === 'request_start') {
    flush()
    current = { caseId: event.caseId, segments: [], records: [], evaluations: [] }
  } else if (current) {
    if (event.eventType === 'segment_selected') current.segments.push({ legIndex: event.legIndex, identity: `target:${event.targetId}:center:${event.centerId}:frame:${event.frameId}:begin:${event.beginAddress}:end:${event.endAddress}` })
    else if (event.eventType === 'record_selected') current.records.push({ legIndex: event.legIndex, recordIndex: event.recordNumber - 1 })
    else if (event.eventType === 'evaluator_output') current.evaluations.push({ legIndex: event.legIndex, stateBits: event.stateBits })
  }
}
flush()
await new Promise((resolve, reject) => output.end(error => error ? reject(error) : resolve()))
console.log(JSON.stringify({ inputPath, outputPath, rows }, null, 2))
