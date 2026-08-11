import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import {
  checkMaterialized,
} from '../scripts/check-design-reference-async-content-enter-200ms-promotion.mjs'
import {
  DEFAULT_DIRECTORY,
  materialize,
} from '../scripts/materialize-design-reference-async-content-enter-200ms-promotion.mjs'

const VERDICT = 'complete_softie_async_content_enter_200ms_house_rule_promoted_uncommitted'
const PILOT_COMMIT = 'a49a626bf64d37c81be0b6f2f10cb52cd577f03e'
const GLASS_SCOPE_FIX_COMMIT = '0a267d071fd44901471cfd8dfcaeb7937d37c22a'

test('promotion evidence closes the bounded external, audit, runtime, device, and scope-fix chain', async () => {
  const failures = await checkMaterialized(DEFAULT_DIRECTORY)
  assert.deepEqual(failures, [])

  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.externalEvidence.durationEvidence.directLoadingDurationProvenance, false)
  assert.equal(artifact.auditDecision.incrementalVerdict, 'insufficient_to_prefer')
  assert.equal(artifact.auditDecision.boundedCandidate, '200ms')
  assert.equal(artifact.pilot.implementationCommit.commit, PILOT_COMMIT)
  assert.equal(artifact.glassScopeFix.implementationCommit.commit, GLASS_SCOPE_FIX_COMMIT)
  assert.equal(artifact.deviceObservations.length, 3)
  assert.equal(artifact.promotionDecision.status, 'promoted')
  assert.match(artifact.lineage.notGeneralized, /does not promote 200ms/)
})

test('promotion evidence materialization is byte-identical across output directories', async () => {
  const left = await mkdtemp(join(tmpdir(), 'softie-async-enter-promotion-left-'))
  const right = await mkdtemp(join(tmpdir(), 'softie-async-enter-promotion-right-'))
  try {
    await materialize(left)
    await materialize(right)
    const leftNames = (await readdir(left)).sort()
    const rightNames = (await readdir(right)).sort()
    assert.deepEqual(leftNames, rightNames)
    for (const name of leftNames) assert.deepEqual(await readFile(join(left, name)), await readFile(join(right, name)), name)
    assert.deepEqual(await checkMaterialized(left), [])
    assert.deepEqual(await checkMaterialized(right), [])
  } finally {
    await rm(left, { recursive: true, force: true })
    await rm(right, { recursive: true, force: true })
  }
})

test('promotion evidence rejects tampered complete bytes and integrity', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'softie-async-enter-promotion-tamper-'))
  try {
    await materialize(directory)
    const path = join(directory, 'complete.json')
    await writeFile(path, `${await readFile(path, 'utf8')}\n`)
    const failures = await checkMaterialized(directory)
    assert.ok(failures.includes('complete_json_not_canonical_or_mismatched'))
    assert.ok(failures.includes('integrity_hash:complete.json'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
