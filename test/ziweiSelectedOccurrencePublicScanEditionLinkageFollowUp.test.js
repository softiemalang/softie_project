import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildFollowUpArtifact, canonicalJson, SCHEMA, BASIS_HEAD, TARGET_OCCURRENCE } from '../scripts/materialize-ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-v0.mjs'
import { checkFollowUpArtifact } from '../scripts/check-ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-v0.mjs'

test('keeps one occurrence and two edition families bounded and unresolved', async () => { const a = await buildFollowUpArtifact(); assert.equal(a.basisHead, BASIS_HEAD); assert.deepEqual(a.scope.occurrenceIds, [TARGET_OCCURRENCE]); assert.equal(a.linkageTrace.length, 2); assert.equal(a.verdictToken, 'public_scan_linkage_unresolved'); assert.deepEqual(await checkFollowUpArtifact(a), []) })
test('follow-up materialization is byte deterministic', async () => { const dir = await mkdtemp(join(tmpdir(), 'ziwei-scan-linkage-')); try { const paths = [join(dir, 'a.json'), join(dir, 'b.json')]; for (const p of paths) assert.equal(spawnSync(process.execPath, [`scripts/materialize-${SCHEMA}.mjs`, p], { cwd: process.cwd(), encoding: 'utf8' }).status, 0); assert.deepEqual(await readFile(paths[0]), await readFile(paths[1])); assert.equal(canonicalJson(await buildFollowUpArtifact()), canonicalJson(JSON.parse(await readFile(paths[0], 'utf8')))) } finally { await rm(dir, { recursive: true, force: true }) } })
test('negative fixture detects public scan linkage shortcuts', () => { const r = spawnSync(process.execPath, ['scripts/check-ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' }); assert.equal(r.status, 0, r.stdout + r.stderr); assert.deepEqual(JSON.parse(r.stdout).findings, []) })
