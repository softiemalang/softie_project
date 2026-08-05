import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { buildFieldKit, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-palace-source-acquisition-field-kit-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-palace-source-acquisition-field-kit-v0.mjs'

test('field kit is traceable, mobile-ready, and fail-closed', async () => { const a = await buildFieldKit(); assert.equal(a.verdictToken, 'complete_ziwei_palace_source_acquisition_field_kit_uncommitted'); assert.equal(a.targetCriteria.requiredTargetCount, 5); assert.deepEqual(await checkArtifact(a), []); assert.equal(a.quickMissionCard.mustPhotograph.length, 7); assert.equal(a.triageRubric.levels.at(-1).id, 'rejected') })
test('field kit materialization is byte deterministic', async () => { const d = await mkdtemp(join(tmpdir(), 'ziwei-field-kit-')); try { const a = join(d, 'a.json'); const b = join(d, 'b.json'); for (const x of [a,b]) assert.equal(spawnSync(process.execPath, [`scripts/materialize-${SCHEMA}.mjs`, '--observed-head', 'f7060c6d4f659679466213b144976809e5671db9', x], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(a), await readFile(b)); assert.equal(canonicalJson(await buildFieldKit()), await readFile(a, 'utf8')) } finally { await rm(d, { recursive: true, force: true }) } })
test('negative checker rejects target loss, OCR-only evidence, identity omission, weakened criteria, and semantic promotion', () => { const r = spawnSync(process.execPath, ['scripts/check-ziwei-palace-source-acquisition-field-kit-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(r.status, 0, r.stdout + r.stderr); assert.deepEqual(JSON.parse(r.stdout).findings, []) })
