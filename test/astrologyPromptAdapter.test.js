import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePlanets } from '../src/astrology/planetResolver.js'
import { resolveHouses, assignHousesToPlanets } from '../src/astrology/houseResolver.js'
import { resolveAspects, calculateElementsAndModalities } from '../src/astrology/aspectResolver.js'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
} from '../src/astrology/astrologyContract.js'
import { buildAstrologyPromptPayload } from '../src/astrology/astrologyPromptAdapter.js'

test('astrologyPromptAdapter: builds 4-step protocol payload with domain profiles and safety guardrails', () => {
  const planetRes = resolvePlanets({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  const houseRes = resolveHouses({
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 10,
    birthTime: '14:30',
  })

  const planetsWithHouses = assignHousesToPlanets(planetRes.planets, houseRes.houses)
  const aspectRes = resolveAspects(planetsWithHouses)
  const elemModRes = calculateElementsAndModalities(planetsWithHouses)

  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '프롬프트테스트',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 10,
      birthTime: '14:30',
    },
    chart: {
      planets: planetsWithHouses,
      angles: houseRes.angles,
      houses: houseRes.houses,
      aspects: aspectRes.aspects,
      elementsAndModalities: elemModRes,
    },
  })

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  const payload = buildAstrologyPromptPayload(interpCtx, 'career')

  assert.equal(payload.systemPrompt.includes('상징과 사실의 분리'), true)
  assert.equal(payload.systemPrompt.includes('결정론적 예언 금지'), true)
  assert.equal(payload.domainInstruction.includes('Career'), true)
  assert.equal(payload.astrologyContextSnapshot.subjectName, '프롬프트테스트')
  assert.equal(payload.astrologyContextSnapshot.confidence, 'high')
})

test('astrologyPromptAdapter: includes uncertainty guide when confidence is low', () => {
  const calcCtx = createAstrologyCalculationContext({
    input: {
      subjectName: '시간미상프롬프트',
      birthYear: 1992,
      birthMonth: 8,
      birthDay: 20,
    },
  })

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  const payload = buildAstrologyPromptPayload(interpCtx, 'relationship')

  assert.equal(payload.astrologyContextSnapshot.confidence, 'low')
  assert.equal(payload.interactiveQuestionGuide.includes('출생시각 미상'), true)
})
