import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildPilotArtifact, canonicalJson, BASIS_HEAD, SCHEMA } from '../scripts/materialize-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs'
import { checkPilotArtifact } from '../scripts/check-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs'

test('source-derived bureau rule compares all 1440 valid inputs', async () => { const artifact = await buildPilotArtifact(); assert.equal(artifact.schemaVersion, SCHEMA); assert.equal(artifact.basisHead, BASIS_HEAD); assert.equal(artifact.comparison.inputCount, 1440); assert.equal(artifact.comparison.matchCount, 1440); assert.equal(artifact.comparison.mismatchCount, 0); assert.equal(artifact.comparison.firstDivergence, null); assert.deepEqual(await checkPilotArtifact(artifact), []) })
test('bureau pilot materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-bureau-pilot-')); try { const a = join(dir, 'a.json'); const b = join(dir, 'b.json'); for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildPilotArtifact()), canonicalJson(JSON.parse(await readFile(a, 'utf8')))) } finally { await rm(dir, { recursive: true, force: true }) } })
test('bureau negative fixture detects shortcuts', () => { const result = spawnSync(process.execPath, ['scripts/check-ziwei-five-element-bureau-clean-rule-seed-pilot-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout).findings, []) })
