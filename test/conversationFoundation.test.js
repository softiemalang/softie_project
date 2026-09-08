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
  assert.equal(sajuFoundation.unknown.experimentalProfiling.status, 'experimental')
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
  assert.match(astroFoundation.researchNotice, /오프라인에서 검증된 불변 연구 증적/)

  // Purity Assertion: SYNTHESIS must be completely absent
  assert.equal(astroFoundation.synthesis, undefined, 'SYNTHESIS must not be present in canonical deterministic base')

  // 1. INPUT verification
  assert.equal(astroFoundation.input.coordinateSystem, 'geocentric_ecliptic_j2000')
  assert.equal(astroFoundation.input.ephemerisProvider, 'JPL DE405 SPK')

  // 2. FACT (offline research verified evidence extracted without ephemeris execution)
  assert.equal(astroFoundation.fact.hasVerifiedData, true)
  assert.ok(astroFoundation.fact.verifiedBodies.length >= 2, '태양과 달 등 관측 천체 보존')

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

  // 3. SOURCE
  assert.match(astroFoundation.source.ephemerisKernel, /JPL DE405 SPK/)
  assert.equal(astroFoundation.source.protocolVersion, 'de405-canonical-v2-protocol-v1')
  assert.equal(astroFoundation.source.ruleCoreVersion, 'mallang-astrology-rule-core-v0')
  assert.ok(astroFoundation.source.provenanceLinks.providerBundleSha256)

  // 4. UNKNOWN
  assert.equal(astroFoundation.unknown.activationStatus, 'blocked')
  assert.equal(astroFoundation.unknown.serviceEligibility, 'blocked')
  assert.equal(astroFoundation.unknown.systemBoundaries.livedExperience, 'not_supplied')
  assert.equal(astroFoundation.unknown.systemBoundaries.consumerDelivery, 'blocked')
  assert.equal(astroFoundation.unknown.mustNotAssume, undefined, 'mustNotAssume behavioral directives must be removed')
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

  // Exported JSON must be consumable as the same deterministic base and must
  // regenerate the same Markdown report without losing provenance fields.
  assert.doesNotMatch(jsonStr, /による/)
  assert.doesNotMatch(jsonStr, /authority_supported_classical_text|classical_systematic_authority/)
  assert.doesNotMatch(md, /による/)
  assert.doesNotMatch(md, /authority_supported_classical_text|classical_systematic_authority/)
  assert.deepEqual(parsed.systems.saju.source.factGroundings, base.systems.saju.source.factGroundings)
  assert.equal(formatDeterministicBaseMarkdown(parsed), md)

  const exportDirectory = await mkdtemp(join(tmpdir(), 'deterministic-base-export-'))
  try {
    const jsonPath = join(exportDirectory, 'deterministic_base.json')
    const markdownPath = join(exportDirectory, 'deterministic_base.md')
    await writeFile(jsonPath, jsonStr, 'utf8')
    await writeFile(markdownPath, md, 'utf8')

    const consumedJson = JSON.parse(await readFile(jsonPath, 'utf8'))
    const consumedMarkdown = await readFile(markdownPath, 'utf8')
    assert.deepEqual(consumedJson.systems.saju.source.factGroundings, base.systems.saju.source.factGroundings)
    assert.equal(formatDeterministicBaseMarkdown(consumedJson), consumedMarkdown)
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
