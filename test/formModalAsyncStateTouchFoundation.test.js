import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { SCHEDULER_BRANCHES } from '../src/scheduler/constants.js'
import {
  getReservationValidationIssue,
  getRoomsForBranch,
  validateReservationForm,
} from '../src/scheduler/helpers.js'
import {
  checkArtifact as checkHistoricalDesignArtifact,
  DEFAULT_DIRECTORY as HISTORICAL_DESIGN_DIRECTORY,
} from '../scripts/check-design-reference-audit-v1-emil10-incremental.mjs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const home = read('src/pages/HomePage.jsx')
const band = read('src/pages/BandGoogleCompactPage.jsx')
const rehearsal = read('src/pages/RehearsalCalendarPage.jsx')
const spotify = read('src/pages/SpotifyMusicPage.jsx')
const fortune = read('src/saju/SoftieFortunePage.jsx')
const editor = read('src/scheduler/ReservationEditorPage.jsx')
const today = read('src/scheduler/TodaySchedulerPage.jsx')
const syncModal = read('src/scheduler/SyncConfirmationModal.jsx')
const styles = read('src/styles.css')
const bandPolish = read('public/band-polish.css')
const bandAccount = read('public/band-hub-account-actions.css')
const fortuneStyles = read('src/saju/fortune.css')

function validReservation() {
  const branch = SCHEDULER_BRANCHES[0]
  return {
    reservationDate: '2026-08-11',
    branch,
    room: getRoomsForBranch(branch)[0],
    customerName: 'Softie',
    startTime: '18:00',
    phoneLast4: '1234',
    durationHours: 2,
    warningOffsetMinutes: 10,
    tags: [],
    notesText: '',
  }
}

test('reservation validation keeps its messages while exposing the first invalid field', () => {
  const cases = [
    ['reservationDate', '예약 날짜를 입력해 주세요.'],
    ['branch', '지점을 입력해 주세요.'],
    ['room', '룸 이름을 입력해 주세요.'],
    ['customerName', '예약자 이름을 입력해 주세요.'],
    ['startTime', '시작 시간을 입력해 주세요.'],
    ['phoneLast4', '번호는 숫자 4자리로 입력해 주세요.'],
    ['durationHours', '이용 시간은 1시간 이상으로 입력해 주세요.'],
    ['warningOffsetMinutes', '퇴실등 시간은 10분 전 또는 15분 전만 선택할 수 있어요.'],
  ]

  for (const [field, message] of cases) {
    const values = validReservation()
    values[field] = field === 'durationHours'
      ? 0
      : field === 'phoneLast4'
        ? '12'
        : ''
    const issue = getReservationValidationIssue(values)
    assert.deepEqual(issue, { field, message })
    assert.equal(validateReservationForm(values), message)
  }

  assert.equal(getReservationValidationIssue(validReservation()), null)
  assert.equal(validateReservationForm(validReservation()), '')
})

test('active mutation surfaces acquire synchronous locks and expose busy feedback', () => {
  assert.match(home, /if \(!text \|\| isSendingMemoRef\.current\) return/)
  assert.match(home, /isSendingMemoRef\.current = true[\s\S]*setIsSendingMemo\(true\)/)
  assert.match(band, /if \(actionLockRef\.current\) return[\s\S]*actionLockRef\.current = true/)
  assert.match(rehearsal, /if \(submitLockRef\.current\) return[\s\S]*submitLockRef\.current = true/)
  assert.match(rehearsal, /deleteLockRef\.current \|\| !confirm[\s\S]*deleteLockRef\.current = true/)
  assert.match(spotify, /if \(!userId \|\| controlLockRef\.current\) return/)
  assert.match(spotify, /if \(!userId \|\| playlistStartLockRef\.current\) return/)
  assert.match(fortune, /if \(!activeProfile \|\| isLoading \|\| reportRefreshLockRef\.current\) return/)
  assert.match(fortune, /backupLockRef\.current \|\| isBackedUp/)
  assert.match(today, /workLogSyncLockRef\.current = true[\s\S]*setIsWorkLogSyncBusy\(true\)/)
  assert.match(syncModal, /disabled=\{isBusy\}[\s\S]*aria-busy=\{isBusy\}/)
})

test('audited synchronous locks release from finally paths', () => {
  assert.match(home, /finally\s*\{\s*isSendingMemoRef\.current = false/)
  assert.equal((band.match(/finally\s*\{\s*actionLockRef\.current = false/g) || []).length, 7)
  assert.match(rehearsal, /finally\s*\{\s*backupLockRef\.current = false/)
  assert.match(rehearsal, /finally\s*\{\s*deleteLockRef\.current = false/)
  assert.match(rehearsal, /finally\s*\{\s*submitLockRef\.current = false/)
  for (const lock of ['trackSaveLockRef', 'volumeLockRef', 'controlLockRef', 'playlistLoadLockRef', 'playlistStartLockRef']) {
    assert.match(spotify, new RegExp(`finally\\s*\\{\\s*${lock}\\.current = false`), lock)
  }
  assert.match(fortune, /finally\s*\{\s*reportRefreshLockRef\.current = false/)
  assert.match(fortune, /finally\s*\{\s*backupLockRef\.current = false/)
  assert.equal((today.match(/finally\s*\{\s*workLogSyncLockRef\.current = false/g) || []).length, 2)
})

test('loading, empty, filter-no-result, and error states stay distinct', () => {
  assert.match(band, /isLoadingRooms \? null : roomLoadError \?[\s\S]*아직 참여 중인 방이 없어요/)
  assert.match(band, /setRoomLoadError\(message\)[\s\S]*if \(room && member\) setStatus\(message\)/)
  assert.match(rehearsal, /합주 일정을 불러오는 중[\s\S]*role="alert"/)
  assert.match(spotify, /isRefreshing && deviceCards\.length === 0[\s\S]*Spotify Connect 기기를 불러오는 중/)
  assert.match(fortune, /initialLoadError \?[\s\S]*role="alert"/)
  assert.match(today, /현재 조건에 맞는 일정이 없어요[\s\S]*오늘 일정이 없어요/)
})

test('active forms and overlays expose names, field errors, and dialog semantics without new aria-modal claims', () => {
  assert.match(home, /htmlFor="home-memo-text"/)
  assert.match(band, /aria-label="방 이름"/)
  assert.match(rehearsal, /htmlFor="rehearsal-title"[\s\S]*aria-labelledby="rehearsal-start-time-label"/)
  assert.match(rehearsal, /role="dialog" aria-labelledby="rehearsal-selected-date-title"/)
  assert.match(spotify, /role="dialog" aria-label="Spotify 기기 볼륨 조절"/)
  assert.match(fortune, /role="dialog" aria-label="운세 히스토리"/)
  assert.match(today, /role="dialog" aria-label="웹 알림 설정"/)
  assert.match(editor, /aria-invalid=\{invalidField === 'customerName'/)
  assert.match(editor, /aria-describedby=\{invalidField === 'phoneLast4'/)
  assert.match(editor, /querySelector\(`\[data-validation-field=/)
  assert.match(editor, /if \(invalidField === field\) \{[\s\S]*?setInvalidField\(''\)[\s\S]*?setEditorStatus\(''\)/)
})

test('audited active touch targets use the 44px house minimum', () => {
  assert.match(styles, /\.home-auth-button\s*\{[\s\S]*?min-height:\s*44px;/)
  assert.match(styles, /\.music-save-button\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/)
  assert.match(styles, /\.music-control-button\s*\{[\s\S]*?min-height:\s*44px;/)
  assert.match(bandPolish, /\.band-tab-button\s*\{[\s\S]*?min-height:\s*44px;/)
  assert.match(bandPolish, /\.band-week-nav-button\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/)
  assert.match(bandAccount, /\.band-hub-actions button\s*\{[\s\S]*?min-height:\s*44px !important;/)
  assert.match(fortuneStyles, /\.fortune-shell \.soft-button\s*\{[\s\S]*?min-height:\s*44px;/)
})

test('historical source refs replay generation-base lines and reject mismatched quotes', () => {
  const artifact = JSON.parse(read('artifacts/design-reference-audit-v1-emil10-incremental/complete.json'))
  const references = [
    ...artifact.newSkillObservationLedger.observations.flatMap((observation) => observation.sourceRefs || []),
    ...artifact.schedulerApplicability.codeObservations.flatMap((observation) => observation.sourceRefs || []),
  ]
  const currentMismatch = references.find((reference) => {
    const lines = read(reference.path).split(/\r?\n/)
    return !lines.slice(reference.lineStart - 1, reference.lineEnd).join('\n').includes(reference.quote)
  })
  assert.ok(currentMismatch, 'expected at least one descendant line-range mismatch')
  assert.deepEqual(checkHistoricalDesignArtifact(artifact, HISTORICAL_DESIGN_DIRECTORY), [])

  const tampered = structuredClone(artifact)
  const target = tampered.newSkillObservationLedger.observations[0].sourceRefs[0]
  target.quote = 'tampered quote absent from current and generation-base bytes'
  const failures = checkHistoricalDesignArtifact(tampered, HISTORICAL_DESIGN_DIRECTORY)
  assert.ok(failures.some((failure) => failure.startsWith('source_quote_mismatch:')))
})
