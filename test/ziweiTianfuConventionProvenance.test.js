import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-tianfu-convention-provenance-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-tianfu-convention-provenance-v0.mjs'

test('Tianfu convention packet preserves repository provenance and blocked semantic identity', async () => { const a = await buildArtifact(); assert.equal(a.schemaVersion, SCHEMA); assert.equal(a.comparison.domain.rowCount, 150); assert.deepEqual(a.comparison.transformCoverage.rotation06, { testedRows: 150, matchedRows: 150, residualRows: 0 }); assert.equal(a.comparison.classification.semanticEquivalence, 'blocked_semantic_identity_insufficient'); assert.equal(a.claims.stableClaimCount, 0); assert.deepEqual(await checkArtifact(a), []) })
test('Tianfu convention materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-tianfu-convention-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-tianfu-convention-provenance-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildArtifact()), await readFile(a, 'utf8')) } finally { await rm(dir, { recursive: true, force: true }) } })
test('Tianfu convention negative mutations are fail-closed', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-tianfu-convention-provenance-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
