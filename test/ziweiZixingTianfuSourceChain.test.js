import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildChainArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-zixing-tianfu-source-chain-v0.mjs'
import { checkChainArtifact } from '../scripts/check-ziwei-zixing-tianfu-source-chain-v0.mjs'

test('source-only Ziwei to Tianfu chain proves first divergence at Tianfu', async () => { const a = await buildChainArtifact(); assert.equal(a.schemaVersion, SCHEMA); assert.equal(a.chain.rowCount, 150); assert.equal(a.reconciliation.reviewerAReviewerBExactRows, 150); assert.equal(a.chain.firstDivergence.stage, 'tianfu'); assert.equal(a.chain.firstDivergence.rowId, 'bureau-2-day-01'); assert.equal(a.chain.stageCounts.ziwei.exactMatch, 150); assert.equal(a.relations.transformCoverage.rotation06.residualRows, 0); assert.deepEqual(await checkChainArtifact(a), []) })
test('chain materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-zixing-chain-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-zixing-tianfu-source-chain-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildChainArtifact()), await readFile(a, 'utf8')) } finally { await rm(dir, { recursive: true, force: true }) } })
test('negative mutation inventory is fail-closed', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-zixing-tianfu-source-chain-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
