import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFile, rm, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  BASIS_HEAD,
  CANDIDATE_ERXIANAN,
  CANDIDATE_JIELAN,
  CANDIDATE_JIELAN_PREVIEW,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v14.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-palace-branch-slot-composition-v14.mjs'

test('v14 records the three parent-verified research units without graph admission', async () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.equal(first.artifact.basisHead, BASIS_HEAD)
  assert.deepEqual(first.artifact.graphImpact.successor, { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 })
  assert.deepEqual(first.artifact.graphImpact.additive, { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 })
  assert.deepEqual(first.artifact.v14ResearchDossier.candidates.map(item => item.candidateId), [CANDIDATE_JIELAN, CANDIDATE_ERXIANAN, CANDIDATE_JIELAN_PREVIEW])
  assert.equal(first.artifact.v14ResearchDossier.units.primary.sourceIdentity.identifier.detail, '子4051')
  assert.equal(first.artifact.v14ResearchDossier.units.primary.sourceIdentity.heldBy.detail, '安徽省博物館')
  assert.equal(first.artifact.v14ResearchDossier.units.secondary.transmissionCheck.exactZiweiChildUnder1906, false)
  assert.equal(first.artifact.v14ResearchDossier.units.tertiary.requestedIdentifier.isbn, '9789888266944')
  assert.equal(first.artifact.v14ResearchDossier.units.tertiary.targetEdition.isbn, '9789888317127')
  assert.equal(first.artifact.v14ResearchDossier.fiveFieldSummary.directSingleWitnessFullBindingCount, 0)
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-palace-composition-v14-check-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(checkArtifact(ROOT, target), [])
    const firstBytes = await readFile(target)
    await materializeBundle(target, { mode: 'historical_reference' })
    assert.deepEqual(await readFile(target), firstBytes)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('v14 negative checker rejects authority, binding, lineage, graph, and readiness shortcuts', () => {
  const output = execFileSync('node', ['scripts/check-ziwei-p0-palace-branch-slot-composition-v14-negative-v0.mjs'], { cwd: ROOT, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 11)
  assert.equal(result.allRejected, true)
})
