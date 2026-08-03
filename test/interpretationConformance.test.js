import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
test('downstream conformance materialization is byte deterministic and fail-closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-interpretation-conformance-')); const dirs = [join(root, 'one'), join(root, 'two')]
  const run = output => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-interpretation-conformance-v1.mjs'], { env: { ...process.env, ASTROLOGY_CONFORMANCE_OUTPUT_DIR: output }, encoding: 'utf8' }))
  const first = run(dirs[0]); const second = run(dirs[1]); const firstBytes = await readFile(join(dirs[0], 'complete.json')); const secondBytes = await readFile(join(dirs[1], 'complete.json'))
  assert.deepEqual(firstBytes, secondBytes); assert.equal(first.artifactByteSha256, sha256(firstBytes)); assert.equal(second.artifactByteSha256, sha256(secondBytes))
  const evidence = JSON.parse(firstBytes); assert.equal(evidence.conformance.verdict, 'conformant'); assert.equal(evidence.conformance.interpretationBoundary.noMeaningJudgment, true); assert.equal(evidence.conformance.activation.availableForInterpretation, false); assert.equal(evidence.candidate.claims.length, 53)
  for (const item of evidence.negativeEvidence) assert.equal(item.observedVerdict, 'non_conformant', item.caseId)
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-interpretation-conformance-v1.mjs', join(dirs[0], 'complete.json')], { encoding: 'utf8' })); assert.equal(checked.pass, true)
})
