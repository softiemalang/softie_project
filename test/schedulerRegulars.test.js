import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  applyAutomaticRegularMatch,
  findRegularMatch,
  isValidRegularPhoneLast4,
  normalizeRegularName,
  normalizeRegularPhoneLast4,
  reconcileRegularSelection,
  toggleRegularTag,
} from '../src/scheduler/regularMatching.js'
import {
  buildReservationPayload,
  createReservationDraft,
  mapReservationToFormValues,
  validateReservationForm,
} from '../src/scheduler/helpers.js'

const BASE_FORM = {
  reservationDate: '2026-08-06',
  branch: '신촌점',
  room: 'V',
  customerName: ' 홍 길동 ',
  startTime: '14:00',
  durationHours: 2,
  warningOffsetMinutes: 10,
  tags: [],
  phoneLast4: '',
  regularId: null,
  notesText: '',
}

const REGULAR = {
  id: 'regular-1',
  display_name: '홍길동',
  name_key: '홍길동',
  phone_last4: '0032',
  is_active: true,
}

const migration = await readFile('supabase/migrations/20260806090000_add_scheduler_regulars.sql', 'utf8')

test('regular name and phone normalization is deterministic and preserves leading zeroes', () => {
  assert.equal(normalizeRegularName('  Ｈｏｎｇ\tＧｉｌｄｏｎｇ  '), 'hong gildong')
  assert.equal(normalizeRegularName(' 홍  길동 '), '홍 길동')
  assert.equal(normalizeRegularPhoneLast4('0a03-2'), '0032')
  assert.equal(normalizeRegularPhoneLast4('１２３４'), '')
})

test('phone is optional but only an exact four-digit ASCII value validates', () => {
  assert.equal(isValidRegularPhoneLast4(''), true)
  assert.equal(isValidRegularPhoneLast4('123'), false)
  assert.equal(isValidRegularPhoneLast4('0032'), true)
  assert.equal(isValidRegularPhoneLast4('12a4'), false)
  assert.equal(validateReservationForm({ ...BASE_FORM, phoneLast4: '123' }), '번호는 숫자 4자리로 입력해 주세요.')
  assert.equal(buildReservationPayload({ ...BASE_FORM, phoneLast4: '0032' }).regular_phone_last4, '0032')
  assert.equal(buildReservationPayload(BASE_FORM).regular_phone_last4, null)
})

test('automatic matching requires normalized name and four digits, and ignores inactive or duplicate candidates', () => {
  assert.equal(findRegularMatch([REGULAR], ' 홍길동 ', '0032'), REGULAR)
  assert.equal(findRegularMatch([REGULAR], '홍길동', '0033'), null)
  assert.equal(findRegularMatch([REGULAR], '다른 이름', '0032'), null)
  assert.equal(findRegularMatch([{ ...REGULAR, is_active: false }], '홍길동', '0032'), null)
  assert.equal(findRegularMatch([REGULAR, REGULAR], '홍길동', '0032'), null)
})

test('automatic selection adds the existing regular tag and link only for an exact match', () => {
  const matched = applyAutomaticRegularMatch({ ...BASE_FORM, customerName: '홍길동', phoneLast4: '0032' }, [REGULAR])
  assert.deepEqual(matched.tags, ['other'])
  assert.equal(matched.regularId, 'regular-1')

  const unmatched = applyAutomaticRegularMatch({ ...BASE_FORM, phoneLast4: '0033', tags: ['other'] }, [REGULAR])
  assert.deepEqual(unmatched.tags, [])
  assert.equal(unmatched.regularId, null)
})

test('manual tag selection wins over automatic results and clears the list link', () => {
  const auto = applyAutomaticRegularMatch({ ...BASE_FORM, customerName: '홍길동', phoneLast4: '0032' }, [REGULAR])
  const manuallyCleared = toggleRegularTag(auto)
  assert.deepEqual(manuallyCleared.tags, [])
  assert.equal(manuallyCleared.regularId, null)

  const manualSelected = toggleRegularTag({ ...BASE_FORM, phoneLast4: '0032' })
  assert.deepEqual(manualSelected.tags, ['other'])
  assert.equal(manualSelected.regularId, null)
  assert.equal(buildReservationPayload(manualSelected).regular_id, null)
  assert.equal(reconcileRegularSelection(manualSelected, {
    activeRegulars: [REGULAR],
    lookupStatus: 'ready',
    identityChanged: true,
    manualOverride: true,
  }).regularId, null)
})

test('lookup failure does not erase an existing tag, while a successful re-match can replace it', () => {
  const restored = { ...BASE_FORM, tags: ['other'], regularId: 'old-id', phoneLast4: '9999' }
  const duringFailure = reconcileRegularSelection(restored, {
    activeRegulars: null,
    lookupStatus: 'error',
    identityChanged: true,
    manualOverride: false,
  })
  assert.deepEqual(duringFailure.tags, ['other'])
  assert.equal(duringFailure.regularId, null)

  const matched = reconcileRegularSelection({ ...restored, customerName: '홍길동', phoneLast4: '0032' }, {
    activeRegulars: [REGULAR],
    lookupStatus: 'ready',
    identityChanged: true,
    manualOverride: false,
  })
  assert.deepEqual(matched.tags, ['other'])
  assert.equal(matched.regularId, 'regular-1')
})

test('edit form restores saved number, regular link, and tags before identity changes', () => {
  const restored = mapReservationToFormValues({
    reservation_date: '2026-08-06',
    branch: '신촌점',
    room: 'V',
    customer_name: '홍길동',
    start_at: '2026-08-06T05:00:00.000Z',
    duration_minutes: 120,
    warning_offset_minutes: 10,
    tags: ['other'],
    regular_phone_last4: '0032',
    regular_id: 'regular-1',
    notes_text: '',
  })
  assert.equal(restored.phoneLast4, '0032')
  assert.equal(restored.regularId, 'regular-1')
  assert.deepEqual(restored.tags, ['other'])

  const draft = createReservationDraft('2026-08-06')
  assert.equal(draft.phoneLast4, '')
  assert.equal(buildReservationPayload({ ...BASE_FORM, tags: [] }).regular_id, null)
})

test('migration contract scopes regulars, prevents active duplicates, and safely nulls deleted links', () => {
  assert.match(migration, /create table if not exists public\.scheduler_regulars/)
  assert.match(migration, /phone_last4 text not null check \(phone_last4 ~ '\^\[0-9\]\{4\}\$'/)
  assert.match(migration, /create unique index if not exists scheduler_regulars_active_identity_idx[\s\S]*where is_active/)
  assert.match(migration, /foreign key \(regular_id\)[\s\S]*on delete set null/)
  assert.match(migration, /alter table public\.scheduler_regulars enable row level security/)
  assert.match(migration, /auth\.uid\(\)\)::text = owner_key/)
  assert.doesNotMatch(migration, /is_regular/)
})
