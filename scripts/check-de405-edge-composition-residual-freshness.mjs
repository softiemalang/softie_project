import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(new URL('..', import.meta.url).pathname)
const raw = (await readFile(resolve(root, 'artifacts/de405-edge-composition-residual-evidence.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const summary = JSON.parse(await readFile(resolve(root, 'docs/de405-edge-composition-residual-analysis.json'), 'utf8'))
const execution = raw[0]?.nativeExecution
const ok = raw.length === 36 && execution?.nativeInvocationCount > 0 && execution.expectedNativeOperationCount === execution.executedNativeOperationCount && execution.executedNativeOperationCount === execution.parityComparedOperationCount && execution.parityMismatchCount === 0 && execution.nativeFailureCount === 0 && execution.jsFallbackUsed === false && summary.cohortCount === 36 && summary.nativeParity?.expectedOperationCount === execution.expectedNativeOperationCount && summary.nativeParity?.parityMatchCount === execution.parityMatchCount
const result = ok ? 'fresh' : 'stale'
console.log(`DE405 edge composition residual freshness: ${result}`)
if (!ok) process.exitCode = 1
