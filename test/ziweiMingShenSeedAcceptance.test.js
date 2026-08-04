import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { buildAcceptanceArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-ming-shen-seed-acceptance-v0.mjs'
import { checkAcceptanceArtifact } from '../scripts/check-ziwei-ming-shen-seed-acceptance-v0.mjs'

test('acceptance records source-first limits and immutable 144-row reconciliation', async () => { const { artifact } = await buildAcceptanceArtifact(); assert.equal(artifact.schemaVersion, SCHEMA); assert.equal(artifact.verdictToken, 'ziwei_ming_shen_seed_accepted_with_declared_limits'); assert.equal(artifact.comparison.matchCount, 144); assert.equal(artifact.comparison.mismatchCount, 0); assert.equal(artifact.comparison.firstDivergence, null); assert.deepEqual(await checkAcceptanceArtifact(artifact), []) })
test('acceptance materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-ming-shen-acceptance-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-ming-shen-seed-acceptance-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson((await buildAcceptanceArtifact()).artifact), await readFile(a, 'utf8')) } finally { await rm(dir, { recursive: true, force: true }) } })
test('acceptance negative fixture detects shortcuts', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-ming-shen-seed-acceptance-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
