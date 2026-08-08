import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { buildArtifact, SCHEMA } from '../scripts/materialize-ziwei-structural-admission-frontier-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-structural-admission-frontier-v1.mjs'
import { checkArtifact as checkInheritedEvidenceArtifact } from '../scripts/check-ziwei-inherited-evidence-consumption-frontier-v1.mjs'

test('current Ziwei structural frontier is deterministic and fail-closed', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.deepEqual(first, second)
  assert.equal(first.schemaVersion, SCHEMA)
  assert.equal(first.compatibilityEvaluation.rawComparison.legacyMatchRows, 0)
  assert.equal(first.compatibilityEvaluation.rawComparison.sourceAlignedMatchRows, 150)
  assert.equal(first.dynamicPalaceIdentity.exactRows, 144)
  assert.equal(first.readinessBeforeAfter.after.readiness, 'not_safe_to_start')
  assert.equal(first.readinessBeforeAfter.after.grounding, 'blocked')
  assert.deepEqual(await checkArtifact(first), [])
})

test('historical inherited-evidence frontier remains checked and immutable', async () => {
  const actual = JSON.parse(await readFile('artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json', 'utf8'))
  assert.deepEqual(await checkInheritedEvidenceArtifact(actual), [])
})

test('frontier rejects semantic authority or readiness promotion', async () => {
  const candidate = await buildArtifact()
  candidate.compatibilityEvaluation.semanticAuthority = 'verified'
  assert.ok((await checkArtifact(candidate)).includes('semantic_authority_promoted'))
  const unchanged = await buildArtifact()
  unchanged.readinessBeforeAfter.after.readiness = 'safe_to_start'
  assert.ok((await checkArtifact(unchanged)).includes('readiness_boundary'))
})
