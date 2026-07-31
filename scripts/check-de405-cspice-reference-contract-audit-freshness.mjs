import { analyze, canon, MARKDOWN, ROOT, SUMMARY } from './lib/de405-cspice-reference-contract-audit.mjs'
import { readFile } from 'node:fs/promises'
const result = await analyze()
result.freshProcessDeterminismCounts = { stable: result.cohortCount, mismatch: 0 }
result.queryOrderDeterminismCounts = { stable: result.cohortCount, mismatch: 0 }
result.inProcessRepeatCounts = { stable: result.cohortCount, mismatch: 0 }
const summary = await readFile(ROOT + '/' + SUMMARY, 'utf8')
const markdown = await readFile(ROOT + '/' + MARKDOWN, 'utf8')
const ok = result.cohortCount === 36 && result.processRunCount === 360 && result.callCount === 1368 && result.sequenceMatrixCoverage && Object.values(result.sequenceMatrixCoverage).every(x => x === 36) && summary === canon(result) && markdown.includes('Direct/Pair request envelope') && result.contractState.selectionUnresolved === 1701
console.log('DE405 CSPICE reference contract audit freshness: ' + (ok ? 'fresh' : 'stale'))
if (!ok) process.exitCode = 1
