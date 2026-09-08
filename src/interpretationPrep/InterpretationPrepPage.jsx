import { useState } from 'react'
import { navigate } from '../lib/router'
import { ChatHandoffCard } from './components/ChatHandoffCard.jsx'
import { prepareThreeSystemInterpretationData } from './threeSystemPrepPipeline.js'
import { DEFAULT_INPUT } from './schema.js'
import {
  getKoreaAdministrativeLocation,
  isVerifiedKoreaAdministrativeLocation,
  searchKoreaAdministrativeLocations,
} from './koreaAdministrativeLocations.js'
import './interpretationPrep.css'

function todayInKorea() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}

function createInitialInput() {
  return {
    ...DEFAULT_INPUT,
    targetDate: todayInKorea(),
    placeName: '',
    referenceCity: '',
    timezone: 'Asia/Seoul',
    latitude: '',
    longitude: '',
  }
}

function digitsOnly(value, maxLength) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength)
}

function formatDateDraft(value) {
  const digits = digitsOnly(value, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return digits.slice(0, 4) + '.' + digits.slice(4)
  return digits.slice(0, 4) + '.' + digits.slice(4, 6) + '.' + digits.slice(6)
}

function normalizeDateDraft(value) {
  const digits = digitsOnly(value, 8)
  if (digits.length !== 8) return ''

  const year = Number(digits.slice(0, 4))
  const month = Number(digits.slice(4, 6))
  const day = Number(digits.slice(6, 8))
  const candidate = new Date(Date.UTC(year, month - 1, day))
  const isValidDate = candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day

  if (!isValidDate || year < 1901 || year > 2100) return ''
  return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
}

function formatTimeDraft(value) {
  const digits = digitsOnly(value, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + ':' + digits.slice(2)
}

function normalizeTimeDraft(value) {
  const digits = digitsOnly(value, 4)
  if (digits.length !== 4) return ''

  const hour = Number(digits.slice(0, 2))
  const minute = Number(digits.slice(2, 4))
  if (hour > 23 || minute > 59) return ''
  return digits.slice(0, 2) + ':' + digits.slice(2, 4)
}

function LabeledField({ label, hint, className = '', children }) {
  return (
    <label className={('prep-field ' + className).trim()}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default function InterpretationPrepPage() {
  const [input, setInput] = useState(createInitialInput)
  const [dateDraft, setDateDraft] = useState('')
  const [timeDraft, setTimeDraft] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)

  const locationResults = locationQuery.trim() && !selectedLocation
    ? searchKoreaAdministrativeLocations(locationQuery, 12)
    : []

  function updateInput(key, value) {
    setInput((current) => ({ ...current, [key]: value }))
  }

  function updateDate(value) {
    const formatted = formatDateDraft(value)
    setDateDraft(formatted)
    updateInput('birthDate', normalizeDateDraft(formatted))
  }

  function updateTime(value) {
    const formatted = formatTimeDraft(value)
    setTimeDraft(formatted)
    updateInput('birthTime', normalizeTimeDraft(formatted))
    setInput((current) => ({ ...current, timeAccuracy: 'exact' }))
  }

  function setTimeAccuracyMode(mode) {
    if (mode === 'unknown') {
      setInput((current) => ({ ...current, birthTime: '', timeAccuracy: 'unknown' }))
      return
    }

    setInput((current) => ({
      ...current,
      birthTime: current.birthTime || normalizeTimeDraft(timeDraft),
      timeAccuracy: 'exact',
    }))
  }

  function updateLocationQuery(value) {
    setLocationQuery(value)
    if (selectedLocation && value !== selectedLocation.label) {
      setSelectedLocation(null)
      setInput((current) => ({
        ...current,
        placeName: '',
        referenceCity: '',
        latitude: '',
        longitude: '',
        timezone: 'Asia/Seoul',
      }))
    }
  }

  function selectLocation(location) {
    if (!isVerifiedKoreaAdministrativeLocation(location)) {
      setSelectedLocation(null)
      setLocationQuery('')
      setInput((current) => ({
        ...current,
        placeName: '',
        referenceCity: '',
        latitude: '',
        longitude: '',
        timezone: 'Asia/Seoul',
      }))
      return
    }

    setSelectedLocation(location)
    setLocationQuery(location.label)
    setInput((current) => ({
      ...current,
      placeName: location.label,
      referenceCity: location.id,
      timezone: location.timezone,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    }))
  }

  function clearLocation() {
    setSelectedLocation(null)
    setLocationQuery('')
    setInput((current) => ({
      ...current,
      placeName: '',
      referenceCity: '',
      latitude: '',
      longitude: '',
      timezone: 'Asia/Seoul',
    }))
  }

  function prepareForBase() {
    if (!input.subjectName.trim()) throw new Error('이름을 입력해 주세요.')

    const location = getKoreaAdministrativeLocation(input.referenceCity)
    if (!location || !isVerifiedKoreaAdministrativeLocation(location)) {
      throw new Error('출생지를 대한민국 시·군·구로 검색해 선택해 주세요.')
    }

    return prepareThreeSystemInterpretationData({
      ...input,
      targetDate: todayInKorea(),
      placeName: location.label,
      referenceCity: location.id,
      timezone: location.timezone,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    })
  }

  return (
    <main className="app-shell ag-shell prep-shell" data-design-theme="atmospheric">
      <header className="hero prep-hero ag-glass">
        <div className="prep-hero-top">
          <button type="button" className="prep-ghost-button" onClick={() => navigate('/')} aria-label="홈으로 이동">
            홈
          </button>
        </div>
        <div className="prep-hero-body">
          <div className="prep-hero-copy">
            <h1>출생정보로 Base 만들기</h1>
            <p className="subtle">
              입력한 정보를 계산 가능한 형태로 정리해 canonical Base 파일을 만듭니다.
            </p>
          </div>
        </div>
      </header>

      <div className="prep-workspace">
        <section className="card prep-card ag-glass" id="prep-input" aria-labelledby="prep-input-title">
          <div className="card-header">
            <div>
              <h2 id="prep-input-title">출생정보</h2>
            </div>
            <span className="prep-step-note">대한민국 출생 기준</span>
          </div>

          <div className="prep-form-grid">
            <LabeledField label="이름">
              <input
                value={input.subjectName}
                onChange={(event) => updateInput('subjectName', event.target.value)}
                placeholder="이름"
                autoComplete="name"
                required
              />
            </LabeledField>

            <div className="prep-field">
              <span id="prep-gender-label">성별</span>
              <div className="prep-gender-control" role="group" aria-labelledby="prep-gender-label">
                <button
                  type="button"
                  aria-pressed={input.gender === 'male'}
                  className={'prep-gender-option ' + (input.gender === 'male' ? 'is-active' : '')}
                  onClick={() => updateInput('gender', 'male')}
                >
                  남성
                </button>
                <button
                  type="button"
                  aria-pressed={input.gender === 'female'}
                  className={'prep-gender-option ' + (input.gender === 'female' ? 'is-active' : '')}
                  onClick={() => updateInput('gender', 'female')}
                >
                  여성
                </button>
              </div>
            </div>

            <LabeledField label="생년월일">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="YYYY.MM.DD"
                maxLength={10}
                pattern="[0-9.]*"
                value={dateDraft}
                onChange={(event) => updateDate(event.target.value)}
                required
              />
            </LabeledField>

            <LabeledField label="달력">
              <select value={input.calendar} onChange={(event) => updateInput('calendar', event.target.value)}>
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </select>
            </LabeledField>

            {input.calendar === 'lunar' && (
              <LabeledField label="음력 월">
                <select
                  value={input.isLeapMonth ? 'leap' : 'regular'}
                  onChange={(event) => updateInput('isLeapMonth', event.target.value === 'leap')}
                >
                  <option value="regular">평달</option>
                  <option value="leap">윤달</option>
                </select>
                <small>윤달인 경우에만 선택하세요.</small>
              </LabeledField>
            )}

            <LabeledField label="출생시간" className="prep-field-wide" hint="모르면 ‘모름’을 선택하세요.">
              <div className="prep-time-row">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:MM"
                  maxLength={5}
                  pattern="[0-9:]*"
                  value={input.timeAccuracy === 'unknown' ? '' : timeDraft}
                  onChange={(event) => updateTime(event.target.value)}
                  disabled={input.timeAccuracy === 'unknown'}
                  aria-label="출생시간"
                />
                <button
                  type="button"
                  className={'prep-time-unknown-toggle ' + (input.timeAccuracy === 'unknown' ? 'is-active' : '')}
                  aria-pressed={input.timeAccuracy === 'unknown'}
                  onClick={() => setTimeAccuracyMode(input.timeAccuracy === 'unknown' ? 'exact' : 'unknown')}
                >
                  모름
                </button>
              </div>
            </LabeledField>

            <div className="prep-field prep-field-wide">
              <span id="prep-location-label">출생지</span>
              <input
                id="prep-location-search"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="prep-location-results"
                aria-expanded={Boolean(locationQuery.trim() && !selectedLocation)}
                aria-labelledby="prep-location-label"
                value={locationQuery}
                onChange={(event) => updateLocationQuery(event.target.value)}
                placeholder="대한민국 시·군·구 검색"
                autoComplete="off"
              />
              <small>주소나 좌표를 입력하지 않고 행정구역을 선택합니다.</small>

              {selectedLocation && (
                <div className="prep-location-selected" aria-live="polite">
                  <strong>{selectedLocation.label}</strong>
                  <span>선택한 지역의 대표 위치와 대한민국 시간대를 계산에 사용합니다.</span>
                  <button type="button" className="prep-location-change" onClick={clearLocation}>
                    변경
                  </button>
                </div>
              )}

              {!selectedLocation && locationQuery.trim() && (
                <div id="prep-location-results" className="prep-location-results" role="listbox" aria-label="출생지 검색 결과">
                  {locationResults.length > 0 ? locationResults.map((location) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={location.id}
                      onClick={() => selectLocation(location)}
                    >
                      <strong>{location.label}</strong>
                    </button>
                  )) : (
                    <p className="prep-location-empty" role="status">
                      확인된 대한민국 시·군·구가 없습니다. 다른 이름으로 검색해 주세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="prep-handoff-section" id="prep-handoff" aria-label="Base 산출물">
          <ChatHandoffCard key={Object.values(input).join('|')} onPrepare={prepareForBase} />
        </section>
      </div>
    </main>
  )
}
