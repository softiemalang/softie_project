import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildDeterministicBase,
  exportDeterministicBaseJson,
  projectDeterministicBaseForConsumer,
} from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  deriveSajuLineageSourceSemanticResults,
  deriveSajuLineageStructuralResults,
  deriveSajuSanmingSourceSemanticResults,
  deriveSajuSourceBoundedSemanticLexiconEntries,
  deriveSajuSourceLocalSemanticCompositions,
} from '../src/interpretationPrep/sajuLineageReadingGrammar.js'
import {
  adaptSajuLineageHandoffEvidenceToConstitution,
  buildSajuLineageHandoffEvidenceEnvelope,
  consumeSajuLineageHandoffEvidenceEnvelope,
  exportSajuLineageHandoffEvidenceJson,
} from '../src/interpretationPrep/sajuLineageHandoffEvidence.js'
import { evaluateInterpretationConstitution } from '../src/interpretationConstitution.js'

const REAL_FIXTURE_INPUT = {
  subjectName: 'handoff-evidence-fixture',
  birthDate: '1992-04-18',
  birthTime: '18:30',
  targetDate: '2026-07-26',
  placeName: '대한민국 서울',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function materializeFixture(input = REAL_FIXTURE_INPUT, mutateBase = null) {
  const prepared = prepareThreeSystemInterpretationData(input)
  const base = projectDeterministicBaseForConsumer(buildDeterministicBase({
    subjectName: input.subjectName,
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
  }))
  if (mutateBase) mutateBase(base)

  const structuralResults = deriveSajuLineageStructuralResults(base)
  const semanticResults = {
    ziping: deriveSajuLineageSourceSemanticResults(base, structuralResults),
    sanming: deriveSajuSanmingSourceSemanticResults(base, structuralResults),
  }
  const semanticLexiconResults = deriveSajuSourceBoundedSemanticLexiconEntries(base, structuralResults)
  const compositionResults = deriveSajuSourceLocalSemanticCompositions(base)
  return { base, structuralResults, semanticResults, semanticLexiconResults, compositionResults }
}

function buildFixtureEnvelope(fixture) {
  return buildSajuLineageHandoffEvidenceEnvelope({
    base: fixture.base,
    structuralResults: fixture.structuralResults,
    semanticResults: fixture.semanticResults,
    semanticLexiconResults: fixture.semanticLexiconResults,
    compositionResults: fixture.compositionResults,
  })
}

test('real Base fixture round-trips through a fresh evidence file and Constitution adapter', async () => {
  const fixture = materializeFixture()
  const publicJsonBefore = exportDeterministicBaseJson(fixture.base)
  const built = buildFixtureEnvelope(fixture)

  assert.equal(built.valid, true)
  assert.ok(built.envelope)
  assert.equal(exportDeterministicBaseJson(fixture.base), publicJsonBefore)
  assert.deepEqual(Object.keys(built.envelope.baseContract).sort(), ['factRefs', 'foundationVersion', 'schemaVersion'])
  assert.equal(Object.hasOwn(built.envelope.baseContract, 'systems'), false)
  assert.equal(built.envelope.boundary.precomputedOnly, true)
  assert.equal(built.envelope.boundary.noRecalculation, true)
  assert.equal(built.envelope.boundary.noPersonalMeaning, true)
  assert.equal(built.envelope.boundary.noCrossLineageMerge, true)

  const directory = await mkdtemp(join(tmpdir(), 'saju-lineage-handoff-evidence-'))
  const filePath = join(directory, 'evidence-envelope.json')
  try {
    const serialized = exportSajuLineageHandoffEvidenceJson(built.envelope)
    await writeFile(filePath, serialized, 'utf8')
    const freshText = await readFile(filePath, 'utf8')
    const consumed = consumeSajuLineageHandoffEvidenceEnvelope(freshText, fixture.base)

    assert.equal(consumed.valid, true)
    assert.deepEqual(consumed.errors, [])
    assert.ok(consumed.envelope)
    assert.equal(exportSajuLineageHandoffEvidenceJson(consumed.envelope), freshText)

    const envelope = consumed.envelope
    assert.ok(envelope.evidence.structuralResults.length > 0)
    assert.ok(envelope.evidence.semanticResults.ziping.length > 0)
    assert.ok(envelope.evidence.semanticLexiconEntries.length > 0)
    assert.ok(envelope.evidence.compositionResults.length > 0)
    assert.ok(envelope.state.structural.unsupportedRules.some(record => record.payload.ruleId === 'feature.personal-meaning-and-prediction.v0'))
    assert.ok(envelope.state.composition.unresolvedCompositions.some(record => record.payload.compositionId === 'composition.ziping.p11-exposure-branch-sentiment.v0'))
    assert.ok(envelope.evidence.semanticResults.ziping[0].sourceRefs.sourceIds.length > 0)
    assert.ok(envelope.evidence.semanticResults.ziping[0].provenance.upstream)
    assert.equal(envelope.state.commonCandidates.semantic.length, 0)
    assert.equal(envelope.state.commonCandidates.composition.length, 0)

    const adapted = adaptSajuLineageHandoffEvidenceToConstitution({ base: fixture.base, envelope })
    assert.equal(adapted.adapterValidation.valid, true)
    assert.equal(adapted.boundary.factsAndSourceEvidenceSeparate, true)
    assert.equal(adapted.boundary.noRecalculation, true)
    assert.equal(adapted.boundary.noHypothesisGenerated, true)
    assert.equal(adapted.hypotheses.length, 0)
    assert.ok(adapted.evidence.some(item => item.kind === 'base_fact' && item.evidenceRole === 'public_deterministic_base_fact'))
    assert.ok(adapted.evidence.some(item => item.kind === 'literature_claim' && item.evidenceRole === 'structural_result' && item.status === 'structural_result'))
    assert.ok(adapted.evidence.some(item => item.kind === 'literature_claim' && item.evidenceRole === 'semantic_result' && item.status === 'available' && item.semanticBasisEligible === true))
    assert.ok(adapted.evidence.some(item => item.kind === 'literature_claim' && item.evidenceRole === 'lineage_state' && item.status === 'unresolved'))
    assert.ok(adapted.evidenceMapping.semanticBasisEligibleEvidenceIds.length > 0)

    const constitution = evaluateInterpretationConstitution(adapted)
    assert.equal(constitution.contractValid, true)
    assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
    assert.deepEqual(constitution.hypotheses, [])
    assert.equal(constitution.evidenceGroups.modern_synthesis.length, 0)
    assert.equal(constitution.evidenceGroups.ai_inference.length, 0)
    assert.equal(constitution.evidenceGroups.user_experience.length, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('handoff generation and consumption fail closed on missing inputs and provenance tampering', () => {
  const fixture = materializeFixture()
  const missing = buildSajuLineageHandoffEvidenceEnvelope({ base: fixture.base })
  assert.equal(missing.valid, false)
  assert.equal(missing.envelope, null)
  assert.ok(missing.errors.includes('structural_results_missing'))
  assert.ok(missing.errors.includes('semantic_results_by_lineage_missing'))
  assert.ok(missing.errors.includes('composition_results_missing'))

  const built = buildFixtureEnvelope(fixture)
  assert.equal(built.valid, true)
  const tampered = clone(built.envelope)
  const sourceRecord = tampered.evidence.semanticResults.ziping[0]
  const sourceId = sourceRecord.sourceRefs.sourceIds[0]
  sourceRecord.sourceRefs.sourceByteSha256[sourceId] = '0'.repeat(64)
  const rejected = consumeSajuLineageHandoffEvidenceEnvelope(JSON.stringify(tampered), fixture.base)
  assert.equal(rejected.valid, false)
  assert.equal(rejected.envelope, null)
  assert.ok(rejected.errors.some(error => error.includes('source_hash_mismatch')))
  const rejectedAdapter = adaptSajuLineageHandoffEvidenceToConstitution({ base: fixture.base, envelope: tampered })
  assert.equal(rejectedAdapter.adapterValidation.valid, false)
  assert.deepEqual(rejectedAdapter.evidence, [])
  assert.deepEqual(rejectedAdapter.conflicts, [])
  assert.deepEqual(rejectedAdapter.hypotheses, [])

  const malformed = clone(built.envelope)
  malformed.state.semantic = null
  assert.doesNotThrow(() => consumeSajuLineageHandoffEvidenceEnvelope(JSON.stringify(malformed), fixture.base))
  const malformedConsumed = consumeSajuLineageHandoffEvidenceEnvelope(JSON.stringify(malformed), fixture.base)
  assert.equal(malformedConsumed.valid, false)
  assert.equal(malformedConsumed.envelope, null)
})

test('lineage conflicts remain explicit tension through envelope and Constitution consumption', () => {
  const fixture = materializeFixture({ ...REAL_FIXTURE_INPUT, subjectName: 'handoff-conflict-fixture' }, base => {
    base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  })
  assert.equal(fixture.structuralResults.categories.lineageConflicts.length, 1)

  const built = buildFixtureEnvelope(fixture)
  assert.equal(built.valid, true)
  const conflictRecord = built.envelope.state.structural.lineageConflicts[0]
  assert.ok(conflictRecord)
  assert.equal(conflictRecord.lineage, null)
  assert.deepEqual(conflictRecord.lineages.sort(), ['ditian_local_export', 'qiongtong_local_export'])
  assert.equal(conflictRecord.payload.status, 'preserved_tension_fail_closed')
  assert.equal(conflictRecord.payload.deterministic, true)

  const adapted = adaptSajuLineageHandoffEvidenceToConstitution({ base: fixture.base, envelope: built.envelope })
  assert.equal(adapted.adapterValidation.valid, true)
  assert.equal(adapted.conflicts.length, 1)
  const conflictEvidenceId = adapted.conflicts[0].evidenceIds[0]
  const conflictEvidence = adapted.evidence.find(item => item.id === conflictEvidenceId)
  assert.equal(conflictEvidence.relation, 'conflicts')
  assert.equal(conflictEvidence.status, 'unresolved')
  assert.equal(adapted.conflicts[0].resolution, 'preserved_tension')
  assert.equal(adapted.readiness.interpretationHypothesisReady, false)

  const constitution = evaluateInterpretationConstitution(adapted)
  assert.equal(constitution.contractValid, true)
  assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
  assert.equal(constitution.conflictsPreserved, true)
})
