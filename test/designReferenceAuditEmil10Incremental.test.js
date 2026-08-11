import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import {
  checkMaterialized,
  DEFAULT_DIRECTORY,
} from '../scripts/check-design-reference-audit-v1-emil10-incremental.mjs'
import {
  materialize,
} from '../scripts/materialize-design-reference-audit-v1-emil10-incremental.mjs'

const VERDICT = 'complete_softie_design_reference_incremental_emil10_audit_uncommitted'
const NEW_SKILLS = [
  'animation-vocabulary',
  'ask-sonner',
  'emil-design-eng',
  'find-animation-opportunities',
  'improve-animations',
  'pick-ui-library',
  'prototype',
]

test('incremental artifact preserves the evidence boundaries', async () => {
  const failures = await checkMaterialized(DEFAULT_DIRECTORY)
  assert.deepEqual(failures, [])

  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.upstreamCorpus.entries.length, 10)
  assert.ok(artifact.upstreamCorpus.entries.every((entry) => entry.lockHashMatchesLocalBytes))
  assert.deepEqual(
    [...new Set(artifact.newSkillObservationLedger.observations.map((observation) => observation.skill))].sort(),
    [...NEW_SKILLS].sort(),
  )
  assert.equal(artifact.provenanceLineage.lineageGroups.length, 1)
  assert.equal(artifact.provenanceLineage.lineageGroups[0].independentAuthorityCount, 1)
  assert.equal(artifact.durationEasingCandidateMatrix.recommendationClass, 'insufficient_to_prefer')
  assert.deepEqual(artifact.loadingRevealRecommendation.duration.pilotPair, ['180ms', '200ms'])
  assert.equal(artifact.schedulerApplicability.opportunityGate.passesOpportunityCondition, true)
  assert.match(artifact.schedulerApplicability.opportunityGate.implementationPrecondition, /no firstFetch\/hasLoaded flag/)
  assert.ok(artifact.claimRelations.relations.some((relation) => relation.id === 'REL-EMIL10-009' && relation.type === 'amend'))
})

test('repeat materialization is byte-identical', async () => {
  const left = await mkdtemp(join(tmpdir(), 'softie-design-audit-emil10-left-'))
  const right = await mkdtemp(join(tmpdir(), 'softie-design-audit-emil10-right-'))
  try {
    await materialize(left)
    await materialize(right)
    const leftNames = (await readdir(left)).sort()
    const rightNames = (await readdir(right)).sort()
    assert.deepEqual(leftNames, rightNames)
    for (const name of leftNames) {
      assert.deepEqual(await readFile(join(left, name)), await readFile(join(right, name)), name)
    }
    assert.deepEqual(await checkMaterialized(left), [])
    assert.deepEqual(await checkMaterialized(right), [])
  } finally {
    await rm(left, { recursive: true, force: true })
    await rm(right, { recursive: true, force: true })
  }
})

test('checker rejects a tampered companion artifact', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'softie-design-audit-emil10-tamper-'))
  try {
    await materialize(directory)
    const path = join(directory, 'loading-reveal-recommendation.json')
    await writeFile(path, `${await readFile(path, 'utf8')}\n`)
    const failures = await checkMaterialized(directory)
    assert.ok(failures.includes('companion_mismatch:loading-reveal-recommendation.json'))
    assert.ok(failures.includes('integrity_hash:loading-reveal-recommendation.json'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
