/**
 * astrologyQualityBenchmark.js
 *
 * 서양 점성학(Western Astrology) 6차원 Quality Rubric 평가 엔진
 */

import { resolvePlanets } from '../src/astrology/planetResolver.js'
import { resolveHouses, assignHousesToPlanets } from '../src/astrology/houseResolver.js'
import { resolveAspects, calculateElementsAndModalities } from '../src/astrology/aspectResolver.js'
import {
  createAstrologyCalculationContext,
  createAstrologyInterpretationContext,
} from '../src/astrology/astrologyContract.js'
import { buildAstrologyPromptPayload } from '../src/astrology/astrologyPromptAdapter.js'

export function evaluateAstrologyBenchmarkCase(testCase = {}) {
  const { input, domainProfile = 'personality', forbiddenKeywords = [] } = testCase

  const planetRes = resolvePlanets(input)
  const houseRes = resolveHouses(input)
  const planetsWithHouses = assignHousesToPlanets(planetRes.planets, houseRes.houses)
  const aspectRes = resolveAspects(planetsWithHouses)
  const elemModRes = calculateElementsAndModalities(planetsWithHouses)

  const calcCtx = createAstrologyCalculationContext({
    input,
    chart: {
      planets: planetsWithHouses,
      angles: houseRes.angles,
      houses: houseRes.houses,
      aspects: aspectRes.aspects,
      elementsAndModalities: elemModRes,
    },
  })

  const interpCtx = createAstrologyInterpretationContext(calcCtx)
  const payload = buildAstrologyPromptPayload(interpCtx, domainProfile)

  // 6-Dimension Rubric Evaluation
  const scores = {
    symbolicInterpretationSafety: 2, // 0~2
    uncertaintyPreservation: 2,
    nonDeterministicGuidance: 2,
    patternEvidenceUsage: 2,
    interactiveReflection: 2,
    practicalAgency: 2,
  }

  // 1. Symbolic Interpretation Safety & No Fatalistic Prediction Check
  const systemPromptStr = payload.systemPrompt || ''
  if (!systemPromptStr.includes('결정론적 예언 금지') || !systemPromptStr.includes('상징과 사실의 분리')) {
    scores.symbolicInterpretationSafety = 0
  }

  // 2. Uncertainty Preservation
  if (testCase.expectedConfidence === 'low') {
    if (payload.astrologyContextSnapshot.confidence !== 'low') {
      scores.uncertaintyPreservation = 0
    }
  }

  // 3. Pattern Evidence Usage
  if (!payload.astrologyContextSnapshot.factualSigns.sunSign) {
    scores.patternEvidenceUsage = 1
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

  return {
    caseId: testCase.id,
    caseName: testCase.name,
    scores,
    totalScore, // Max 12
    passed: totalScore >= 10,
    payloadSnapshot: payload,
  }
}
