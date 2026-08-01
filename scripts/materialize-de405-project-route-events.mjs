import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error('usage: node scripts/materialize-de405-project-route-events.mjs INPUT OUTPUT')
const inputIds = new Set((await readFile(resolve(root, inputPath), 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line).sampleId))
const source = (await readFile(resolve(root, 'artifacts/de405-spk-center-chain-decomposition.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse).filter(row => inputIds.has(row.sampleId))
if (source.length !== inputIds.size) throw new Error(`project route input mismatch: source=${source.length} input=${inputIds.size}`)
const bits = value => value ?? null
const parseSegment = identity => {
  const match = identity.match(/^target:(-?\d+):center:(-?\d+):frame:(-?\d+):begin:(\d+):end:(\d+)$/)
  if (!match) throw new Error(`invalid segment identity: ${identity}`)
  return { targetId: Number(match[1]), centerId: Number(match[2]), frameId: Number(match[3]), beginAddress: Number(match[4]), endAddress: Number(match[5]) }
}
const out = []
for (const row of source) {
  const sequence = { value: 0 }
  const emit = (eventType, payload) => out.push({ schemaVersion: 1, eventSequence: ++sequence.value, caseId: row.sampleId, requestTargetId: row.target, requestObserverId: row.center, requestEtBits: row.queryEtBits, eventType, eventEtBits: row.queryEtBits, targetId: row.target, observerId: row.center, etBits: row.queryEtBits, ...payload })
  emit('request_start', {})
  const legs = [...(row.targetChainLegs || []).map(leg => ({ ...leg, chainRole: 'target' })), ...(row.centerChainLegs || []).map(leg => ({ ...leg, chainRole: 'center' }))]
  for (const leg of legs) {
    const segment = parseSegment(leg.segmentIdentity)
    const stateBits = [...(leg.legPositionBits || []), ...(leg.legVelocityBits || [])]
    emit('chain_leg', { chainRole: leg.chainRole, legOrdinal: leg.legOrdinal, bodyId: leg.body, parentBodyId: leg.parentBody, segmentType: leg.segmentType, ...segment, recordIndex: leg.recordIndex, recordNumber: leg.recordIndex + 1, rawLegStateBits: stateBits, accumulatorBeforeBits: bits(leg.accumulatorBitsBefore), accumulatorAfterBits: bits(leg.accumulatorBitsAfter), compositionOperation: leg.compositionOperation, orientationOperation: segment.frameId === 1 ? 'same_frame' : 'frame_transform_unobserved' })
  }
  emit('request_final', { finalStateBits: row.projectDirectBits || row.projectStateBits || null, targetToSsbBits: row.projectTargetToSsbBits || null, centerToSsbBits: row.projectCenterToSsbBits || null })
}
await writeFile(resolve(root, outputPath), out.map(event => JSON.stringify(event)).join('\n') + '\n')
console.log(JSON.stringify({ schemaVersion: 1, inputCount: inputIds.size, eventCount: out.length, output: outputPath }))
