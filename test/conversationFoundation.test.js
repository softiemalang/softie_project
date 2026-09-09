import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import {
  buildDeterministicBase,
  buildConversationFoundation,
  extractSajuFoundation,
  extractZiweiFoundation,
  extractAstrologyFoundation,
  formatDeterministicBaseMarkdown,
  exportDeterministicBaseJson,
  exportDeterministicBaseValidationJson,
  createFreshChatContinuationPrompt,
  extractContinuationContext,
  FOUNDATION_VERSION,
  CANONICAL_SCHEMA_VERSION,
  SAJU_FACT_GROUNDINGS,
} from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'

// 1. Real Saju & Ziwei Input Fixture
const REAL_BIRTH_INPUT = {
  subjectName: '한규',
  birthDate: '1997-04-21',
  birthTime: '14:40',
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

// 2. Real Western Astrology Offline Verified Research Artifact Fixture
const ASTRO_PACKET_PATH = resolve('artifacts/astrology-interpretation-packet-v1/complete.json')
const ASTRO_GROUNDING_PATH = resolve('artifacts/astrology-conversation-grounding-v1/complete.json')

const ATTACHMENT_FORBIDDEN_KEYS = new Set([
  'analysis',
  'dominantTenGods',
  'roleHints',
  'supportsWeakElement',
  'addsToOverloadedElement',
  'experimentalProfiling',
  'gyeokguk',
  'yongShin',
  'strength',
  'shinsal',
  'tongGeunPillars',
  'tuGanStems',
  'lunarBasis',
  'stemsBranches',
  'mingShenGong',
  'bureau',
  'majorStars',
  'transformations',
  'minorStars',
  'palaces',
  'palaceId',
  'palaceName',
  'palaceBranch',
])

function findForbiddenKeyPaths(value, path = '$') {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenKeyPaths(item, `${path}[${index}]`))
  }
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => [
    ...(ATTACHMENT_FORBIDDEN_KEYS.has(key) ? [`${path}.${key}`] : []),
    ...findForbiddenKeyPaths(child, `${path}.${key}`),
  ])
}

test('Saju Real Fixture: extracts normalized INPUT, FACT, SOURCE, UNKNOWN with zero recalculation, zero synthesis, and preserves boundaries', () => {
  const prepared = prepareThreeSystemInterpretationData(REAL_BIRTH_INPUT)
  const sajuFoundation = extractSajuFoundation(prepared.result)

  // Basic Contract
  assert.equal(sajuFoundation.domain, 'saju')
  assert.equal(sajuFoundation.isInactiveResearch, false)
  assert.ok(['available', 'experimental'].includes(sajuFoundation.activation.status))

  // Purity Assertion: SYNTHESIS must be completely absent
  assert.equal(sajuFoundation.synthesis, undefined, 'SYNTHESIS must not be present in canonical deterministic base')

  // 1. INPUT verification
  assert.equal(sajuFoundation.input.subjectName, '한규')
  assert.equal(sajuFoundation.input.birthDate, '1997-04-21')
  assert.equal(sajuFoundation.input.birthTime, '14:40')
  assert.equal(sajuFoundation.input.targetDate, '2026-07-26')
  assert.equal(sajuFoundation.input.placeName, '대한민국 서울')
  assert.equal(sajuFoundation.input.referenceCity, 'seoul')
  assert.equal(sajuFoundation.input.gender, 'male')
  assert.equal(sajuFoundation.input.calendar, 'solar')
  assert.equal(sajuFoundation.input.timezone, 'Asia/Seoul')
  assert.equal(sajuFoundation.input.latitude, '37.57')
  assert.equal(sajuFoundation.input.longitude, '126.97')

  // 2. FACT verification
  assert.equal(sajuFoundation.fact.pillars.year, '정축')
  assert.equal(sajuFoundation.fact.pillars.month, '갑진')
  assert.equal(sajuFoundation.fact.pillars.day, '계사')
  assert.equal(sajuFoundation.fact.pillars.hour, '기미')
  assert.equal(sajuFoundation.fact.dayMaster, '계')
  assert.deepEqual(sajuFoundation.fact.dayMasterDetails, { stem: '계', yinYang: '음', element: '수' })
  assert.deepEqual(sajuFoundation.fact.pillarFacts.year.hiddenStems, [
    { stem: '기', weight: 0.6, tenGod: '편관' },
    { stem: '계', weight: 0.3, tenGod: '비견' },
    { stem: '신', weight: 0.1, tenGod: '편인' },
  ])
  assert.equal(sajuFoundation.fact.pillarFacts.month.stemTenGod, '상관')
  assert.equal(sajuFoundation.fact.pillarFacts.month.branchMainStem, '무')
  assert.equal(sajuFoundation.fact.pillarFacts.month.branchMainStemTenGod, '정관')
  assert.equal(sajuFoundation.fact.pillarFacts.day.stemTenGod, null)
  assert.equal(sajuFoundation.fact.pillarFacts.hour.hiddenStems[0].tenGod, '편관')
  assert.equal(sajuFoundation.fact.isGanyeojidong, false)
  assert.equal(sajuFoundation.fact.elementsDistribution.토, 4)
  assert.equal(sajuFoundation.fact.elementsDistribution.수, 1)
  assert.match(sajuFoundation.fact.pillarsFormatted, /연주 정축 · 월주 갑진 · 일주 계사 · 시주 기미/)
  assert.ok(sajuFoundation.fact.timing.daYun, '대운 데이터 존재')
  assert.ok(sajuFoundation.fact.timing.seUn, '세운 데이터 존재')
  assert.equal(sajuFoundation.fact.timing.daYun.direction, 'backward')
  assert.equal(sajuFoundation.fact.timing.daYun.startAge.decimalYears, 5.4963)
  assert.equal(sajuFoundation.fact.timing.daYun.firstStartDate, '2002-10-20')
  assert.equal(sajuFoundation.fact.timing.daYun.cycles.find((cycle) => cycle.isActive).value, '신축')
  assert.equal(sajuFoundation.fact.timing.seUn.value, '병오')
  assert.equal(sajuFoundation.fact.timing.wolUn.value, '을미')
  assert.equal(sajuFoundation.fact.timing.ilJin.value, '신축')
  assert.equal(sajuFoundation.unknown.experimentalProfiling, undefined)
  assert.equal(new Set(sajuFoundation.unknown.warnings).size, sajuFoundation.unknown.warnings.length)
  assert.deepEqual(findForbiddenKeyPaths(sajuFoundation), [])

  // 3. SOURCE verification
  assert.equal(sajuFoundation.source.lineageTexts.length, 5)
  const titles = sajuFoundation.source.lineageTexts.map((t) => t.title)
  assert.ok(titles.some((t) => t.includes('연해자평')))
  assert.ok(titles.some((t) => t.includes('삼명통회')))
  assert.ok(titles.some((t) => t.includes('적천수')))
  assert.ok(titles.some((t) => t.includes('자평진전')))
  assert.ok(titles.some((t) => t.includes('궁통보감')))
  assert.equal(sajuFoundation.source.structuralReference.isGanyeojidong, false)
  assert.equal(sajuFoundation.source.historicalLimitations.unresolvedEdition, true)
  assert.equal(sajuFoundation.source.historicalLimitations.historicalAuthority, 'insufficient_evidence')
  assert.equal(sajuFoundation.source.historicalLimitations.historicalFact, false)

  // Fact Groundings Provenance verification (distinguishing textual references vs modern policy)
  assert.ok(Array.isArray(sajuFoundation.source.factGroundings))
  assert.equal(sajuFoundation.source.factGroundings.length, SAJU_FACT_GROUNDINGS.length)

  const groundingsByKey = Object.fromEntries(
    sajuFoundation.source.factGroundings.map((g) => [g.factKey, g]),
  )

  const expectedGroundingKeys = [
    'factKey',
    'factLabel',
    'evidenceType',
    'authorityScope',
    'classicalWitness',
    'modernPolicy',
    'distinctionNote',
  ]
  for (const grounding of sajuFoundation.source.factGroundings) {
    assert.deepEqual(Object.keys(grounding), expectedGroundingKeys)
    assert.doesNotMatch(grounding.classicalWitness || '', /["]/, '문헌 인용은 JSON/Markdown 보고서용 ASCII quoting을 사용하지 않음')
  }

  // 1. Classical textual references
  assert.equal(groundingsByKey['timing.daYun.direction'].evidenceType, 'primary_textual_witness')
  assert.equal(groundingsByKey['timing.daYun.direction'].authorityScope, 'classical_textual_reference_unverified')
  assert.match(groundingsByKey['timing.daYun.direction'].classicalWitness, /삼명통회.*陽男陰女順行/)

  assert.equal(groundingsByKey['timing.daYun.startAge.conversionRate'].evidenceType, 'primary_textual_witness')
  assert.equal(groundingsByKey['timing.daYun.startAge.conversionRate'].authorityScope, 'classical_textual_reference_unverified')
  assert.match(groundingsByKey['timing.daYun.startAge.conversionRate'].classicalWitness, /三日為一歲/)

  assert.equal(groundingsByKey['pillars.month.fiveTigers'].evidenceType, 'primary_textual_witness')
  assert.match(groundingsByKey['pillars.month.fiveTigers'].classicalWitness, /五虎遁/)

  assert.equal(groundingsByKey['pillars.hour.fiveRats'].evidenceType, 'primary_textual_witness')
  assert.match(groundingsByKey['pillars.hour.fiveRats'].classicalWitness, /五鼠遁/)

  // 2. Modern Astronomical Methods
  assert.equal(groundingsByKey['pillars.year.solarBoundary'].evidenceType, 'modern_astronomical_method')
  assert.match(groundingsByKey['pillars.year.solarBoundary'].modernPolicy, /Meeus.*315°/)

  assert.equal(groundingsByKey['solarTime.apparentSolarTime'].evidenceType, 'modern_astronomical_method')
  assert.match(groundingsByKey['solarTime.apparentSolarTime'].modernPolicy, /선택된 행정구역 대표경도에 4분\/도 보정 \+ NOAA 균시차 EoT/)
  assert.doesNotMatch(groundingsByKey['solarTime.apparentSolarTime'].modernPolicy, /서울|126\.97°E|-32\.12분/)

  // 3. Implementation Policies
  assert.equal(groundingsByKey['timing.daYun.firstStartDate.calendarMapping'].evidenceType, 'implementation_policy')
  assert.match(groundingsByKey['timing.daYun.firstStartDate.calendarMapping'].modernPolicy, /source-ratio-rounded-360-30-calendar/)

  assert.equal(groundingsByKey['solarTerms.uncertaintyWindow'].evidenceType, 'implementation_policy')
  assert.match(groundingsByKey['solarTerms.uncertaintyWindow'].modernPolicy, /SOLAR_TERM_UNCERTAINTY_MINUTES = 20/)

  // 4. Conflicting Lineages
  assert.equal(groundingsByKey['pillars.day.boundary'].evidenceType, 'conflicting_lineage')
  assert.match(groundingsByKey['pillars.day.boundary'].classicalWitness, /신당서.*子半.*서로 다른 선택/)
  assert.match(groundingsByKey['pillars.day.boundary'].modernPolicy, /solar-midnight-split-zi/)

  // 4. UNKNOWN verification
  assert.equal(sajuFoundation.unknown.personalValidity, 'not_established')
  assert.equal(sajuFoundation.unknown.isPsychometrics, false)
  assert.equal(sajuFoundation.unknown.mustNotAssume, undefined, 'mustNotAssume behavioral directives must be removed')
})

test('Ziwei Real Fixture: extracts normalized INPUT, FACT, SOURCE, UNKNOWN, enforces fixed ruleset and supportScope boundaries with zero synthesis', () => {
  const prepared = prepareThreeSystemInterpretationData(REAL_BIRTH_INPUT)
  const ziweiFoundation = extractZiweiFoundation(prepared.systems.ziwei)

  // Basic Contract
  assert.equal(ziweiFoundation.domain, 'ziwei')
  assert.equal(ziweiFoundation.isInactiveResearch, false)
  assert.equal(ziweiFoundation.activation.isActivated, true)
  assert.equal(ziweiFoundation.activation.status, 'experimental')
  assert.equal(ziweiFoundation.verificationStatus, 'needs_external_verification')

  // Purity Assertion: SYNTHESIS must be completely absent
  assert.equal(ziweiFoundation.synthesis, undefined, 'SYNTHESIS must not be present in canonical deterministic base')

  // 1. INPUT verification
  assert.equal(ziweiFoundation.input.lunarBasis.lunarYear, 1997)
  assert.equal(ziweiFoundation.input.lunarBasis.lunarMonth, 3)
  assert.equal(ziweiFoundation.input.lunarBasis.lunarDay, 15)
  assert.equal(ziweiFoundation.input.stemsBranches.birthYearStem, '丁')
  assert.equal(ziweiFoundation.input.stemsBranches.hourBranch, '未')

  // 2. FACT verification
  assert.ok(ziweiFoundation.fact.mingShenGong.mingGongBranch, '명궁 지지 존재')
  assert.ok(ziweiFoundation.fact.mingShenGong.shenGongBranch, '신궁 지지 존재')
  assert.ok(ziweiFoundation.fact.bureau.name, '오행국 존재')
  assert.equal(ziweiFoundation.fact.majorStars.length, 14, '14주성 모두 포국')
  assert.equal(ziweiFoundation.fact.transformations.length, 4, '4대 사화 모두 산출')
  assert.ok(ziweiFoundation.fact.palaces.length >= 12, '12궁 구조 완비')

  // 3. SOURCE verification
  assert.match(ziweiFoundation.source.ruleSetProfile, /ziwei-fixed-ruleset/)
  assert.match(ziweiFoundation.source.sourceDerivation, /사주 계산 결과의 연간·연지·시지/)

  // 4. UNKNOWN verification
  assert.equal(ziweiFoundation.unknown.supportScope.timingStatus, 'unsupported')
  assert.equal(ziweiFoundation.unknown.supportScope.brightnessStatus, 'unsupported')
  assert.equal(ziweiFoundation.unknown.supportScope.extendedMinorStarsStatus, 'unsupported')
  assert.equal(ziweiFoundation.unknown.mustNotAssume, undefined, 'mustNotAssume behavioral directives must be removed')
})

test('Astrology Real Fixture: strictly flags inactive research artifact, preserves activation:blocked, and extracts offline facts without running astronomical kernel or synthesis', async () => {
  const packetRaw = JSON.parse(await readFile(ASTRO_PACKET_PATH, 'utf8'))
  const groundingRaw = JSON.parse(await readFile(ASTRO_GROUNDING_PATH, 'utf8'))

  const combinedFixture = {
    ...packetRaw,
    bundle: groundingRaw.bundle,
  }

  const astroFoundation = extractAstrologyFoundation(combinedFixture)

  // Inactive Research Result & Activation Boundary (STRICT REQUIREMENT)
  assert.equal(astroFoundation.domain, 'astrology')
  assert.equal(astroFoundation.isInactiveResearch, true, '반드시 비활성 연구결과로 표기되어야 함')
  assert.equal(astroFoundation.activation.isActivated, false, '프로덕션 Chat 활성화 불가')
  assert.equal(astroFoundation.activation.status, 'blocked')
  assert.equal(astroFoundation.activation.serviceEligibility, 'blocked')
  assert.equal(astroFoundation.activation.usable, false)
  assert.equal(astroFoundation.activation.reason, 'interpretation_packet_not_activated')
  assert.match(astroFoundation.researchNotice, /softie_project 내부 interpretation service\/runtime integration이 아직 연결되지 않았다는 뜻/)
  assert.match(astroFoundation.researchNotice, /일반 ChatGPT\/Gemini downstream 대화 자체를 금지하지 않습니다/)
  assert.deepEqual(astroFoundation.unknown.interpretationBoundary, {
    availableForInterpretation: false,
    scope: 'softie_project_internal_interpretation_service_runtime_integration',
    meaning: 'internal_service_runtime_not_connected',
    generalChatDownstream: 'not_prohibited',
    userRequestedInterpretation: 'allowed_with_fact_interpretation_boundary',
  })

  // Purity Assertion: SYNTHESIS must be completely absent
  assert.equal(astroFoundation.synthesis, undefined, 'SYNTHESIS must not be present in canonical deterministic base')

  // 1. INPUT verification
  assert.equal(astroFoundation.input.coordinateSystem, 'geocentric_ecliptic_j2000')
  assert.equal(astroFoundation.input.ephemerisProvider, 'JPL DE405 SPK')

  // 2. FACT (offline research verified evidence extracted without ephemeris execution)
  assert.equal(astroFoundation.fact.hasVerifiedData, true)
  assert.equal(astroFoundation.fact.verifiedBodies.length, 10, '검증된 10개 천체 보존')

  const sun = astroFoundation.fact.verifiedBodies.find((b) => b.id === 'sun')
  assert.ok(sun)
  assert.ok(Math.abs(sun.longitudeDegrees - 280.378) < 0.01, 'Sun longitude 280.38° (Capricorn) preserved exactly')
  assert.equal(sun.sign, 'capricorn')
  assert.equal(sun.signIndex, 9)
  assert.ok(Math.abs(sun.degreeInSign - 10.3785821768816) < 1e-9)
  assert.equal(sun.motionState, 'direct')

  const moon = astroFoundation.fact.verifiedBodies.find((b) => b.id === 'moon')
  assert.ok(moon)
  assert.ok(Math.abs(moon.longitudeDegrees - 223.327) < 0.01, 'Moon longitude 223.33° (Scorpio) preserved exactly')
  assert.equal(moon.sign, 'scorpio')
  assert.equal(moon.signIndex, 7)
  assert.ok(Math.abs(moon.degreeInSign - 13.327) < 0.01)

  assert.ok(astroFoundation.fact.angles?.ascendant, 'Ascendant angle preserved')
  assert.equal(astroFoundation.fact.angles.ascendant.sign, 'aries')
  assert.ok(Math.abs(astroFoundation.fact.angles.ascendant.degreeInSign - 11.377) < 0.01)

  assert.equal(astroFoundation.fact.aspects.length, 18, '18개 aspect 보존')
  const sunMoonAspect = astroFoundation.fact.aspects.find((aspect) => aspect.id === 'sun__moon__sextile')
  assert.ok(sunMoonAspect)
  assert.ok(Math.abs(sunMoonAspect.calculationPrimitive.angularDistanceDegrees - 57.05072569815809) < 1e-9)
  assert.equal(sunMoonAspect.derivedClassification.aspectId, 'sextile')
  assert.equal(sunMoonAspect.derivedClassification.exactAngleDegrees, 60)
  assert.ok(Math.abs(sunMoonAspect.derivedClassification.orbDegrees - 2.9492743018419105) < 1e-9)
  assert.equal(sunMoonAspect.derivedClassification.ruleId, 'major_aspect_v0')
  assert.equal(sunMoonAspect.derivedClassification.ruleSetVersion, 'mallang-astrology-rule-core-v0')
  assert.ok(sunMoonAspect.sourceRefs.includes('rawChart.bodies.sun.longitudeDegrees'))
  assert.ok(sunMoonAspect.sourceRefs.includes('rawChart.bodies.moon.longitudeDegrees'))
  assert.ok(sunMoonAspect.sourceRefs.includes('ruleChart.aspects.sun.moon'))
  assert.equal(Object.hasOwn(sunMoonAspect.derivedClassification, 'phase'), false)

  assert.equal(astroFoundation.fact.wholeSignHouses.derivedClassification.houseSystem, 'whole_sign')
  assert.equal(astroFoundation.fact.wholeSignHouses.calculationPrimitive.placements.length, 10)
  assert.equal(astroFoundation.fact.wholeSignHouses.derivedClassification.ruleId, 'whole_sign_house_v0')
  assert.equal(astroFoundation.fact.distribution.calculationPrimitive.overall.counts.elements.fire, 3)
  assert.equal(astroFoundation.fact.distribution.derivedClassification.tie.overall.elements, true)
  assert.equal(Object.hasOwn(astroFoundation.fact.distribution.derivedClassification, 'leaders'), false)
  assert.equal(astroFoundation.fact.chartRulers.calculationPrimitive.ascendantSignId, 'aries')
  assert.equal(astroFoundation.fact.chartRulers.derivedClassification.traditionalChartRuler, 'mars')
  assert.equal(astroFoundation.fact.chartRulers.derivedClassification.modernChartRuler, 'mars')

  // 3. SOURCE
  assert.match(astroFoundation.source.ephemerisKernel, /JPL DE405 SPK/)
  assert.equal(astroFoundation.source.protocolVersion, 'de405-canonical-v2-protocol-v1')
  assert.equal(astroFoundation.source.ruleCoreVersion, 'mallang-astrology-rule-core-v0')
  assert.ok(astroFoundation.source.provenanceLinks.providerBundleSha256)
  assert.ok(astroFoundation.source.provenanceLinks.packetContentSha256)
  assert.ok(astroFoundation.source.provenanceLinks.adapterSha256)
  assert.ok(astroFoundation.source.provenanceLinks.readinessSha256)
  assert.ok(astroFoundation.source.provenanceLinks.kernelSha256)
  assert.ok(astroFoundation.source.provenanceLinks.runnerIdentity)
  assert.equal(astroFoundation.source.provenanceLinks.evaluator, 'de405-canonical-v2')
  assert.equal(astroFoundation.source.provenanceStatus, 'complete')
  assert.deepEqual(astroFoundation.source.provenanceMissing, [])
  assert.ok(astroFoundation.source.provenance.claimSourceRefs.length >= 50)

  // 4. UNKNOWN
  assert.equal(astroFoundation.unknown.activationStatus, 'blocked')
  assert.equal(astroFoundation.unknown.serviceEligibility, 'blocked')
  assert.equal(astroFoundation.unknown.systemBoundaries.livedExperience, 'not_supplied')
  assert.equal(astroFoundation.unknown.systemBoundaries.consumerDelivery, 'blocked')
  assert.deepEqual(astroFoundation.unknown.unsupportedFeatures.map((feature) => feature.feature), ['legacy_simulation_placidus_date_seed'])
  assert.deepEqual(astroFoundation.unknown.blockedFeatures.map((feature) => feature.feature), ['interpretation_service_activation'])
  assert.equal(astroFoundation.unknown.mustNotAssume, undefined, 'mustNotAssume behavioral directives must be removed')
})

test('Astrology Base fails closed when provenance or parent-side deterministic checks are incomplete', async () => {
  const packetRaw = JSON.parse(await readFile(ASTRO_PACKET_PATH, 'utf8'))
  const groundingRaw = JSON.parse(await readFile(ASTRO_GROUNDING_PATH, 'utf8'))
  const cases = [
    ['missing adapter identity', (fixture) => { delete fixture.packet.identities.adapterSha256 }],
    ['aspect separation mismatch', (fixture) => { fixture.packet.majorAspects[0].value.angularDistanceDegrees += 1 }],
    ['aspect claim source ref missing', (fixture) => { fixture.packet.majorAspects[0].sourceRefs = [] }],
    ['invalid blocked feature status', (fixture) => { fixture.packet.blockedFeatures[0].status = 'unsupported' }],
  ]

  for (const [label, mutate] of cases) {
    const fixture = structuredClone({ ...packetRaw, bundle: groundingRaw.bundle })
    mutate(fixture)
    const foundation = extractAstrologyFoundation(fixture)
    assert.equal(foundation.fact.hasVerifiedData, false, label)
    assert.deepEqual(foundation.fact.verifiedBodies, [], label)
    assert.deepEqual(foundation.fact.aspects, [], label)
    assert.equal(foundation.source.provenanceStatus, 'incomplete', label)
    assert.ok(foundation.source.provenanceMissing.length > 0, label)
    assert.equal(foundation.activation.status, 'blocked', label)
    assert.equal(foundation.activation.serviceEligibility, 'blocked', label)
    if (label === 'invalid blocked feature status') {
      assert.deepEqual(foundation.unknown.unsupportedFeatures, [], label)
    }
    assert.deepEqual(foundation.unknown.blockedFeatures, [{
      feature: 'interpretation_service_activation',
      status: 'blocked',
      reason: 'interpretation_packet_not_activated',
      sourceRefs: ['activation'],
    }], label)
  }

  const nearMismatch = structuredClone({ ...packetRaw, bundle: groundingRaw.bundle })
  nearMismatch.packet.majorAspects[0].value.angularDistanceDegrees += 5e-10
  const normalized = extractAstrologyFoundation(nearMismatch)
  assert.equal(normalized.fact.hasVerifiedData, true)
  assert.equal(normalized.fact.aspects[0].calculationPrimitive.angularDistanceDegrees, 57.05072569815809)

  const groundingOnly = extractAstrologyFoundation({ bundle: groundingRaw.bundle })
  assert.equal(groundingOnly.fact.hasVerifiedData, false)
  assert.equal(groundingOnly.source.provenanceStatus, 'missing')
  assert.equal(groundingOnly.activation.status, 'blocked')
  assert.deepEqual(groundingOnly.unknown.blockedFeatures, [{
    feature: 'interpretation_service_activation',
    status: 'blocked',
    reason: 'interpretation_packet_not_activated',
    sourceRefs: ['activation'],
  }])
})

test('Astrology packet absent, incomplete, and complete states keep blocked feature and JSON/Markdown semantic parity', async () => {
  const packetRaw = JSON.parse(await readFile(ASTRO_PACKET_PATH, 'utf8'))
  const groundingRaw = JSON.parse(await readFile(ASTRO_GROUNDING_PATH, 'utf8'))
  const incompleteArtifact = structuredClone({ ...packetRaw, bundle: groundingRaw.bundle })
  delete incompleteArtifact.packet.identities.adapterSha256
  const cases = [
    ['absent', {}],
    ['incomplete', incompleteArtifact],
    ['complete', { ...packetRaw, bundle: groundingRaw.bundle }],
  ]

  for (const [label, artifact] of cases) {
    const expectedProvenanceStatus = label === 'absent' ? 'missing' : label
    const base = buildDeterministicBase({
      domain: 'astrology',
      subjectName: `packet-${label}`,
      data: artifact,
    })
    const canonical = JSON.parse(exportDeterministicBaseJson(base))
    const validation = JSON.parse(exportDeterministicBaseValidationJson(base))
    const astrology = validation.systems.astrology

    assert.equal(astrology.source.provenanceStatus, expectedProvenanceStatus, label)
    assert.deepEqual(astrology.unknown.blockedFeatures, [{
      feature: 'interpretation_service_activation',
      status: 'blocked',
      reason: 'interpretation_packet_not_activated',
      sourceRefs: ['activation'],
    }], label)
    if (label === 'complete') {
      assert.equal(canonical.systems.astrology.domain, 'astrology', label)
      assert.equal(canonical.systems.astrology.fact.aspects.length, 18, label)
    } else {
      assert.equal(Object.hasOwn(canonical.systems, 'astrology'), false, label)
    }
    assert.equal(formatDeterministicBaseMarkdown(canonical), base.markdown, label)
    assert.doesNotMatch(base.markdown, /undefined|null/, label)
    assert.doesNotMatch(base.markdown, /STATUS & SUPPORT SCOPE|blockedFeatures|unsupportedFeatures|availableForInterpretation|provenance|sourceRefs|SHA|runner|evaluator/i, label)
    assert.doesNotMatch(JSON.stringify(canonical), /activation|serviceEligibility|verificationStatus|unsupportedFeatures|blockedFeatures|sourceRefs|provenance|personalValidity/i, label)
  }
})

test('buildDeterministicBase: bundles all three real domains into a single self-contained JSON/Markdown deterministic base', async () => {
  const prepared = prepareThreeSystemInterpretationData(REAL_BIRTH_INPUT)
  const packetRaw = JSON.parse(await readFile(ASTRO_PACKET_PATH, 'utf8'))
  const groundingRaw = JSON.parse(await readFile(ASTRO_GROUNDING_PATH, 'utf8'))

  const base = buildDeterministicBase({
    subjectName: '한규',
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
    astrologyArtifact: {
      ...packetRaw,
      bundle: groundingRaw.bundle,
    },
  })

  // Schema & Root Contract
  assert.equal(base.schemaVersion, CANONICAL_SCHEMA_VERSION)
  assert.equal(base.foundationVersion, FOUNDATION_VERSION)
  assert.equal(base.normalizedInput.subjectName, '한규')
  assert.equal(base.normalizedInput.birthDate, '1997-04-21')
  assert.equal(base.normalizedInput.targetDate, '2026-07-26')
  assert.equal(base.normalizedInput.placeName, '대한민국 서울')
  assert.equal(base.normalizedInput.referenceCity, 'seoul')
  assert.equal(base.normalizedInput.gender, 'male')
  assert.equal(base.summary.purityStatus, 'deterministic_pure_base')
  assert.equal(base.summary.synthesisIncluded, false)

  assert.deepEqual(Object.keys(base.systems).sort(), ['astrology', 'saju', 'ziwei'])

  // Check each domain's existence & clear separation
  assert.equal(base.systems.saju.isInactiveResearch, false)
  assert.equal(base.systems.ziwei.isInactiveResearch, false)
  assert.equal(base.systems.astrology.isInactiveResearch, true)

  // User-facing JSON serialization contains only INPUT, verified FACT, and a
  // minimal consumer boundary. Internal validation metadata is exported
  // separately for runtime/regression checks.
  const jsonStr = exportDeterministicBaseJson(base)
  assert.ok(jsonStr.length > 500)
  const parsed = JSON.parse(jsonStr)
  const validation = JSON.parse(exportDeterministicBaseValidationJson(base))
  assert.equal(parsed.schemaVersion, CANONICAL_SCHEMA_VERSION)
  assert.equal(parsed.normalizedInput.subjectName, '한규')
  assert.deepEqual(Object.keys(parsed.systems).sort(), ['astrology', 'saju', 'ziwei'])
  assert.deepEqual(parsed.systems.ziwei.fact.majorStarCoordinates.map((star) => star.id), [
    'tianji', 'taiyang', 'wugu', 'tiandong', 'lianzhen',
  ])
  assert.deepEqual(parsed.systems.ziwei.fact.luckyStarCoordinates.map((star) => star.id), [
    'zuobo', 'youbi', 'wenchang', 'wengu', 'tiankui', 'tianyue',
  ])
  for (const star of [
    ...parsed.systems.ziwei.fact.majorStarCoordinates,
    ...parsed.systems.ziwei.fact.luckyStarCoordinates,
  ]) {
    assert.ok(star.name)
    assert.match(star.branchCoordinate, /^[子丑寅卯辰巳午未申酉戌亥]$/)
    assert.equal(Object.hasOwn(star, 'palaceBranch'), false)
    assert.equal(Object.hasOwn(star, 'palaceName'), false)
    assert.equal(Object.hasOwn(star, 'palaceId'), false)
  }
  assert.equal(Object.hasOwn(parsed.systems.ziwei.fact, 'lunarBasis'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei.fact, 'mingShenGong'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei.fact, 'bureau'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei.fact, 'transformations'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei.fact, 'palaces'), false)
  assert.deepEqual(parsed.consumerBoundary, {
    factScope: 'verified_claims_only',
    omittedClaims: 'not_provided_as_facts',
    interpretation: 'separate_fact_from_interpretation_and_confirm_personal_context',
  })
  assert.equal(Object.hasOwn(parsed, 'summary'), false)
  assert.equal(Object.hasOwn(parsed, 'generatedAt'), false)
  assert.equal(Object.hasOwn(parsed, 'markdown'), false)
  assert.equal(Object.hasOwn(parsed, 'formattedMarkdown'), false)
  assert.equal(Object.hasOwn(parsed.normalizedInput, 'coordinateMethod'), false)
  assert.equal(Object.hasOwn(parsed.normalizedInput, 'coordinateProvenance'), false)
  assert.equal(base.formattedMarkdown, base.markdown)

  // Check markdown output contains calculation basis and only verified FACT blocks.
  const md = base.markdown
  assert.match(md, /# DETERMINISTIC BASE · 한규/)
  assert.match(md, /## AI CONSUMER GUIDE \(사람·AI 공용 읽기 안내\)/)
  assert.match(md, /READ_ORDER.*`0\.INPUT`.*`1\.FACT`/)
  assert.match(md, /CONSUME.*사용자 질문.*관련 FACT 확인.*FACT와 해석 분리.*필요한 개인 맥락은 대화에서 확인/)
  assert.match(md, /FACT.*이 Base에 포함된 FACT를 우선 사용하고.*추정·재계산하여 확정 FACT로 취급하지 않음/)
  assert.match(md, /BOUNDARY.*FACT와 해석.*개인 경험.*의미.*권위/)
  assert.match(md, /## 0\. 입력/)
  assert.match(md, /## \[사주 \(Four Pillars\)\]/)
  assert.match(md, /## \[자미두수 \(Ziwei Dou Shu\)\]/)
  assert.match(md, /## \[서양 점성학 \(Western Astrology\)\]/)
  assert.match(md, /- 자미계 지지 좌표:/)
  assert.match(md, /천기\(卯\)/)
  assert.match(md, /- 보조성 지지 좌표:/)
  assert.doesNotMatch(md, /음력 기준|명궁|신궁|오행국|14주성|사화|궁\)|palace|palaceName|palaceId|palaceBranch/i)

  // Check the compact deterministic blocks present in markdown
  assert.match(md, /### 1\. FACT/)
  assert.doesNotMatch(md, /STATUS & SUPPORT SCOPE|TECHNICAL PROVENANCE|### 2\. SOURCE|Fact Provenance Groundings|sourceRefs|SHA|runner|evaluator|Rule identity|authorityScope|coordinate provenance|Provenance links|verified_offline_research|needs_external_verification|personalValidity|activation|serviceEligibility|unsupportedFeatures|blockedFeatures/)
  assert.doesNotMatch(md, /검증 FACT|계산 primitive|RuleSet-derived|exact=|orb=|houseSystem=|ASC sign=|overall.*\{/)
  assert.match(md, /- 각도 간격:/)
  assert.match(md, /- 주요 관계:/)
  assert.match(md, /- 하우스 체계: whole_sign/)
  assert.match(md, /- 분포 동률: 전체 elements 있음\(true\)/)
  assert.match(md, /- 차트 룰러: 전통 mars · 현대 mars/)
  assert.match(md, /- 천체 위치:/)
  assert.match(md, /sun: capricorn 10\.38° · 경도 280\.38°/)
  assert.match(md, /moon: scorpio 13\.33° · 경도 223\.33°/)
  assert.match(md, /sun\/moon: 57\.050726°/)
  assert.match(md, /sun\/moon: sextile · 기준 각도 60° · 편차 2\.949274° \(허용 5°\)/)
  assert.match(md, /- 하우스 배치: 상승점 aries \(번호 0\).*sun=10하우스 \(10H\)/)
  assert.match(md, /- 분포 수 \(전체\): 대상 sun, moon, mercury/)
  assert.match(md, /- 차트 룰러 기준: 상승점 aries/)
  assert.doesNotMatch(md, /rule=major_aspect_v0|rule=whole_sign_house_v0|rule=distribution_from_body_signs_v0|rule=chart_ruler_from_ascendant_v0/)
  assert.match(md, /\| 기준일 \| 2026-07-26 \|/)
  assert.match(md, /\| 선택 행정구역\/기준 ID \| 대한민국 서울 \/ seoul \|/)
  assert.match(md, /\| 성별 \| male \|/)
  assert.match(md, /- 일간 기준: 계 · 음 · 수/)
  assert.match(md, /- 위치별 십성: 연주 천간/)
  assert.match(md, /- 지장간 \(위치별\): 연주 축:/)
  assert.match(md, /지지 관계: 파\(진축\), 충\(미축\), 형\(미축\)/)
  assert.match(md, /대운\/세운: 대운 신축 · 방향 역행 · 기산 5년 5개월 29일 · 첫 시작일 2002-10-20 \/ 세운 병오/)
  assert.match(md, /월운 을미/)
  assert.match(md, /일진 신축/)
  assert.doesNotMatch(md, /소비자 직접 전달이 엄격히 차단/)
  assert.doesNotMatch(md, /phase=|dominance=|meaning=/)
  assert.doesNotMatch(md, /undefined|null/)
  assert.doesNotMatch(md, /프로파일링|gyeokguk|yongShin|strength|shinsal/)

  // Public JSON must be consumable as the same user-facing base. Internal
  // validation JSON must retain source/unknown/activation metadata.
  assert.doesNotMatch(jsonStr, /による/)
  assert.doesNotMatch(jsonStr, /authority_supported_classical_text|classical_systematic_authority/)
  assert.doesNotMatch(jsonStr, /AI CONSUMER GUIDE|READ_ORDER|RESPONSE_BOUNDARY/)
  assert.doesNotMatch(md, /による/)
  assert.doesNotMatch(md, /authority_supported_classical_text|classical_systematic_authority/)
  assert.deepEqual(validation.systems.saju.source.factGroundings, base.systems.saju.source.factGroundings)
  assert.deepEqual(validation.systems.astrology.source.provenance, base.systems.astrology.source.provenance)
  assert.deepEqual(validation.systems.astrology.unknown.blockedFeatures, base.systems.astrology.unknown.blockedFeatures)
  assert.deepEqual(validation.systems.astrology.unknown.unsupportedFeatures, base.systems.astrology.unknown.unsupportedFeatures)
  assert.equal(Object.hasOwn(parsed.systems.saju, 'source'), false)
  assert.equal(Object.hasOwn(parsed.systems.saju, 'unknown'), false)
  assert.equal(Object.hasOwn(parsed.systems.saju, 'activation'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology, 'source'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology, 'unknown'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology, 'activation'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei, 'source'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei, 'unknown'), false)
  assert.equal(Object.hasOwn(parsed.systems.ziwei, 'activation'), false)
  assert.equal(formatDeterministicBaseMarkdown(parsed), md)
  assert.equal(parsed.systems.astrology.fact.verifiedBodies.length, 10)
  const parsedSun = parsed.systems.astrology.fact.verifiedBodies.find((body) => body.id === 'sun')
  assert.equal(parsedSun.sign, 'capricorn')
  assert.equal(parsedSun.signIndex, 9)
  assert.ok(Math.abs(parsedSun.degreeInSign - 10.3785821768816) < 1e-9)
  assert.deepEqual(parsed.systems.saju.fact.dayMasterDetails, { stem: '계', yinYang: '음', element: '수' })
  assert.equal(parsed.systems.saju.fact.pillarFacts.month.branchMainStem, '무')
  assert.deepEqual(parsed.systems.saju.fact.pillarFacts.year.hiddenStems, [
    { stem: '기', weight: 0.6, tenGod: '편관' },
    { stem: '계', weight: 0.3, tenGod: '비견' },
    { stem: '신', weight: 0.1, tenGod: '편인' },
  ])
  assert.equal(parsed.systems.astrology.fact.aspects.length, 18)
  assert.deepEqual(parsed.systems.astrology.fact.aspects[0].calculationPrimitive, {
    angularDistanceDegrees: 57.05072569815809,
  })
  assert.deepEqual(parsed.systems.astrology.fact.aspects[0].derivedClassification, {
    aspectId: 'sextile',
    exactAngleDegrees: 60,
    orbDegrees: 2.9492743018419105,
    maxOrbDegrees: 5,
  })
  assert.equal(Object.hasOwn(parsed.systems.astrology.fact.aspects[0].derivedClassification, 'ruleId'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology.fact.wholeSignHouses.derivedClassification, 'ruleId'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology.fact.distribution.derivedClassification, 'ruleId'), false)
  assert.equal(Object.hasOwn(parsed.systems.astrology.fact.chartRulers.derivedClassification, 'ruleId'), false)
  assert.deepEqual(findForbiddenKeyPaths(parsed), [])
  assert.doesNotMatch(jsonStr, /\bundefined\b/)
  assert.equal(new Set(validation.systems.saju.unknown.warnings).size, validation.systems.saju.unknown.warnings.length)
  for (const relation of validation.systems.saju.fact.branchRelations) {
    assert.match(md, new RegExp(`${relation.name}\\(${relation.branches.join('')}\\)`))
  }
  const activeDaYun = parsed.systems.saju.fact.timing.daYun.cycles.find((cycle) => cycle.isActive)
  assert.match(md, new RegExp(`대운 ${activeDaYun.value}`))
  assert.match(md, new RegExp(`세운 ${parsed.systems.saju.fact.timing.seUn.value}`))
  assert.match(md, new RegExp(`기산 ${validation.systems.saju.fact.timing.daYun.startAge.years}년 ${validation.systems.saju.fact.timing.daYun.startAge.months}개월 ${validation.systems.saju.fact.timing.daYun.startAge.days}일`))

  const exportDirectory = await mkdtemp(join(tmpdir(), 'deterministic-base-export-'))
  try {
    const jsonPath = join(exportDirectory, 'deterministic_base.json')
    const markdownPath = join(exportDirectory, 'deterministic_base.md')
    await writeFile(jsonPath, jsonStr, 'utf8')
    await writeFile(markdownPath, md, 'utf8')

    const consumedJson = JSON.parse(await readFile(jsonPath, 'utf8'))
    const consumedMarkdown = await readFile(markdownPath, 'utf8')
    assert.equal(Object.hasOwn(consumedJson, 'markdown'), false)
    assert.equal(Object.hasOwn(consumedJson, 'formattedMarkdown'), false)
    assert.equal(Object.hasOwn(consumedJson.systems.saju, 'source'), false)
    assert.equal(Object.hasOwn(consumedJson.systems.astrology, 'unknown'), false)
    assert.deepEqual(consumedJson.systems.ziwei.fact, parsed.systems.ziwei.fact)
    assert.deepEqual(consumedJson.systems.astrology.fact.aspects, parsed.systems.astrology.fact.aspects)
    assert.deepEqual(findForbiddenKeyPaths(consumedJson), [])
    assert.doesNotMatch(await readFile(jsonPath, 'utf8'), /\bundefined\b/)
    assert.doesNotMatch(consumedMarkdown, /undefined|null/)
    assert.match(consumedMarkdown, /## AI CONSUMER GUIDE \(사람·AI 공용 읽기 안내\)/)
    assert.match(consumedMarkdown, /READ_ORDER.*`0\.INPUT`.*`1\.FACT`/)
    assert.doesNotMatch(consumedMarkdown, /STATUS & SUPPORT SCOPE|TECHNICAL PROVENANCE|### 2\. SOURCE|sourceRefs|SHA|runner|evaluator|Rule identity|Provenance links|activation|unsupported|provenance/i)
    assert.equal(formatDeterministicBaseMarkdown(consumedJson), consumedMarkdown)
    const freshAttachmentPrompt = createFreshChatContinuationPrompt(consumedJson, '이 astrology FACT를 바탕으로 해석해줘.')
    assert.match(freshAttachmentPrompt, /\[ATTACHED FILE: deterministic_base\.md\]/)
    assert.match(freshAttachmentPrompt, /## AI CONSUMER GUIDE \(사람·AI 공용 읽기 안내\)/)
    assert.match(freshAttachmentPrompt, /첨부 파일은 INPUT과 이 Base에 포함된 FACT를 제공하며, 포함되지 않은 값은 추정·재계산하여 확정 FACT로 취급하지 않는다/)
    assert.match(freshAttachmentPrompt, /FACT와 해석을 구분해 밝히고 필요한 개인 맥락은 대화에서 확인한다/)
    assert.doesNotMatch(freshAttachmentPrompt, /availableForInterpretation|service\/runtime|provenance|blocked|unsupported/i)
  } finally {
    await rm(exportDirectory, { recursive: true, force: true })
  }

  // Verify that SYNTHESIS, mustNotAssume, and preachy directives are completely absent
  assert.doesNotMatch(md, /SYNTHESIS/)
  assert.doesNotMatch(md, /mustNotAssume/)
  assert.doesNotMatch(md, /CHAT CONVERSATION SEEDS/)
  assert.doesNotMatch(md, /자연스러운 후속 대화 가이드/)
})

test('Fresh-chat continuation context & prompt: verifies zero recalculation, key context restoration, and attached file format', async () => {
  const prepared = prepareThreeSystemInterpretationData(REAL_BIRTH_INPUT)
  const packetRaw = JSON.parse(await readFile(ASTRO_PACKET_PATH, 'utf8'))
  const groundingRaw = JSON.parse(await readFile(ASTRO_GROUNDING_PATH, 'utf8'))

  const base = buildDeterministicBase({
    subjectName: '한규',
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
    astrologyArtifact: {
      ...packetRaw,
      bundle: groundingRaw.bundle,
    },
  })

  // Test extractContinuationContext without any recalculation
  const ctx = extractContinuationContext(base)
  assert.equal(ctx.subjectName, '한규')
  assert.deepEqual(ctx.domains, ['saju', 'ziwei', 'astrology'])
  assert.deepEqual(ctx.isInactiveResearchMap, {
    saju: false,
    ziwei: false,
    astrology: true,
  })
  assert.deepEqual(ctx.activationStatusMap, {
    saju: 'available',
    ziwei: 'experimental',
    astrology: 'blocked',
  })
  assert.equal(ctx.factsPresentMap.saju, true)
  assert.equal(ctx.factsPresentMap.ziwei, true)
  assert.equal(ctx.factsPresentMap.astrology, true)
  assert.equal(ctx.unknownsPresentMap.saju, true)
  assert.equal(ctx.unknownsPresentMap.ziwei, true)
  assert.equal(ctx.unknownsPresentMap.astrology, true)
  assert.equal(ctx.synthesisExcluded, true)

  // Only the bounded coordinate subset is public; excluded Ziwei claims and
  // internal runtime state are not presented as confirmed facts.
  assert.match(base.markdown, /자미두수 \(Ziwei Dou Shu\)/)
  assert.doesNotMatch(base.markdown, /음력 기준|명궁|신궁|오행국|14주성|사화|궁\)|timingStatus|unsupported|serviceEligibility|personalValidity|activation/i)
  assert.doesNotMatch(exportDeterministicBaseJson(base), /lunarBasis|mingShenGong|bureau|transformations|palaces|palaceName|palaceId|palaceBranch|timingStatus|unsupported|serviceEligibility|personalValidity|activation/i)

  // Verify fresh-chat continuation prompt encapsulates base as an attached file
  const prompt = createFreshChatContinuationPrompt(base, '나의 일간과 14주성 배치를 알려줘.')
  assert.match(prompt, /\[ATTACHED FILE: deterministic_base\.md\]/)
  assert.match(prompt, /\[END ATTACHED FILE\]/)
  assert.match(prompt, /\[USER\]: "나의 일간과 14주성 배치를 알려줘\."/)

  const interpretationPrompt = createFreshChatContinuationPrompt(base, '이 astrology FACT를 바탕으로 해석해줘.')
  assert.match(interpretationPrompt, /\[INTERPRETATION BOUNDARY\]/)
  assert.match(interpretationPrompt, /첨부 파일은 INPUT과 이 Base에 포함된 FACT를 제공하며, 포함되지 않은 값은 추정·재계산하여 확정 FACT로 취급하지 않는다/)
  assert.match(interpretationPrompt, /FACT와 해석을 구분해 밝히고 필요한 개인 맥락은 대화에서 확인한다/)
  assert.doesNotMatch(interpretationPrompt, /availableForInterpretation|service\/runtime|provenance|blocked|unsupported/i)
  assert.match(interpretationPrompt, /\[USER\]: "이 astrology FACT를 바탕으로 해석해줘\."/)
  assert.doesNotMatch(interpretationPrompt, /사용자 해석 요청.*금지|사용자 해석 요청.*차단/)
})

test('chatHandoffPackage backward compatibility: buildChatHandoffPackage seamlessly includes deterministic base without breaking legacy copies', () => {
  const prepared = prepareThreeSystemInterpretationData(REAL_BIRTH_INPUT)
  const pkg = buildChatHandoffPackage({
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
    userQuestion: '현재 흐름이 궁금해요.',
    topicCategory: 'timing',
  })

  // Legacy properties preserved
  assert.ok(pkg.copies.full)
  assert.ok(pkg.copies.quick)
  assert.ok(pkg.copies.topicFocused)
  assert.ok(pkg.copies.privacyMinimal)
  assert.equal(pkg.subjectName, '한규')
  assert.equal(pkg.topicCategory, 'timing')

  // Foundation attached
  assert.ok(pkg.foundation)
  assert.equal(pkg.foundation.schemaVersion, CANONICAL_SCHEMA_VERSION)
  assert.ok(pkg.foundation.systems.saju)
  assert.ok(pkg.foundation.systems.ziwei)
  assert.ok(pkg.foundation.systems.astrology)
  assert.equal(pkg.foundation.systems.astrology.isInactiveResearch, true)
})
