import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildPilotArtifact, canonicalJson, SCHEMA, BASIS_HEAD } from '../scripts/materialize-ziwei-guarded-occurrence-exact-source-identity-pilot-v0.mjs'
import { checkPilotArtifact } from '../scripts/check-ziwei-guarded-occurrence-exact-source-identity-pilot-v0.mjs'

test('selects one occurrence deterministically from existing source evidence', async () => { const artifact = await buildPilotArtifact(); assert.equal(artifact.basisHead, BASIS_HEAD); assert.equal(artifact.selection.selectedOccurrenceId, 'ziwei-occ-2260aba6ed2163e3'); assert.equal(artifact.selection.rejectedOccurrenceIds.length, 3); assert.equal(artifact.record.verdict, 'source_lineage_partial'); assert.equal(artifact.record.scanAssessment.status, 'scan_unavailable'); assert.equal(artifact.globalBoundary.stableClaimCount, 0); assert.deepEqual(await checkPilotArtifact(artifact), []) })
test('pilot materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-exact-source-pilot-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-guarded-occurrence-exact-source-identity-pilot-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildPilotArtifact()), canonicalJson(JSON.parse(await readFile(a, 'utf8')))) } finally { await rm(dir, { recursive: true, force: true }) } })
test('negative fixture detects exact identity pilot shortcuts', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-guarded-occurrence-exact-source-identity-pilot-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
