import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { checkAstrologyInterpretationHandoff, astrologyInterpretationHandoffContentSha256 } from '../src/astrology/astrologyInterpretationHandoff.js'

test('astrology interpretation handoff is deterministic and fail-closed', async () => {
  const a = await mkdtemp(join(tmpdir(), 'astrology-handoff-a-'))
  const b = await mkdtemp(join(tmpdir(), 'astrology-handoff-b-'))
  const run = outputDir => JSON.parse(execFileSync(process.execPath, ['scripts/materialize-astrology-interpretation-handoff-v1.mjs'], { env: { ...process.env, ASTROLOGY_HANDOFF_OUTPUT_DIR: outputDir }, encoding: 'utf8' }))
  const first = run(a); const second = run(b)
  assert.equal(first.bundleContentSha256, second.bundleContentSha256)
  assert.deepEqual(await readFile(join(a, 'complete.json')), await readFile(join(b, 'complete.json')))
  assert.equal(first.claimCount, 53); assert.equal(first.nodeCount, 53); assert.equal(first.edgeCount, 1753)
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/check-astrology-interpretation-handoff-v1.mjs', join(a, 'complete.json')], { encoding: 'utf8' }))
  assert.equal(checked.pass, true)
  assert.equal(checked.activation.availableForInterpretation, false)
})

test('handoff boundary has stable negative evidence for manifest and source tampering', async () => {
  const evidence = JSON.parse(await readFile('artifacts/astrology-interpretation-handoff-v1/complete.json', 'utf8'))
  const roles = { packet: 'artifacts/astrology-interpretation-packet-v1/complete.json', context: 'artifacts/astrology-interpretation-context-v1/complete.json', readiness: 'artifacts/astrology-interpretation-readiness-v1/complete.json', graph: 'artifacts/astrology-claim-relation-graph-v1/complete.json' }
  const components = {}; const artifactBytes = {}
  for (const [role, path] of Object.entries(roles)) { artifactBytes[role] = await readFile(path); components[role] = JSON.parse(artifactBytes[role]) }
  const check = (mutateBundle = () => {}, mutateComponents = () => {}, rehash = false) => {
    const bundle = structuredClone(evidence.bundle); const values = structuredClone(components); mutateBundle(bundle); mutateComponents(values)
    if (rehash) bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(bundle)
    return checkAstrologyInterpretationHandoff(bundle, { components: values, artifactBytes })
  }
  const cases = [
    ['missing_component', b => { delete b.components.packet }, () => {}, 'component_missing_or_not_object', true],
    ['wrong_version', b => { b.components.context.content.version = '9.9.9' }, () => {}, 'component_schema_or_version_mismatch', true],
    ['content_hash', b => { b.bundleContentSha256 = '0'.repeat(64) }, () => {}, 'bundle_content_hash_mismatch'],
    ['statistics', b => { b.statistics.graphEdges = 1 }, () => {}, 'statistics_invalid', true],
    ['provenance', b => { b.provenance.context = 'incomplete' }, () => {}, 'provenance_incomplete', true],
    ['interpretation', b => { b.theme = 'injected' }, () => {}, 'interpretation_output_present', true],
    ['claim_deleted', () => {}, values => { values.graph.graph.nodes.pop() }, 'component_content_hash_mismatch', false],
    ['forbidden_relation', b => { b.relationVocabulary[0] = 'dominates' }, () => {}, 'relation_vocabulary_invalid', true],
    ['activation_promoted', b => { b.activation.availableForInterpretation = true }, () => {}, 'activation_boundary_mismatch', true],
  ]
  const negativeEvidence = cases.map(([caseId, mutateBundle, mutateComponents, reasonCode, rehash]) => ({ caseId, reasonCode, observed: check(mutateBundle, mutateComponents, rehash).reasonCodes }))
  for (const item of negativeEvidence) assert.ok(item.observed.includes(item.reasonCode), `${item.caseId}: ${item.observed.join(',')}`)
  assert.equal(createHash('sha256').update(JSON.stringify(negativeEvidence)).digest('hex').length, 64)
})
