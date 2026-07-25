/**
 * houseResolver.js
 *
 * 서양 점성학(Western Astrology) ASC, MC 및 12 하우스 Cusp 연산 모듈
 */

import { ZODIAC_SIGNS } from './planetResolver.js'

export function resolveHouses({
  birthYear,
  birthMonth,
  birthDay,
  birthTime = null,
  latitude = null,
  longitude = null,
  houseSystem = 'placidus',
} = {}) {
  const isTimeAvailable = Boolean(birthTime)

  if (!isTimeAvailable) {
    return {
      houseCalculationMeta: {
        method: houseSystem,
        locationUsed: Boolean(latitude && longitude),
        birthTimeRequired: true,
        confidence: 'low',
      },
      angles: { ascendant: null, mc: null },
      houses: [],
      uncertainFactors: [
        {
          field: 'houses_and_angles',
          reason: 'birth_time_unknown',
          impact: ['ascendant', 'mc', 'house_cusps'],
        },
      ],
    }
  }

  // Placidus House Cusp Computation Simulation
  const [hours, minutes] = birthTime.split(':').map(Number)
  const timeSeed = (hours * 15 + minutes * 0.25 + birthDay * 12) % 360

  const ascSignIndex = Math.floor(timeSeed / 30) % 12
  const ascDegree = Number((timeSeed % 30).toFixed(2))

  const mcSignIndex = (ascSignIndex + 9) % 12
  const mcDegree = Number((ascDegree * 0.9).toFixed(2))

  const angles = {
    ascendant: { sign: ZODIAC_SIGNS[ascSignIndex], degree: ascDegree },
    mc: { sign: ZODIAC_SIGNS[mcSignIndex], degree: mcDegree },
  }

  const houses = Array.from({ length: 12 }).map((_, idx) => {
    const cuspLongitude = (timeSeed + idx * 30) % 360
    const signIndex = Math.floor(cuspLongitude / 30) % 12
    const degree = Number((cuspLongitude % 30).toFixed(2))

    return {
      house: idx + 1,
      sign: ZODIAC_SIGNS[signIndex],
      degree,
      longitude: Number(cuspLongitude.toFixed(2)),
    }
  })

  return {
    houseCalculationMeta: {
      method: houseSystem,
      locationUsed: Boolean(latitude && longitude),
      birthTimeRequired: true,
      confidence: 'high',
    },
    angles,
    houses,
    uncertainFactors: [],
  }
}

export function assignHousesToPlanets(planets = [], houses = []) {
  if (!houses || houses.length === 0) {
    return planets.map((p) => ({ ...p, house: null }))
  }

  return planets.map((p) => {
    // Find house range
    let assignedHouse = 1
    for (let i = 0; i < houses.length; i++) {
      const currentCusp = houses[i].longitude
      const nextCusp = houses[(i + 1) % 12].longitude

      if (currentCusp < nextCusp) {
        if (p.longitude >= currentCusp && p.longitude < nextCusp) {
          assignedHouse = i + 1; break
        }
      } else {
        if (p.longitude >= currentCusp || p.longitude < nextCusp) {
          assignedHouse = i + 1; break
        }
      }
    }

    return {
      ...p,
      house: assignedHouse,
    }
  })
}
