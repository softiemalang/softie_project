import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateInterpretationConstitution,
  isDeterministicFactRef,
  validateDeterministicBaseForInterpretation,
} from '../src/interpretationConstitution.js'

const BASE = {
  schemaVersion: 'tri-system-deterministic-base-v0',
  foundationVersion: 'deterministic-base-v0',
  normalizedInput: {
    subjectName: 'fixture',
    birthDate: '2000-01-01',
    birthTime: '12:00',
  },
  systems: {
    saju: {
      domain: 'saju',
      displayName: 'Saju',
      fact: {
        fixtureValue: 'A',
      },
    },
    astrology: {
      domain: 'astrology',
      displayName: 'Astrology',
      fact: {
        fixtureValue: 'B',
      },
    },
  },
  consumerBoundary: {
    factScope: 'verified_claims_only',
    omittedClaims: 'not_provided_as_facts',
    interpretation: 'separate_fact_from_interpretation_and_confirm_personal_context',
  },
}

test('Constitution accepts only the frozen public Base and never recalculates a FACT', () => {
  assert.deepEqual(validateDeterministicBaseForInterpretation(BASE), { valid: true, errors: [] })
  assert.equal(isDeterministicFactRef(BASE, 'systems.saju.fact.fixtureValue'), true)
  assert.equal(isDeterministicFactRef(BASE, 'systems.saju.fact.missingValue'), false)
  assert.equal(isDeterministicFactRef(BASE, 'normalizedInput.birthTime'), true)
  assert.equal(isDeterministicFactRef(BASE, 'normalizedInput.missingValue'), false)

  const result = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'base-fact-1',
      kind: 'base_fact',
      status: 'available',
      admission: 'base_contract',
      relation: 'supports',
      factRefs: ['systems.saju.fact.fixtureValue'],
    }],
  })

  assert.equal(result.contractValid, true)
  assert.equal(result.interpretationDecision, 'facts_only_no_semantic_interpretation')
  assert.equal(result.semanticInterpretation.factPresenceDoesNotEstablishMeaning, true)
  assert.equal(result.noRecalculation, true)
  assert.deepEqual(result.evidenceGroups, {
    base_fact: ['base-fact-1'],
    literature_claim: [],
    modern_synthesis: [],
    ai_inference: [],
    user_experience: [],
  })
})

test('A single FACT cannot become a personal conclusion without an explicit hypothesis boundary and semantic basis', () => {
  const noBasis = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'base-fact-1',
      kind: 'base_fact',
      status: 'available',
      admission: 'base_contract',
      relation: 'supports',
      factRefs: ['systems.saju.fact.fixtureValue'],
    }],
    hypotheses: [{
      id: 'unsafe-single-fact',
      statement: '개인의 특성이 확정된다',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: ['systems.saju.fact.fixtureValue'],
      evidenceIds: ['base-fact-1'],
    }],
  })
  assert.equal(noBasis.contractValid, true)
  assert.equal(noBasis.interpretationDecision, 'blocked_semantic_basis_missing')
  assert.deepEqual(noBasis.hypotheses[0].status, 'blocked_semantic_basis_missing')
  assert.equal(noBasis.hypotheses[0].noSemanticMeaningFromFactPresence, true)

  const definitive = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [],
    hypotheses: [{
      id: 'definitive-fact',
      statement: '확정 FACT',
      claimType: 'fact',
      status: 'confirmed',
      userExperienceGate: 'required',
      factRefs: ['systems.saju.fact.fixtureValue'],
      evidenceIds: [],
    }],
  })
  assert.equal(definitive.contractValid, false)
  assert.ok(definitive.violations.includes('hypothesis_claim_type_invalid:definitive-fact'))
  assert.ok(definitive.violations.includes('hypothesis_status_not_tentative:definitive-fact'))
})

test('Separate literature, synthesis, AI, and user evidence yields only a priority-bearing hypothesis', () => {
  const result = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [
      {
        id: 'fact-1',
        kind: 'base_fact',
        status: 'available',
        admission: 'base_contract',
        relation: 'supports',
        factRefs: ['systems.saju.fact.fixtureValue'],
      },
      {
        id: 'literature-1',
        kind: 'literature_claim',
        status: 'available',
        admission: 'semantic_candidate',
        relation: 'supports',
        statement: '별도 문헌 주장 후보',
      },
      {
        id: 'synthesis-1',
        kind: 'modern_synthesis',
        status: 'available',
        admission: 'semantic_candidate',
        relation: 'supports',
        statement: '현대적 종합 후보',
      },
      {
        id: 'ai-1',
        kind: 'ai_inference',
        status: 'inferred',
        admission: 'none',
        relation: 'supports',
        statement: 'AI 추론 후보',
      },
      {
        id: 'user-1',
        kind: 'user_experience',
        status: 'reported',
        admission: 'user_report',
        relation: 'conflicts',
        statement: '사용자 경험 보고',
      },
    ],
    conflicts: [{
      id: 'tension-1',
      evidenceIds: ['user-1'],
      resolution: 'preserved_tension',
    }],
    hypotheses: [{
      id: 'h-1',
      statement: '검토 가능한 해석 가설',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: ['systems.saju.fact.fixtureValue'],
      evidenceIds: ['fact-1', 'literature-1', 'synthesis-1', 'ai-1', 'user-1'],
      semanticBasisIds: ['literature-1', 'synthesis-1'],
      conflictIds: ['tension-1'],
    }],
  })

  assert.equal(result.interpretationDecision, 'hypothesis_only')
  assert.deepEqual(result.hypotheses[0], {
    id: 'h-1',
    status: 'hypothesis_only',
    factRefs: ['systems.saju.fact.fixtureValue'],
    factDomains: ['saju'],
    semanticBasisIds: ['literature-1', 'synthesis-1'],
    excludedEvidenceIds: [],
    priority: 'elevated_hypothesis_priority',
    agreementTreatment: 'priority_only_never_confirmation_or_majority',
    crossSystemTreatment: 'single_system_or_unresolved',
    conflictStatus: 'tension_preserved',
    conflictIds: ['tension-1'],
    userExperienceDecision: 'user_experience_first_defer_application',
    userExperienceRequired: true,
    noRecalculation: true,
    noSemanticMeaningFromFactPresence: true,
  })
  assert.equal(result.conflictsPreserved, true)
})

test('Cross-system agreement is not inter-validation or majority, and unsupported evidence cannot fill a gap', () => {
  const crossSystem = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [
      {
        id: 'saju-fact', kind: 'base_fact', status: 'available', admission: 'base_contract', relation: 'supports',
        factRefs: ['systems.saju.fact.fixtureValue'],
      },
      {
        id: 'astro-fact', kind: 'base_fact', status: 'available', admission: 'base_contract', relation: 'supports',
        factRefs: ['systems.astrology.fact.fixtureValue'],
      },
      {
        id: 'semantic', kind: 'literature_claim', status: 'available', admission: 'semantic_candidate', relation: 'supports',
        statement: '분리된 의미 후보',
      },
    ],
    hypotheses: [{
      id: 'cross-system-hypothesis', statement: '체계 간 공통 가설', claimType: 'interpretation_hypothesis', status: 'hypothesis',
      userExperienceGate: 'required', factRefs: ['systems.saju.fact.fixtureValue', 'systems.astrology.fact.fixtureValue'],
      evidenceIds: ['saju-fact', 'astro-fact', 'semantic'], semanticBasisIds: ['semantic'],
    }],
  })
  assert.equal(crossSystem.interpretationDecision, 'hypothesis_only')
  assert.equal(crossSystem.hypotheses[0].priority, 'baseline_cross_system_not_counted')
  assert.equal(crossSystem.hypotheses[0].crossSystemTreatment, 'not_intervalidation_or_vote')
  assert.equal(crossSystem.noCrossSystemMajority, true)

  const unsupported = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'unsupported-semantic', kind: 'literature_claim', status: 'unsupported', admission: 'semantic_candidate', relation: 'supports',
      statement: '미지원 의미 추정',
    }],
    hypotheses: [{
      id: 'unsupported-hypothesis', statement: '미지원 영역을 채운 가설', claimType: 'interpretation_hypothesis', status: 'hypothesis',
      userExperienceGate: 'required', factRefs: ['systems.saju.fact.fixtureValue'], evidenceIds: ['unsupported-semantic'],
      semanticBasisIds: ['unsupported-semantic'],
    }],
  })
  assert.equal(unsupported.interpretationDecision, 'blocked_semantic_basis_missing')
  assert.deepEqual(unsupported.hypotheses[0].excludedEvidenceIds, ['unsupported-semantic'])
})

test('Conflicts and user-experience gates are fail-closed rather than silently resolved', () => {
  const missingConflictLedger = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'fact-1', kind: 'base_fact', status: 'available', admission: 'base_contract', relation: 'supports',
      factRefs: ['systems.saju.fact.fixtureValue'],
    }, {
      id: 'conflicting-1', kind: 'literature_claim', status: 'candidate', admission: 'semantic_candidate', relation: 'conflicts',
      statement: '반대 근거',
    }],
    hypotheses: [{
      id: 'missing-conflict', statement: '충돌을 숨긴 가설', claimType: 'interpretation_hypothesis', status: 'hypothesis',
      userExperienceGate: 'required', factRefs: ['systems.saju.fact.fixtureValue'], evidenceIds: ['fact-1', 'conflicting-1'],
      semanticBasisIds: [],
    }],
  })
  assert.equal(missingConflictLedger.contractValid, false)
  assert.ok(missingConflictLedger.violations.some(code => code.startsWith('conflict_not_preserved:missing-conflict')))

  const missingUserGate = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'semantic-1', kind: 'literature_claim', status: 'candidate', admission: 'semantic_candidate', relation: 'supports',
      statement: '의미 후보',
    }],
    hypotheses: [{
      id: 'missing-user-gate', statement: '사용자 확인 없는 적용', claimType: 'interpretation_hypothesis', status: 'hypothesis',
      factRefs: ['systems.saju.fact.fixtureValue'], evidenceIds: ['semantic-1'], semanticBasisIds: ['semantic-1'],
    }],
  })
  assert.equal(missingUserGate.contractValid, false)
  assert.ok(missingUserGate.violations.includes('user_experience_gate_missing:missing-user-gate'))
})

test('Candidate semantic material is retained as evidence but cannot unlock interpretation', () => {
  const result = evaluateInterpretationConstitution({
    base: BASE,
    evidence: [{
      id: 'candidate-semantic',
      kind: 'literature_claim',
      status: 'candidate',
      admission: 'semantic_candidate',
      relation: 'supports',
      statement: '아직 닫히지 않은 의미 후보',
    }],
    hypotheses: [{
      id: 'candidate-only',
      statement: '후보 자료만으로 적용',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: ['systems.saju.fact.fixtureValue'],
      evidenceIds: ['candidate-semantic'],
      semanticBasisIds: ['candidate-semantic'],
    }],
  })

  assert.equal(result.interpretationDecision, 'blocked_semantic_basis_missing')
  assert.deepEqual(result.hypotheses[0].excludedEvidenceIds, ['candidate-semantic'])
})

test('Malformed evidence, hypothesis, and conflict containers fail closed without recalculation', () => {
  const result = evaluateInterpretationConstitution({
    base: BASE,
    evidence: null,
    conflicts: { id: 'not-a-list' },
    hypotheses: [{
      id: 'malformed-containers',
      statement: '형식이 잘못된 입력',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: ['systems.saju.fact.fixtureValue'],
      evidenceIds: 'not-a-list',
    }],
  })

  assert.equal(result.contractValid, false)
  assert.equal(result.interpretationDecision, 'blocked_contract_violation')
  assert.ok(result.violations.includes('evidence_list_missing'))
  assert.ok(result.violations.includes('conflicts_not_array'))
  assert.ok(result.violations.includes('hypothesis_evidence_not_array:malformed-containers'))
  assert.equal(result.noRecalculation, true)
})
