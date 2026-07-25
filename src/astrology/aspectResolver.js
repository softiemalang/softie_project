/**
 * aspectResolver.js
 *
 * 서양 점성학(Western Astrology) Major Aspects, Orb, 강도 연산 모듈
 */

export const MAJOR_ASPECTS = [
  { name: 'conjunction', targetDegree: 0, maxOrb: 8.0 },
  { name: 'sextile', targetDegree: 60, maxOrb: 6.0 },
  { name: 'square', targetDegree: 90, maxOrb: 7.0 },
  { name: 'trine', targetDegree: 120, maxOrb: 8.0 },
  { name: 'opposition', targetDegree: 180, maxOrb: 8.0 },
]

export function resolveAspects(planets = []) {
  const aspects = []

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i]
      const p2 = planets[j]

      const diff = Math.abs(p1.longitude - p2.longitude)
      const angularDistance = diff > 180 ? 360 - diff : diff

      for (const aspectDef of MAJOR_ASPECTS) {
        const orb = Math.abs(angularDistance - aspectDef.targetDegree)

        if (orb <= aspectDef.maxOrb) {
          let strength = 'wide'
          if (orb <= 1.0) strength = 'exact'
          else if (orb <= 3.0) strength = 'strong'
          else if (orb <= 5.0) strength = 'moderate'

          aspects.push({
            planetA: p1.planet,
            planetB: p2.planet,
            aspectType: aspectDef.name,
            exactDegree: aspectDef.targetDegree,
            actualDegree: Number(angularDistance.toFixed(2)),
            orb: Number(orb.toFixed(2)),
            applying: true, // Ephemeris applying/separating flag
            strength,
          })
        }
      }
    }
  }

  return {
    aspects,
  }
}

export function calculateElementsAndModalities(planets = []) {
  const FIRE_SIGNS = ['aries', 'leo', 'sagittarius']
  const EARTH_SIGNS = ['taurus', 'virgo', 'capricorn']
  const AIR_SIGNS = ['gemini', 'libra', 'aquarius']
  const WATER_SIGNS = ['cancer', 'scorpio', 'pisces']

  const CARDINAL_SIGNS = ['aries', 'cancer', 'libra', 'capricorn']
  const FIXED_SIGNS = ['taurus', 'leo', 'scorpio', 'aquarius']
  const MUTABLE_SIGNS = ['gemini', 'virgo', 'sagittarius', 'pisces']

  const elements = { fire: 0, earth: 0, air: 0, water: 0 }
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 }

  planets.forEach((p) => {
    if (FIRE_SIGNS.includes(p.sign)) elements.fire += 1
    if (EARTH_SIGNS.includes(p.sign)) elements.earth += 1
    if (AIR_SIGNS.includes(p.sign)) elements.air += 1
    if (WATER_SIGNS.includes(p.sign)) elements.water += 1

    if (CARDINAL_SIGNS.includes(p.sign)) modalities.cardinal += 1
    if (FIXED_SIGNS.includes(p.sign)) modalities.fixed += 1
    if (MUTABLE_SIGNS.includes(p.sign)) modalities.mutable += 1
  })

  return {
    elements,
    modalities,
  }
}
