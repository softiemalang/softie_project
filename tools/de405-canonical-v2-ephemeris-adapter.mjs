import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const DEFAULT_RUNNER = resolve(ROOT, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner')

function bitsHex(value) {
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setFloat64(0, value, false)
  return `0x${new DataView(buffer).getBigUint64(0, false).toString(16).padStart(16, '0')}`
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function parseCoverage(runner, kernelPath) {
  const line = execFileSync(runner, ['--coverage', '--spk', kernelPath], { encoding: 'utf8' }).trim()
  return JSON.parse(line)
}

export function createDe405CanonicalV2EphemerisEvaluator({ runnerPath = DEFAULT_RUNNER, kernelPath, expectedKernelSha256 = null, requireVerifiedSelection = true } = {}) {
  if (!kernelPath) return { availability: 'blocked', reason: 'kernel_path_missing' }
  try {
    const runnerVersion = JSON.parse(execFileSync(runnerPath, ['--version'], { encoding: 'utf8' }))
    if (runnerVersion.runnerVersion !== 'de405-canonical-v2-runner' || runnerVersion.cspiceToolkitVersion !== 'N0067') return { availability: 'blocked', reason: 'unsupported_de405_runner' }
    const actualKernelSha256 = sha256(kernelPath)
    if (expectedKernelSha256 && actualKernelSha256 !== expectedKernelSha256) return { availability: 'blocked', reason: 'kernel_hash_mismatch', actualKernelSha256 }
    const coverage = parseCoverage(runnerPath, kernelPath)

    return {
      availability: 'available',
      provenance: { runnerPath, runnerVersion, kernelPath, kernelSha256: actualKernelSha256, coverage },
      evaluateStates({ etSeconds, bodyMapping, observerId, frame }) {
        if (!Number.isFinite(etSeconds)) return { availability: 'blocked', reason: 'invalid_ephemeris_time' }
        if (etSeconds < Number(coverage.coverageStartEt) || etSeconds > Number(coverage.coverageEndEt)) return { availability: 'blocked', reason: 'ephemeris_time_out_of_coverage', etSeconds, coverage }
        const work = mkdtempSync(join(tmpdir(), 'astrology-de405-'))
        try {
          const inputPath = join(work, 'query.jsonl')
          const outputPath = join(work, 'states.jsonl')
          const etHex = bitsHex(etSeconds)
          writeFileSync(inputPath, bodyMapping.map((body) => JSON.stringify({ sampleId: body.id, queryEt: etSeconds, queryEtHex: etHex, targetId: body.targetId, centerId: observerId, frameId: 1 })).join('\n') + '\n')
          execFileSync(runnerPath, ['--evaluate-spk-type2-batch', '--spk', kernelPath, '--input-jsonl', inputPath, '--output-jsonl', outputPath], { stdio: 'ignore' })
          const rows = readFileSync(outputPath, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
          const states = Object.fromEntries(rows.map((row) => [bodyMapping.find((body) => body.id === row.sampleId)?.id || row.sampleId, { stateKmKmPerSec: row.stateKmKmPerSec, selectionEvidenceStatus: row.selectionEvidenceStatus, targetId: row.targetId, centerId: row.centerId, queryEtHex: row.queryEtHex }]))
          if (requireVerifiedSelection && Object.values(states).some((row) => row.selectionEvidenceStatus !== 'verified')) return { availability: 'blocked', reason: 'de405_selection_evidence_unverified', states }
          return { availability: 'available', states }
        } finally {
          rmSync(work, { recursive: true, force: true })
        }
      },
    }
  } catch (error) {
    return { availability: 'blocked', reason: error.code === 'ENOENT' ? 'de405_runtime_adapter_unavailable' : 'de405_runtime_adapter_error', message: error.message }
  }
}
