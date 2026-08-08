import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { buildArtifact, SCHEMA } from '../scripts/materialize-ziwei-inherited-evidence-consumption-frontier-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-inherited-evidence-consumption-frontier-v1.mjs'

test('inherited packet consumption is deterministic and bounded', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.equal(first.schemaVersion, SCHEMA)
  assert.deepEqual(first.packetEvidence.map(packet => packet.packetId), ['PKT-MINOR-STARS-V1', 'PKT-12-MAJOR-STARS-V1', 'PKT-TIANFU-RAW-CONTRADICTION-V1'])
  assert.equal(first.counts.startingBlockers, 10)
  assert.equal(first.counts.resolvedBlockers, 2)
  assert.equal(first.counts.stillBlocked, 8)
  assert.equal(first.minorStarCoverage.allSixExact, true)
  assert.equal(first.majorStarCoverage.allTwelveDirectWitnesses, true)
  assert.equal(first.tianfuRawContradiction.semanticAuthority, 'unresolved')
  assert.deepEqual(await checkArtifact(first), [])
})

test('historical artifact bytes remain immutable and preserve readiness blockade', async () => {
  const actual = JSON.parse(await readFile('artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json', 'utf8'))
  assert.deepEqual(await checkArtifact(actual), [])
  assert.equal(actual.readinessBeforeAfter.after.readiness, 'not_safe_to_start')
  assert.equal(actual.readinessBeforeAfter.after.stableClaimBoundary, 0)
  assert.equal(actual.tianfuRawContradiction.compatibility.modes.default, 'legacy')
})
