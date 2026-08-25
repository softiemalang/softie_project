import assert from 'node:assert/strict'
import test from 'node:test'

import { assertSajuBackupOwnerBinding } from '../supabase/functions/_shared/sajuBackupOwnership.js'

test('Saju daily backup accepts only an exact non-empty profile/token owner binding', () => {
  assert.doesNotThrow(() => assertSajuBackupOwnerBinding({ user_id: 'user-123' }, 'user-123'))
  assert.throws(
    () => assertSajuBackupOwnerBinding({ user_id: 'user-123' }, 'other-user'),
    /does not match Google backup user/,
  )
})

test('Saju daily backup fails closed when either owner identity is missing or malformed', () => {
  for (const [profile, googleBackupUserId] of [
    [null, 'user-123'],
    [{}, 'user-123'],
    [{ user_id: '' }, 'user-123'],
    [{ user_id: 'user-123' }, ''],
    [{ user_id: 'user-123' }, null],
    [{ user_id: 123 }, '123'],
  ]) {
    assert.throws(
      () => assertSajuBackupOwnerBinding(profile, googleBackupUserId),
      /does not match Google backup user/,
    )
  }
})
