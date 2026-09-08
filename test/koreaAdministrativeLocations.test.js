import test from 'node:test'
import assert from 'node:assert/strict'
import {
  KOREA_LOCATION_DATA_PROVENANCE,
  KOREA_ADMINISTRATIVE_LOCATIONS,
  getKoreaAdministrativeLocation,
  isVerifiedKoreaAdministrativeLocation,
  searchKoreaAdministrativeLocations,
} from '../src/interpretationPrep/koreaAdministrativeLocations.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  buildDeterministicBase,
  exportDeterministicBaseJson,
  formatDeterministicBaseMarkdown,
} from '../src/interpretationPrep/conversationFoundation.js'

const BASE_INPUT = {
  subjectName: '지역검증테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  targetDate: '2026-07-26',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

function inputForLocation(location, overrides = {}) {
  return {
    ...BASE_INPUT,
    ...overrides,
    placeName: location.label,
    referenceCity: location.id,
    timezone: location.timezone,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  }
}

function buildBaseForLocation(location, overrides = {}) {
  const prepared = prepareThreeSystemInterpretationData(inputForLocation(location, overrides))
  const base = buildDeterministicBase({
    subjectName: prepared.result.input.normalized.subjectName,
    result: prepared.result,
    systems: prepared.systems,
    unifiedContext: prepared.unifiedContext,
  })
  return { prepared, base }
}

test('Korea administrative location snapshot is complete, verified, and searchable without fallback', () => {
  assert.equal(KOREA_ADMINISTRATIVE_LOCATIONS.length, 252)
  assert.equal(
    new Set(KOREA_ADMINISTRATIVE_LOCATIONS.map((location) => location.code)).size,
    KOREA_ADMINISTRATIVE_LOCATIONS.length,
  )
  assert.ok(KOREA_ADMINISTRATIVE_LOCATIONS.every(isVerifiedKoreaAdministrativeLocation))
  assert.ok(KOREA_ADMINISTRATIVE_LOCATIONS.every((location) => location.country === '대한민국'))
  assert.ok(KOREA_ADMINISTRATIVE_LOCATIONS.every((location) => location.timezone === 'Asia/Seoul'))
  assert.equal(KOREA_LOCATION_DATA_PROVENANCE.administrativeSource.referenceDate, '2025-12-31')
  assert.equal(KOREA_LOCATION_DATA_PROVENANCE.coordinateSource.coordinateReferenceSystem, 'Korea 2000 Unified CS / EPSG:5179')
  assert.equal(getKoreaAdministrativeLocation('sgg:11110').label, '서울특별시 종로구')
  assert.equal(getKoreaAdministrativeLocation('sgg:26350').label, '부산광역시 해운대구')
  assert.equal(getKoreaAdministrativeLocation('sgg:50110').label, '제주특별자치도 제주시')
  assert.equal(getKoreaAdministrativeLocation('sgg:41210').label, '경기도 광명시')
  assert.equal(getKoreaAdministrativeLocation('sgg:43111').coordinateMethod, 'boundary_interior_fallback')
  assert.equal(getKoreaAdministrativeLocation('sgg:not-a-location'), null)
  assert.deepEqual(
    searchKoreaAdministrativeLocations('부산 해운대').map((location) => location.code),
    ['26350'],
  )
  assert.deepEqual(searchKoreaAdministrativeLocations('대한민국 밖'), [])
  for (const location of KOREA_ADMINISTRATIVE_LOCATIONS) {
    assert.ok(Math.abs(location.correctionMinutes - (135 - location.longitude) * 4) < 1e-9)
  }
})

test('selected Seoul and non-Seoul locations propagate exact coordinates into Saju and canonical Base', () => {
  for (const locationId of ['sgg:11110', 'sgg:26350', 'sgg:50110', 'sgg:41210', 'sgg:41281', 'sgg:51720', 'sgg:43111']) {
    const location = getKoreaAdministrativeLocation(locationId)
    const { prepared, base } = buildBaseForLocation(location)
    const normalized = prepared.result.input.normalized
    const canonicalJson = exportDeterministicBaseJson(base)
    const canonical = JSON.parse(canonicalJson)

    assert.equal(normalized.referenceCity, location.id)
    assert.equal(normalized.placeName, location.label)
    assert.equal(normalized.timezone, 'Asia/Seoul')
    assert.equal(normalized.administrativeAreaCode, location.code)
    assert.equal(normalized.administrativeAreaName, location.label)
    assert.equal(normalized.locationResolution, 'administrative_area_representative_point')
    assert.equal(normalized.coordinateMethod, location.coordinateMethod)
    assert.deepEqual(normalized.coordinateProvenance, location.coordinateProvenance)
    assert.equal(normalized.latitude, location.latitude)
    assert.equal(normalized.longitude, location.longitude)
    assert.equal(prepared.result.systems.saju.engine.options.longitudeDegrees, location.longitude)
    assert.equal(prepared.result.systems.saju.engine.options.solarTimeOffsetMinutes, location.correctionMinutes)
    assert.equal(prepared.systems.astrology.status, 'simulation_blocked')
    assert.equal(prepared.systems.astrology.calculationResult, null)
    assert.equal(base.normalizedInput.referenceCity, location.id)
    assert.equal(base.normalizedInput.placeName, location.label)
    assert.equal(base.normalizedInput.latitude, String(location.latitude))
    assert.equal(base.normalizedInput.longitude, String(location.longitude))
    assert.equal(canonical.normalizedInput.latitude, String(location.latitude))
    assert.equal(canonical.normalizedInput.longitude, String(location.longitude))
    assert.equal(canonical.normalizedInput.administrativeAreaCode, location.code)
    assert.equal(canonical.normalizedInput.administrativeAreaName, location.label)
    assert.equal(canonical.normalizedInput.locationResolution, 'administrative_area_representative_point')
    assert.equal(canonical.normalizedInput.coordinateMethod, location.coordinateMethod)
    assert.deepEqual(canonical.normalizedInput.coordinateProvenance, location.coordinateProvenance)
    assert.equal(canonical.normalizedInput.timeAccuracy, 'exact')
    assert.notEqual(canonical.normalizedInput.locationResolution, 'exact')
    assert.match(base.markdown, /행정구역 대표점 \(administrative_area_representative_point\) · 주소 단위 좌표 아님/u)
    assert.match(base.markdown, new RegExp(location.coordinateProvenance.sha256, 'u'))
    assert.equal(Object.hasOwn(canonical, 'markdown'), false)
    assert.equal(Object.hasOwn(canonical, 'formattedMarkdown'), false)
    assert.doesNotMatch(canonicalJson, /undefined/u)
    assert.doesNotMatch(canonicalJson, /서울\(126\.97°E\)|126\.97°E|-32\.12분/u)
    assert.doesNotMatch(base.markdown, /서울\(126\.97°E\)|126\.97°E|-32\.12분/u)
    assert.match(canonicalJson, /선택된 행정구역 대표경도에 4분\/도 보정 \+ NOAA 균시차 EoT/u)
    assert.equal(formatDeterministicBaseMarkdown(base), base.markdown)
  }
})

test('solar-term boundary fixture keeps candidate uncertainty while preserving selected Seoul coordinates', () => {
  const location = getKoreaAdministrativeLocation('sgg:11110')
  const { prepared, base } = buildBaseForLocation(location, {
    subjectName: '입춘경계지역테스트',
    birthDate: '1990-02-04',
    birthTime: '11:10',
  })
  const raw = prepared.systems.saju.calculationResult.raw

  assert.equal(raw.candidates.length, 2)
  assert.equal(raw.candidates[0].candidateOrigin, 'solar_term_boundary')
  assert.equal(prepared.result.input.normalized.referenceCity, location.id)
  assert.equal(prepared.result.input.normalized.locationResolution, 'administrative_area_representative_point')
  assert.equal(prepared.result.input.normalized.latitude, location.latitude)
  assert.equal(prepared.result.input.normalized.longitude, location.longitude)
  assert.equal(base.normalizedInput.latitude, String(location.latitude))
  assert.equal(base.normalizedInput.longitude, String(location.longitude))
})

test('unknown birth time remains separate from administrative representative-point semantics', () => {
  const location = getKoreaAdministrativeLocation('sgg:26350')
  const { prepared, base } = buildBaseForLocation(location, {
    timeAccuracy: 'unknown',
    birthTime: '',
  })
  const canonical = JSON.parse(exportDeterministicBaseJson(base))

  assert.equal(prepared.result.input.normalized.timeAccuracy, 'unknown')
  assert.equal(canonical.normalizedInput.timeAccuracy, 'unknown')
  assert.equal(canonical.normalizedInput.locationResolution, 'administrative_area_representative_point')
  assert.equal(canonical.normalizedInput.coordinateMethod, location.coordinateMethod)
  assert.deepEqual(canonical.normalizedInput.coordinateProvenance, location.coordinateProvenance)
  assert.match(base.markdown, /시간 정확도 \| unknown/u)
  assert.match(base.markdown, /좌표 성격\/방법 \| 행정구역 대표점 \(administrative_area_representative_point\)/u)
})

test('unknown administrative location fails closed before calculation', () => {
  assert.throws(
    () => prepareThreeSystemInterpretationData({
      ...BASE_INPUT,
      placeName: '대한민국',
      referenceCity: 'sgg:99999',
      timezone: 'Asia/Seoul',
      latitude: '37.5',
      longitude: '127.0',
    }),
    /시·군·구/u,
  )
})
