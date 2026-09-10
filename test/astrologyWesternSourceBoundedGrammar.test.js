import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import {
  PTOLEMY_SOURCE_ID,
  deriveAstrologySourceBoundedGrammar,
  getWesternSourceLexicon,
  validateAstrologySourceBoundedGrammar,
} from '../src/astrology/astrologySourceBoundedGrammar.js'
import { evaluateInterpretationConstitution } from '../src/interpretationConstitution.js'
import {
  adaptAstrologyWesternEvidenceToConstitution,
  astrologyWesternEvidenceContentSha256,
  buildAstrologyWesternEvidenceEnvelope,
  canonicalAstrologyWesternEvidenceJson,
  consumeAstrologyWesternEvidenceEnvelope,
} from '../src/interpretationPrep/astrologyWesternEvidenceHandoff.js'

const SOURCE_FIXTURE = {
  candidateId: 'western-source-bounded-fixture-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  bodies: [
    { id: 'sun', longitudeDegrees: 0, longitudeSpeedDegreesPerDay: 0.9 },
    { id: 'moon', longitudeDegrees: 120, longitudeSpeedDegreesPerDay: 13 },
    { id: 'mercury', longitudeDegrees: 30, longitudeSpeedDegreesPerDay: 1 },
    { id: 'venus', longitudeDegrees: 60, longitudeSpeedDegreesPerDay: 1.2 },
    { id: 'mars', longitudeDegrees: 90, longitudeSpeedDegreesPerDay: 0.5 },
    { id: 'jupiter', longitudeDegrees: 180, longitudeSpeedDegreesPerDay: 0.1 },
    { id: 'saturn', longitudeDegrees: 210, longitudeSpeedDegreesPerDay: 0.05 },
    { id: 'uranus', longitudeDegrees: 150, longitudeSpeedDegreesPerDay: 0.02 },
    { id: 'neptune', longitudeDegrees: 87, longitudeSpeedDegreesPerDay: 0.01 },
    { id: 'pluto', longitudeDegrees: 300, longitudeSpeedDegreesPerDay: 0.01 },
  ],
  angles: {
    ascendant: { longitudeDegrees: 0 },
    midheaven: { longitudeDegrees: 90 },
  },
}

const PACKET_FIXTURE = {
  schemaVersion: 'astrology-interpretation-packet-v1',
  packetVersion: '1.0.0',
  packetStatus: 'complete',
  packetContentSha256: '1'.repeat(64),
  identities: {
    providerBundleSha256: '2'.repeat(64),
    rawChartSha256: '3'.repeat(64),
    ruleChartSha256: '4'.repeat(64),
  },
}

const BASE_FIXTURE = {
  schemaVersion: 'tri-system-deterministic-base-v0',
  foundationVersion: 'deterministic-base-v0',
  normalizedInput: { fixture: 'western-source-bounded' },
  systems: { astrology: { fact: { fixture: 'western-source-bounded' } } },
  consumerBoundary: {
    factScope: 'verified_claims_only',
    omittedClaims: 'not_provided_as_facts',
    interpretation: 'separate_fact_from_interpretation_and_confirm_personal_context',
  },
}

function clone(value) {
  return structuredClone(value)
}

function fixture() {
  const ruleChart = deriveAstrologyRuleChart(SOURCE_FIXTURE)
  const grammar = deriveAstrologySourceBoundedGrammar({ ruleChart })
  return { ruleChart, grammar }
}

test('Ptolemy source-bounded grammar emits only closed structural and source-local labels', () => {
  const { grammar } = fixture()
  assert.deepEqual(validateAstrologySourceBoundedGrammar(grammar), { valid: true, errors: [] })

  const quadruplicity = grammar.structuralResults.find(item => item.resultId === 'structural.ptolemy.sign-quadruplicity.sun')
  assert.equal(quadruplicity.resultStatus, 'available')
  assert.equal(quadruplicity.output.sourceTerm, 'equinoctial')

  const domicile = grammar.structuralResults.find(item => item.resultId === 'structural.ptolemy.domicile.sun')
  assert.equal(domicile.output.domicileBodyId, 'mars')

  const planetClass = grammar.semanticResults.find(item => item.resultId === 'semantic.ptolemy.planet-class.moon')
  assert.equal(planetClass.output.sourceTerm, 'beneficent')
  assert.equal(grammar.semanticResults.find(item => item.resultId === 'semantic.ptolemy.planet-class.uranus').resultStatus, 'unsupported')

  const exactTrine = grammar.compositionResults.find(item => item.resultId === 'composition.ptolemy.aspect-harmony.sun__moon__trine')
  assert.equal(exactTrine.resultStatus, 'available')
  assert.equal(exactTrine.output.sourceSemanticLabel, 'harmonious')

  const orbMatch = grammar.compositionResults.find(item => item.resultId === 'composition.ptolemy.aspect-harmony.sun__neptune__square')
  assert.equal(orbMatch.resultStatus, 'unresolved')
  assert.equal(orbMatch.reason, 'source_requires_exact_relation_not_modern_orb_match')

  const oppositeKindConflict = grammar.compositionResults.find(item => item.resultId === 'composition.ptolemy.aspect-harmony.sun__jupiter__opposition')
  assert.equal(oppositeKindConflict.resultStatus, 'conflict')
  assert.equal(oppositeKindConflict.executionStatus, 'conflict_preserved')

  assert.ok(grammar.compositionResults.some(item => item.ruleId === 'rule.ptolemy.familiarity-throne-composition.v0' && item.resultStatus === 'unresolved'))
  assert.ok(grammar.compositionResults.some(item => item.ruleId === 'rule.ptolemy.application-separation.v0' && item.resultStatus === 'unresolved'))
  assert.ok(grammar.boundary.personalInterpretationCreated === false)
  assert.equal(grammar.boundary.crossLineageComposition, false)
  assert.deepEqual(getWesternSourceLexicon().map(item => item.sourceId), Array(5).fill(PTOLEMY_SOURCE_ID))
})

test('source grammar stays fail-closed for missing, unknown, non-tropical, and non-admitted lineage inputs', () => {
  const { ruleChart } = fixture()

  const missing = deriveAstrologySourceBoundedGrammar({
    ruleChart: { metadata: { zodiac: 'tropical' }, bodies: [{ id: 'sun', availability: 'unavailable' }], angles: {} },
  })
  assert.ok(missing.structuralResults.every(item => item.resultStatus === 'blocked'))
  assert.ok(missing.compositionResults.some(item => item.resultStatus === 'unresolved'))
  assert.equal(validateAstrologySourceBoundedGrammar(missing).valid, true)

  const nonTropical = deriveAstrologySourceBoundedGrammar({ ruleChart: { ...ruleChart, metadata: { ...ruleChart.metadata, zodiac: 'sidereal' } } })
  assert.ok(nonTropical.structuralResults.every(item => item.resultStatus === 'blocked'))
  assert.equal(validateAstrologySourceBoundedGrammar(nonTropical).valid, true)

  const unknownSignChart = clone(ruleChart)
  unknownSignChart.bodies[0].signId = 'unknown-sign'
  const unknownSign = deriveAstrologySourceBoundedGrammar({ ruleChart: unknownSignChart })
  assert.ok(unknownSign.structuralResults.filter(item => item.resultId.includes('.sun')).every(item => item.resultStatus === 'blocked'))
  assert.equal(validateAstrologySourceBoundedGrammar(unknownSign).valid, true)

  const nonAdmitted = deriveAstrologySourceBoundedGrammar({ ruleChart, sourceId: 'western-source-lilly-christian-astrology' })
  assert.equal(nonAdmitted.status, 'blocked')
  assert.equal(validateAstrologySourceBoundedGrammar(nonAdmitted).valid, false)
})

test('Western evidence envelope preserves FACT/source lanes through fresh-file consumption and Constitution adapter', async () => {
  const { grammar } = fixture()
  const built = buildAstrologyWesternEvidenceEnvelope({
    packet: PACKET_FIXTURE,
    grammarResult: grammar,
    baseFactRefs: ['systems.astrology.fact.fixture'],
  })
  assert.equal(built.valid, true)
  assert.ok(built.envelope)
  assert.equal(built.envelope.activation.availableForInterpretation, false)
  assert.equal(built.envelope.boundary.noCrossLineageSynthesis, true)
  assert.equal(built.envelope.constitutionEvidenceAdapter.hypotheses.length, 0)
  assert.equal(built.envelope.state.commonCandidates.length, 0)
  assert.ok(built.envelope.sourceScope.sourceProfiles.some(item => item.sourceId === 'western-source-lilly-christian-astrology' && item.admission.status === 'candidate_unreviewed_page_witness'))

  const directory = await mkdtemp(join(tmpdir(), 'astrology-western-evidence-'))
  const filePath = join(directory, 'evidence-envelope.json')
  try {
    await writeFile(filePath, canonicalAstrologyWesternEvidenceJson(built.envelope), 'utf8')
    const freshText = await readFile(filePath, 'utf8')
    const consumed = consumeAstrologyWesternEvidenceEnvelope(freshText, {
      packet: PACKET_FIXTURE,
      grammarResult: grammar,
      base: BASE_FIXTURE,
    })
    assert.equal(consumed.valid, true)
    assert.deepEqual(consumed.errors, [])
    assert.equal(canonicalAstrologyWesternEvidenceJson(consumed.envelope), freshText)
    assert.equal(consumed.envelope.contentSha256, astrologyWesternEvidenceContentSha256(consumed.envelope))

    const adapted = adaptAstrologyWesternEvidenceToConstitution({ base: BASE_FIXTURE, envelope: consumed.envelope })
    assert.equal(adapted.adapterValidation.valid, true)
    assert.equal(adapted.boundary.factsAndSourceEvidenceSeparate, true)
    assert.equal(adapted.boundary.noHypothesisGenerated, true)
    assert.ok(adapted.evidence.some(item => item.kind === 'base_fact'))
    assert.ok(adapted.evidence.some(item => item.evidenceRole === 'source_structural_result'))
    assert.ok(adapted.evidence.some(item => item.evidenceRole === 'source_semantic_result' && item.status === 'available'))
    assert.ok(adapted.evidence.some(item => item.status === 'unresolved'))
    assert.ok(adapted.evidence.some(item => item.status === 'unsupported'))
    assert.ok(adapted.evidence.some(item => item.status === 'conflict' && item.relation === 'conflicts'))

    const constitution = evaluateInterpretationConstitution(adapted.constitutionInput)
    assert.equal(constitution.contractValid, true)
    assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
    assert.deepEqual(constitution.hypotheses, [])
    assert.equal(constitution.conflictsPreserved, true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Western evidence handoff rejects tamper, missing grammar, packet mismatch, and activation promotion', () => {
  const { grammar } = fixture()
  const built = buildAstrologyWesternEvidenceEnvelope({ packet: PACKET_FIXTURE, grammarResult: grammar })
  assert.equal(built.valid, true)

  const tampered = clone(built.envelope)
  tampered.evidence[0].statement = 'tampered'
  const rejectedTamper = consumeAstrologyWesternEvidenceEnvelope(JSON.stringify(tampered), { packet: PACKET_FIXTURE, grammarResult: grammar })
  assert.equal(rejectedTamper.valid, false)
  assert.ok(rejectedTamper.errors.includes('content_hash_mismatch'))

  const losslessTamper = clone(built.envelope)
  losslessTamper.evidence = losslessTamper.evidence.slice(1)
  losslessTamper.contentSha256 = astrologyWesternEvidenceContentSha256(losslessTamper)
  const rejectedLosslessTamper = consumeAstrologyWesternEvidenceEnvelope(JSON.stringify(losslessTamper), { grammarResult: grammar })
  assert.equal(rejectedLosslessTamper.valid, false)
  assert.ok(rejectedLosslessTamper.errors.includes('evidence_not_lossless_from_grammar'))

  const wrongPacket = consumeAstrologyWesternEvidenceEnvelope(JSON.stringify(built.envelope), {
    packet: { ...PACKET_FIXTURE, packetContentSha256: '9'.repeat(64) },
    grammarResult: grammar,
  })
  assert.equal(wrongPacket.valid, false)
  assert.ok(wrongPacket.errors.includes('source_packet_identity_mismatch'))

  const promoted = clone(built.envelope)
  promoted.activation.availableForInterpretation = true
  promoted.contentSha256 = astrologyWesternEvidenceContentSha256(promoted)
  const rejectedPromotion = consumeAstrologyWesternEvidenceEnvelope(JSON.stringify(promoted), { grammarResult: grammar })
  assert.equal(rejectedPromotion.valid, false)
  assert.ok(rejectedPromotion.errors.includes('activation_boundary_invalid'))

  const missing = buildAstrologyWesternEvidenceEnvelope({ packet: PACKET_FIXTURE })
  assert.equal(missing.valid, false)
  assert.equal(missing.envelope, null)
})
