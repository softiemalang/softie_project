import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error('usage: normalize-de405-strategy-c-compact-shadow.mjs legacy-shadow.jsonl compact-shadow.jsonl')
const bitsToNumber = value => { const buffer = Buffer.alloc(8); buffer.writeBigUInt64LE(BigInt(value)); return buffer.readDoubleLE() }
const numberToBits = value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }
const sumBits = (legs, key, count) => { const state = Array(6).fill(0); for (const leg of legs.slice(0, count)) for (let i = 0; i < 6; i++) state[i] += bitsToNumber(leg[key][i]); return state.map(numberToBits) }
const sameLeg = (left, right) => left?.segmentIdentity === right?.segmentIdentity && left?.recordIndex === right?.recordIndex
const input = createInterface({ input: createReadStream(inputPath), crlfDelay: Infinity })
const output = createWriteStream(outputPath, { flags: 'w' })
let rows = 0
for await (const line of input) {
  if (!line) continue
  const row = JSON.parse(line)
  const targetLegs = row.targetLegs || []
  const centerLegs = row.centerLegs || []
  let commonSuffixLegCount = 0
  while (commonSuffixLegCount < targetLegs.length && commonSuffixLegCount < centerLegs.length && sameLeg(targetLegs[targetLegs.length - 1 - commonSuffixLegCount], centerLegs[centerLegs.length - 1 - commonSuffixLegCount])) commonSuffixLegCount++
  const targetRouteCount = targetLegs.length - commonSuffixLegCount
  const centerRouteCount = centerLegs.length - commonSuffixLegCount
  const baselineTarget = sumBits(targetLegs, 'baselineStateBits', targetRouteCount)
  const baselineCenter = sumBits(centerLegs, 'baselineStateBits', centerRouteCount)
  const candidateTarget = sumBits(targetLegs, 'candidateStateBits', targetRouteCount)
  const candidateCenter = sumBits(centerLegs, 'candidateStateBits', centerRouteCount)
  const subtract = (left, right) => left.map((value, i) => numberToBits(bitsToNumber(value) - bitsToNumber(right[i])))
  const normalized = { sampleId: row.sampleId, queryEtBits: row.queryEtBits, error: row.error || false, baselinePairStateBits: subtract(baselineTarget, baselineCenter), candidatePairStateBits: subtract(candidateTarget, candidateCenter), shadowPairStateBits: subtract(candidateTarget, candidateCenter), targetLegs: targetLegs.map(leg => ({ segmentIdentity: leg.segmentIdentity, recordIndex: leg.recordIndex, baselineStateBits: leg.baselineStateBits, candidateStateBits: leg.candidateStateBits })), centerLegs: centerLegs.slice(0, centerRouteCount).map(leg => ({ segmentIdentity: leg.segmentIdentity, recordIndex: leg.recordIndex, baselineStateBits: leg.baselineStateBits, candidateStateBits: leg.candidateStateBits })), routeComposition: { commonSuffixLegCount, targetLegCount: targetLegs.length, centerLegCount: centerLegs.length, targetRouteLegCount: targetRouteCount, centerRouteLegCount: centerRouteCount } }
  output.write(`${JSON.stringify(normalized)}\n`)
  rows++
}
await new Promise((resolve, reject) => output.end(error => error ? reject(error) : resolve()))
console.log(JSON.stringify({ inputPath, outputPath, rows }, null, 2))
