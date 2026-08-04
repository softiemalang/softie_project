import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildDiscrepancyArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs'
import { checkDiscrepancyArtifact } from '../scripts/check-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs'

test('source-first Tianfu discrepancy preserves baseline and identifies bounded relation', async () => { const artifact = await buildDiscrepancyArtifact(); assert.equal(artifact.schemaVersion, SCHEMA); assert.equal(artifact.direct.inputCount, 12); assert.equal(artifact.integrated.inputCount, 150); assert.equal(artifact.integrated.originalBaseline.matchCount, 25); assert.equal(artifact.integrated.originalBaseline.mismatchCount, 125); assert.deepEqual(await checkDiscrepancyArtifact(artifact), []); assert.deepEqual(artifact.direct.exactFitIds, artifact.integrated.exactFitIds) })
test('Tianfu discrepancy materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-tianfu-discrepancy-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildDiscrepancyArtifact()), await readFile(a, 'utf8')) } finally { await rm(dir, { recursive: true, force: true }) } })
test('Tianfu discrepancy negative fixture detects fail-open mutations', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-tianfu-placement-discrepancy-analysis-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
