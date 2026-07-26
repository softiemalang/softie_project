/**
 * planetResolver.js
 *
 * 서양 점성학(Western Astrology) 10대 천체 위치, 별자리, 도수 및 역행 상태 연산 모듈
 */

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]

export const PLANET_NAMES = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export function resolvePlanets({
  birthYear,
  birthMonth,
  birthDay,
  birthTime = null,
  ruleSetVersion = 'western_tropical_placidus_v1',
} = {}) {
  // LAB SIMULATION ONLY: deterministic seed output, not astronomical ephemeris.
  const baseDegreeSeed = (birthYear * 365 + birthMonth * 30 + birthDay) % 360

  const planets = PLANET_NAMES.map((planet, idx) => {
    const rawDegree = (baseDegreeSeed + idx * 36.5 + (birthMonth * 12)) % 360
    const signIndex = Math.floor(rawDegree / 30) % 12
    const degreeInSign = Number((rawDegree % 30).toFixed(2))

    // Seeded simulation only; not a computed astronomical retrograde state.
    const isRetrograde = idx > 1 && (birthDay + idx) % 5 === 0

    return {
      planet,
      sign: ZODIAC_SIGNS[signIndex],
      longitude: Number(rawDegree.toFixed(2)),
      degree: degreeInSign,
      house: null, // To be assigned by houseResolver
      isRetrograde,
    }
  })

  return {
    ruleSetVersion,
    planets,
    calculationMeta: {
      status: 'simulation_only',
      availableForInterpretation: false,
      ephemerisSource: 'date_seed_simulation',
      accuracy: 'not_astronomical',
      verifiedAgainst: null,
      warning: '검증된 천문력 Adapter가 아니므로 실제 점성학 해석값으로 사용할 수 없습니다.',
    },
  }
}
