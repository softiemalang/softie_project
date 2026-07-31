import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative } from 'node:path'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const INPUTS = {
  pairReferenceSource: 'scripts/lib/de405-center-chain-pair-reference.mjs',
  auditOrchestrationSource: 'scripts/lib/de405-cspice-reference-contract-audit.mjs',
  auditRunnerSource: 'tools/de405-cspice-reference-contract-audit/src/de405_reference_contract_audit.c',
  auditRunnerBinary: 'tools/de405-cspice-reference-contract-audit/build/de405-reference-contract-audit',
  auditRunnerBuild: 'tools/de405-cspice-reference-contract-audit/build/runner-build.json',
  kernel: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
}

const CONTRACT = {
  frame: 'J2000',
  frameId: 1,
  aberrationCorrection: 'NONE',
  apiFunction: 'spkez_c',
  units: { position: 'km', velocity: 'km/s' }
}

const sha256 = value => createHash('sha256').update(value).digest('hex')
const bits = value => {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}`
}
const identity = async path => {
  const content = await readFile(resolve(ROOT, path))
  const info = await stat(resolve(ROOT, path))
  return { path: path.startsWith('/') ? path : path, sizeBytes: info.size, sha256: sha256(content) }
}
const canonical = value => JSON.stringify(value)

function queryRows(samples) {
  const rows = []
  for (const sample of samples) {
    const leg0 = sample.centerChainLegs[0]
    const leg1 = sample.centerChainLegs[1]
    rows.push({ queryId: `${sample.sampleId}:leg0`, sampleId: sample.sampleId, queryKind: 'center_to_intermediate_parent', target: leg0.body, observer: leg0.parentBody, queryEtBits: sample.queryEtBits })
    rows.push({ queryId: `${sample.sampleId}:leg1`, sampleId: sample.sampleId, queryKind: 'intermediate_parent_to_ssb', target: leg1.body, observer: leg1.parentBody, queryEtBits: sample.queryEtBits })
    rows.push({ queryId: `${sample.sampleId}:center-to-ssb`, sampleId: sample.sampleId, queryKind: 'center_to_ssb_direct', target: sample.center, observer: 0, queryEtBits: sample.queryEtBits })
  }
  return rows.sort((a, b) => a.queryId.localeCompare(b.queryId))
}

function inputText(rows) {
  return rows.map(row => `${row.queryId} ${row.target} ${row.observer} ${row.queryEtBits}`).join('\n') + '\n'
}

function expectedCall(row) {
  return {
    sampleId: row.queryId,
    queryKind: 'direct_target_to_center',
    targetBodyId: row.target,
    observerBodyId: row.observer,
    frame: CONTRACT.frame,
    frameId: CONTRACT.frameId,
    aberrationCorrection: CONTRACT.aberrationCorrection,
    apiFunction: CONTRACT.apiFunction,
    queryEtBits: row.queryEtBits,
    inputEtBits: row.queryEtBits
  }
}

function callFindings(call, expected) {
  const findings = []
  for (const key of ['sampleId', 'queryKind', 'targetBodyId', 'observerBodyId', 'frame', 'frameId', 'aberrationCorrection', 'apiFunction', 'queryEtBits', 'inputEtBits']) {
    if (call[key] !== expected[key]) findings.push(`request_${key}_mismatch`)
  }
  if (call.etMutated || call.failedStatusBeforeCall || call.failedStatusAfterCall || call.callFailed) findings.push('request_or_call_failed')
  if (!Array.isArray(call.responseState) || !Array.isArray(call.responseBits) || call.responseState.length !== 6 || call.responseBits.length !== 6) findings.push('response_unavailable')
  if (call.outputExtraction && JSON.stringify(call.responseBits) !== JSON.stringify(call.outputExtraction.roundTripBits)) findings.push('response_extraction_mismatch')
  return findings
}

export async function currentSourceIdentities() {
  return Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, path]) => [key, await identity(path)])))
}

export function buildPairBatch(samples) {
  const rows = queryRows(samples)
  return {
    rows,
    inputText: inputText(rows),
    requestEnvelope: { ...CONTRACT, targetObserverDirection: 'target body relative to observer body', queryEtBits: 'source sample queryEtBits' }
  }
}

export async function runPairReference(samples) {
  const batch = buildPairBatch(samples)
  const temp = await mkdtemp(`${tmpdir()}/de405-center-chain-pair-reference.`)
  const inputPath = resolve(temp, 'pair-query-batch.txt')
  try {
    await writeFile(inputPath, batch.inputText)
    const processes = []
    for (const ordinal of [1, 2]) {
      const stdout = execFileSync(resolve(ROOT, INPUTS.auditRunnerBinary), ['--spk', INPUTS.kernel, '--input', inputPath, '--sequence', 'A', '--ordinal', String(ordinal)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
      processes.push(JSON.parse(stdout.trim()))
    }
    const calls = processes.flatMap(process => process.calls || [])
    const expected = new Map(batch.rows.map(row => [row.queryId, expectedCall(row)]))
    const grouped = new Map()
    const findings = []
    for (const call of calls) {
      const item = expected.get(call.sampleId)
      if (!item) { findings.push('unexpected_query_id'); continue }
      if (call.queryKind !== 'direct_target_to_center') continue
      const findingsForCall = callFindings(call, item)
      if (findingsForCall.length) findings.push(...findingsForCall)
      if (!grouped.has(call.sampleId)) grouped.set(call.sampleId, [])
      grouped.get(call.sampleId).push(call)
    }
    const references = new Map()
    for (const row of batch.rows) {
      const rowCalls = (grouped.get(row.queryId) || []).filter(call => call.queryKind === 'direct_target_to_center')
      if (rowCalls.length !== 2) findings.push(`${row.queryId}:repeat_count_${rowCalls.length}`)
      const first = rowCalls[0]
      const stable = rowCalls.length === 2 && rowCalls.every(call => JSON.stringify(call.responseBits) === JSON.stringify(first?.responseBits))
      if (!stable) findings.push(`${row.queryId}:response_not_stable`)
      references.set(row.queryId, {
        queryId: row.queryId,
        queryKind: row.queryKind,
        targetBodyId: row.target,
        observerBodyId: row.observer,
        requestEnvelope: expectedCall(row),
        responseState: first?.responseState || null,
        responseBits: first?.responseBits || null,
        repeatCount: rowCalls.length,
        stable,
        unavailableReason: first?.callFailed ? first.shortError || 'cspice_pair_state_call_failed' : first ? null : 'cspice_pair_state_response_missing'
      })
    }
    const outputBytes = processes.map(process => JSON.stringify(process)).join('\n') + '\n'
    const responseBytes = [...references.values()].sort((a, b) => a.queryId.localeCompare(b.queryId)).map(reference => `${reference.queryId} ${JSON.stringify(reference.responseBits)}`).join('\n') + '\n'
    const sourceIdentities = await currentSourceIdentities()
    const inputIdentity = { path: 'generated:center-chain-pair-query-batch.txt', sizeBytes: Buffer.byteLength(batch.inputText), sha256: sha256(batch.inputText) }
    const outputIdentity = { path: 'generated:center-chain-pair-reference-output.jsonl', sizeBytes: Buffer.byteLength(outputBytes), sha256: sha256(outputBytes) }
    const requestIdentity = { path: 'generated:center-chain-pair-request-envelope.json', sizeBytes: Buffer.byteLength(canonical(batch.requestEnvelope)), sha256: sha256(canonical(batch.requestEnvelope)) }
    const responseIdentity = { path: 'generated:center-chain-pair-response-bits.txt', sizeBytes: Buffer.byteLength(responseBytes), sha256: sha256(responseBytes) }
    return {
      references,
      sourceIdentities,
      pairQueryBatch: inputIdentity,
      pairOutputBatch: outputIdentity,
      requestEnvelopeIdentity: requestIdentity,
      responseBitIdentity: responseIdentity,
      uniqueQueryCount: batch.rows.length,
      processRunCount: processes.length,
      callCount: calls.length,
      unavailableCount: [...references.values()].filter(reference => reference.unavailableReason).length,
      findings: [...new Set(findings)]
    }
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

export const contract = CONTRACT
