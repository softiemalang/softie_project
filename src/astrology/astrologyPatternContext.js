/**
 * astrologyPatternContext.js
 *
 * 서양 점성학(Western Astrology) Element/Modality 우세, House Axis, Major Aspect 패턴 근거 추출 모듈
 */

export function extractAstrologyPatterns({
  planets = [],
  houses = [],
  aspects = [],
  elementsAndModalities = { elements: {}, modalities: {} },
} = {}) {
  const patterns = []
  const houseAxes = []

  // 1. Element & Modality Dominance Pattern (근거 묶음)
  const { elements = {}, modalities = {} } = elementsAndModalities

  Object.entries(elements).forEach(([elem, count]) => {
    if (count >= 4) {
      patterns.push({
        patternId: `${elem}_element_emphasis`,
        patternType: 'element_dominance',
        evidence: planets.filter((p) => getElementOfSign(p.sign) === elem).map((p) => `${p.planet} in ${p.sign}`),
        count,
        confidence: 'derived_pattern',
      })
    }
  })

  Object.entries(modalities).forEach(([mod, count]) => {
    if (count >= 4) {
      patterns.push({
        patternId: `${mod}_modality_emphasis`,
        patternType: 'modality_dominance',
        evidence: planets.filter((p) => getModalityOfSign(p.sign) === mod).map((p) => `${p.planet} in ${p.sign}`),
        count,
        confidence: 'derived_pattern',
      })
    }
  })

  // 2. House Axis Context (1H-7H, 4H-10H, 2H-8H)
  if (houses && houses.length >= 12) {
    const h1Planets = planets.filter((p) => p.house === 1)
    const h7Planets = planets.filter((p) => p.house === 7)
    houseAxes.push({
      axisId: '1H_7H_self_relationship_axis',
      axisName: 'Self vs Relationship Axis',
      h1Count: h1Planets.length,
      h7Count: h7Planets.length,
      evidence: [...h1Planets.map((p) => `1H: ${p.planet}`), ...h7Planets.map((p) => `7H: ${p.planet}`)],
    })

    const h4Planets = planets.filter((p) => p.house === 4)
    const h10Planets = planets.filter((p) => p.house === 10)
    houseAxes.push({
      axisId: '4H_10H_foundation_career_axis',
      axisName: 'Foundation vs Career/Public Axis',
      h4Count: h4Planets.length,
      h10Count: h10Planets.length,
      evidence: [...h4Planets.map((p) => `4H: ${p.planet}`), ...h10Planets.map((p) => `10H: ${p.planet}`)],
    })

    const h2Planets = planets.filter((p) => p.house === 2)
    const h8Planets = planets.filter((p) => p.house === 8)
    houseAxes.push({
      axisId: '2H_8H_personal_shared_resources_axis',
      axisName: 'Personal vs Shared Resources Axis',
      h2Count: h2Planets.length,
      h8Count: h8Planets.length,
      evidence: [...h2Planets.map((p) => `2H: ${p.planet}`), ...h8Planets.map((p) => `8H: ${p.planet}`)],
    })
  }

  // 3. Major Aspect Patterns (Hard vs Soft Aspect Dynamic)
  const hardAspects = aspects.filter((a) => a.aspectType === 'square' || a.aspectType === 'opposition')
  const softAspects = aspects.filter((a) => a.aspectType === 'trine' || a.aspectType === 'sextile')

  if (hardAspects.length >= 2) {
    patterns.push({
      patternId: 'dynamic_tension_aspects',
      patternType: 'aspect_dynamic',
      evidence: hardAspects.map((a) => `${a.planetA} ${a.aspectType} ${a.planetB}`),
      confidence: 'derived_pattern',
    })
  }

  if (softAspects.length >= 2) {
    patterns.push({
      patternId: 'harmonious_flow_aspects',
      patternType: 'aspect_dynamic',
      evidence: softAspects.map((a) => `${a.planetA} ${a.aspectType} ${a.planetB}`),
      confidence: 'derived_pattern',
    })
  }

  return {
    majorPatterns: patterns,
    houseAxes,
  }
}

function getElementOfSign(sign) {
  if (['aries', 'leo', 'sagittarius'].includes(sign)) return 'fire'
  if (['taurus', 'virgo', 'capricorn'].includes(sign)) return 'earth'
  if (['gemini', 'libra', 'aquarius'].includes(sign)) return 'air'
  if (['cancer', 'scorpio', 'pisces'].includes(sign)) return 'water'
  return 'unknown'
}

function getModalityOfSign(sign) {
  if (['aries', 'cancer', 'libra', 'capricorn'].includes(sign)) return 'cardinal'
  if (['taurus', 'leo', 'scorpio', 'aquarius'].includes(sign)) return 'fixed'
  if (['gemini', 'virgo', 'sagittarius', 'pisces'].includes(sign)) return 'mutable'
  return 'unknown'
}
