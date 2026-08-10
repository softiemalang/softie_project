import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { materialize, buildAuditPayload } from '../scripts/materialize-design-reference-audit-v1.mjs'
import { checkAudit } from '../scripts/check-design-reference-audit-v1.mjs'

const root = process.cwd()
const output = join(root, 'artifacts/design-reference-audit-v1')

test('design reference audit is structurally complete and preserves provenance tiers', async () => {
  const artifact = buildAuditPayload()
  assert.equal(artifact.verdict, 'complete_softie_design_reference_audit_v1_uncommitted')
  assert.deepEqual(
    new Set(artifact.sourceReferenceLedger.provenanceTiers.map((tier) => tier.code)),
    new Set(['apple_official_artifact', 'apple_derived_guidance', 'independent_design_engineering_guidance', 'softie_house_rule', 'proposed_candidate']),
  )
  assert.equal(artifact.observationValueLedger.observations.find((item) => item.id === 'OBS-SOFTIE-DURATION-FAST').value, '180ms')
  assert.equal(artifact.observationValueLedger.observations.find((item) => item.id === 'OBS-SOFTIE-EASING-STANDARD').value, 'ease')
  assert.equal(artifact.conflictCompatibilityMatrix.rows.length, 11)
  assert.equal(artifact.pilotCandidateShortlist.candidates.length, 3)
  assert.equal(artifact.pilotCandidateShortlist.candidates[0].area, 'async_loading_loaded_reveal')
  assert.equal(artifact.scope.uiMutation, false)
  assert.equal(artifact.scope.designMdMutation, false)
  if (artifact.sketchObservation.status === 'direct_observation_accessible') {
    assert.equal(artifact.sketchObservation.byteLength, 153010206)
    assert.equal(artifact.sketchObservation.sourceByteSha256, '5941547509b49a3756667905f18492dfdf4e59a977de1deacccfcf7ff94ac295')
    assert.deepEqual(artifact.sketchObservation.progress.spinnerFrameSizes, {
      large: ['35x35'],
      regular: ['20x20'],
      small: ['14x14'],
    })
    assert.deepEqual(artifact.sketchObservation.progress.spinnerOpacityValues, [0.15, 0.27, 0.39, 0.51, 0.63, 0.75, 0.87, 1])
    assert.equal(artifact.sketchObservation.motion.status, 'none_observed_in_archive_json')
    assert.deepEqual(artifact.sketchObservation.motion.keys, [])
    assert.ok(artifact.sketchObservation.materials.representativeStyles.liquidGlassLarge.some((item) => item.blur.radius === 30 && item.blur.depth === 0.9))
    assert.ok(artifact.sketchObservation.typography.dynamicTypeSamples.some((item) => item.name === 'Large Title' && item.fontName === 'SFPro-Regular' && item.fontSize === 34 && item.lineHeight === 41))
  }
  assert.deepEqual(checkAudit(output).errors, [])
})

test('design reference audit materialization is byte-identical across output directories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'softie-design-reference-audit-v1-'))
  const left = join(dir, 'left')
  const right = join(dir, 'right')
  try {
    await materialize(left)
    await materialize(right)
    const names = (await readdir(left)).sort()
    assert.deepEqual(names, (await readdir(right)).sort())
    for (const name of names) assert.deepEqual(await readFile(join(left, name)), await readFile(join(right, name)), name)
    assert.equal(checkAudit(left).pass, true)
    assert.equal(checkAudit(right).pass, true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('design reference checker rejects companion drift and promoted pilot status', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'softie-design-reference-audit-negative-'))
  try {
    await materialize(dir)
    const companionPath = join(dir, 'observation-value-ledger.json')
    await writeFile(companionPath, (await readFile(companionPath, 'utf8')).replace('180ms', '181ms'))
    assert.equal(checkAudit(dir).pass, false)
    assert.ok(checkAudit(dir).errors.some((error) => error === 'companion_content_mismatch:observation-value-ledger.json'))

    await materialize(dir)
    const completePath = join(dir, 'complete.json')
    const promoted = JSON.parse(await readFile(completePath, 'utf8'))
    promoted.pilotCandidateShortlist.candidates[0].status = 'adopted'
    await writeFile(completePath, JSON.stringify(promoted, null, 2) + '\n')
    const result = checkAudit(dir)
    assert.equal(result.pass, false)
    assert.ok(result.errors.some((error) => error === 'pilot_status_promoted:PILOT-01'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
