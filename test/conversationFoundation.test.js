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
  assert.match(groundingsByKey['solarTime.apparentSolarTime'].modernPolicy, /126\.97°E.*NOAA/)

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
  assert.equal(sun.motionState, 'direct')

  const moon = astroFoundation.fact.verifiedBodies.find((b) => b.id === 'moon')
  assert.ok(moon)
  assert.ok(Math.abs(moon.longitudeDegrees - 223.327) < 0.01, 'Moon longitude 223.33° (Scorpio) preserved exactly')

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
      assert.deepEqual(foundation.unknown.blockedFeatures, [], label)
    }
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

  // JSON serialization test (single-file export)
  const jsonStr = exportDeterministicBaseJson(base)
  assert.ok(jsonStr.length > 500)
  const parsed = JSON.parse(jsonStr)
  assert.equal(parsed.schemaVersion, CANONICAL_SCHEMA_VERSION)
  assert.equal(parsed.normalizedInput.subjectName, '한규')
  assert.equal(Object.hasOwn(parsed, 'markdown'), false)
  assert.equal(Object.hasOwn(parsed, 'formattedMarkdown'), false)
  assert.equal(base.formattedMarkdown, base.markdown)

  // Check markdown output contains calculation basis table and 3 blocks per domain
  const md = base.markdown
  assert.match(md, /# DETERMINISTIC BASE MANIFEST · 한규/)
  assert.match(md, /## 0\. 정규화된 계산 입력 \(Calculation Basis\)/)
  assert.match(md, /## \[사주 \(Four Pillars\)\]/)
  assert.match(md, /## \[자미두수 \(Ziwei Dou Shu\)\]/)
  assert.match(md, /## \[서양 점성학 \(Western Astrology\)\]/)

  // Check Inactive Research Alert in markdown
  assert.match(md, /비활성 연구 아티팩트 \(Inactive Research Artifact\)/)
  assert.match(md, /serviceEligibility: blocked/)

  // Check 3 deterministic blocks present in markdown
  assert.match(md, /### 1\. FACT \(결정론적 계산\/관측 사실\)/)
  assert.match(md, /### 2\. SOURCE \(문헌 전승·규칙 버전 및 출처 한계\)/)
  assert.match(md, /### 3\. STATUS & SUPPORT SCOPE \(지원 범위 및 상태\)/)

  // Verify Fact Provenance Groundings in markdown
  assert.match(md, /계산 사실별 근거 유형 및 권위 구분 \(Fact Provenance Groundings\)/)
  assert.match(md, /\[고전 문헌 참조 · primary_textual_witness\]/)
  assert.match(md, /\[현대 천문 계산법 · modern_astronomical_method\]/)
  assert.match(md, /\[현대 구현 정책 · implementation_policy\]/)
  assert.match(md, /\[학파 대립 미합의 정책 · conflicting_lineage\]/)
  assert.match(md, /「陽男陰女順行，陰男陽女逆行」/)
  assert.match(md, /현대 계산\/정책: source-ratio-rounded-360-30-calendar/)
  assert.match(md, /authorityScope: classical_textual_reference_unverified/)
  assert.match(md, /Aspect angular separation \(계산 primitive\)/)
  assert.match(md, /Aspect classification \(RuleSet-derived\)/)
  assert.match(md, /Whole Sign classification \(RuleSet-derived\)/)
  assert.match(md, /Distribution tie \(RuleSet-derived\)/)
  assert.match(md, /Chart ruler mapping \(RuleSet-derived\)/)
  assert.match(md, /Provenance status: complete/)
  assert.match(md, /unsupportedFeatures: legacy_simulation_placidus_date_seed/)
  assert.match(md, /blockedFeatures: interpretation_service_activation/)
  assert.match(md, /availableForInterpretation=false.*softie_project 내부 interpretation service\/runtime integration 미연결/)
  assert.match(md, /일반 ChatGPT\/Gemini downstream 대화: 금지하지 않음/)
  assert.match(md, /\| 기준일 \| 2026-07-26 \|/)
  assert.match(md, /\| 출생지\/기준 도시 \| 대한민국 서울 \/ seoul \|/)
  assert.match(md, /\| 성별 \| male \|/)
  assert.match(md, /지지 관계: 파\(진축\), 충\(미축\), 형\(미축\)/)
  assert.match(md, /대운\/세운: 대운 신축 · 방향 역행 · 기산 5년 5개월 29일 · 첫 시작일 2002-10-20 \/ 세운 병오/)
  assert.match(md, /월운 을미/)
  assert.match(md, /일진 신축/)
  assert.doesNotMatch(md, /소비자 직접 전달이 엄격히 차단/)
  assert.doesNotMatch(md, /phase=|dominance=|meaning=/)
  assert.doesNotMatch(md, /undefined|null/)
  assert.doesNotMatch(md, /프로파일링|gyeokguk|yongShin|strength|shinsal/)

  // Exported JSON must be consumable as the same deterministic base and must
  // regenerate the same Markdown report without losing provenance fields.
  assert.doesNotMatch(jsonStr, /による/)
  assert.doesNotMatch(jsonStr, /authority_supported_classical_text|classical_systematic_authority/)
  assert.doesNotMatch(md, /による/)
  assert.doesNotMatch(md, /authority_supported_classical_text|classical_systematic_authority/)
  assert.deepEqual(parsed.systems.saju.source.factGroundings, base.systems.saju.source.factGroundings)
  assert.equal(formatDeterministicBaseMarkdown(parsed), md)
  assert.deepEqual(parsed.systems.astrology.fact.aspects, base.systems.astrology.fact.aspects)
  assert.deepEqual(parsed.systems.astrology.fact.wholeSignHouses, base.systems.astrology.fact.wholeSignHouses)
  assert.deepEqual(parsed.systems.astrology.fact.distribution, base.systems.astrology.fact.distribution)
  assert.deepEqual(parsed.systems.astrology.fact.chartRulers, base.systems.astrology.fact.chartRulers)
  assert.deepEqual(parsed.systems.astrology.source.provenance, base.systems.astrology.source.provenance)
  assert.deepEqual(parsed.systems.astrology.unknown.unsupportedFeatures, base.systems.astrology.unknown.unsupportedFeatures)
  assert.deepEqual(parsed.systems.astrology.unknown.blockedFeatures, base.systems.astrology.unknown.blockedFeatures)
  assert.deepEqual(parsed.systems.astrology.unknown.interpretationBoundary, base.systems.astrology.unknown.interpretationBoundary)
  assert.deepEqual(findForbiddenKeyPaths(parsed), [])
  assert.doesNotMatch(jsonStr, /\bundefined\b/)
  assert.equal(new Set(parsed.systems.saju.unknown.warnings).size, parsed.systems.saju.unknown.warnings.length)
  for (const relation of parsed.systems.saju.fact.branchRelations) {
    assert.match(md, new RegExp(`${relation.name}\\(${relation.branches.join('')}\\)`))
  }
  const activeDaYun = parsed.systems.saju.fact.timing.daYun.cycles.find((cycle) => cycle.isActive)
  assert.match(md, new RegExp(`대운 ${activeDaYun.value}`))
  assert.match(md, new RegExp(`세운 ${parsed.systems.saju.fact.timing.seUn.value}`))
  assert.match(md, new RegExp(`기산 ${parsed.systems.saju.fact.timing.daYun.startAge.years}년 ${parsed.systems.saju.fact.timing.daYun.startAge.months}개월 ${parsed.systems.saju.fact.timing.daYun.startAge.days}일`))

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
    assert.deepEqual(consumedJson.systems.saju.source.factGroundings, base.systems.saju.source.factGroundings)
    assert.deepEqual(consumedJson.systems.astrology.fact.aspects, base.systems.astrology.fact.aspects)
    assert.deepEqual(consumedJson.systems.astrology.source.provenance, base.systems.astrology.source.provenance)
    assert.deepEqual(consumedJson.systems.astrology.unknown.blockedFeatures, base.systems.astrology.unknown.blockedFeatures)
    assert.deepEqual(consumedJson.systems.astrology.unknown.interpretationBoundary, base.systems.astrology.unknown.interpretationBoundary)
    assert.deepEqual(findForbiddenKeyPaths(consumedJson), [])
    assert.doesNotMatch(await readFile(jsonPath, 'utf8'), /\bundefined\b/)
    assert.doesNotMatch(consumedMarkdown, /undefined|null/)
    assert.equal(formatDeterministicBaseMarkdown(consumedJson), consumedMarkdown)
    const freshAttachmentPrompt = createFreshChatContinuationPrompt(consumedJson, '이 astrology FACT를 바탕으로 해석해줘.')
    assert.match(freshAttachmentPrompt, /\[ATTACHED FILE: deterministic_base\.md\]/)
    assert.match(freshAttachmentPrompt, /availableForInterpretation=false는 softie_project 내부 interpretation service\/runtime integration 미연결/)
    assert.match(freshAttachmentPrompt, /일반 ChatGPT\/Gemini downstream 대화를 금지하지 않는다/)
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

  // Verify false promotion prevention in markdown:
  // 1. Ziwei timing must remain unsupported
  assert.match(base.markdown, /timingStatus: unsupported|시기\(unsupported\)/)
  // 2. Astrology must remain blocked
  assert.match(base.markdown, /serviceEligibility: blocked/)
  // 3. Saju literature must remain personalValidity=not_established
  assert.match(base.markdown, /personalValidity=not_established/)

  // Verify fresh-chat continuation prompt encapsulates base as an attached file
  const prompt = createFreshChatContinuationPrompt(base, '나의 일간과 14주성 배치를 알려줘.')
  assert.match(prompt, /\[ATTACHED FILE: deterministic_base\.md\]/)
  assert.match(prompt, /\[END ATTACHED FILE\]/)
  assert.match(prompt, /\[USER\]: "나의 일간과 14주성 배치를 알려줘\."/)

  const interpretationPrompt = createFreshChatContinuationPrompt(base, '이 astrology FACT를 바탕으로 해석해줘.')
  assert.match(interpretationPrompt, /\[INTERPRETATION BOUNDARY\]/)
  assert.match(interpretationPrompt, /일반 ChatGPT\/Gemini downstream 대화를 금지하지 않는다/)
  assert.match(interpretationPrompt, /계산 FACT\/provenance와 해석을 구분해 먼저 밝힌 뒤 대화를 이어간다/)
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
