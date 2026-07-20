import assert from 'node:assert/strict'
import test from 'node:test'
import { buildGoogleOAuthTokenPayload } from '../../supabase/functions/_shared/googleOAuthTokens.js'

const NOW = Date.UTC(2026, 6, 21, 0, 0, 0)

test('Google reconnect preserves the stored refresh token when the exchange omits it', () => {
  const payload = buildGoogleOAuthTokenPayload({
    access_token: 'new-access-token',
    expires_in: 3600,
    scope: 'calendar drive',
  }, {
    refresh_token: 'stored-refresh-token',
  }, NOW)

  assert.equal(payload.refresh_token, 'stored-refresh-token')
  assert.equal(payload.expires_at, '2026-07-21T01:00:00.000Z')
})

test('Google reconnect stores a newly rotated refresh token', () => {
  const payload = buildGoogleOAuthTokenPayload({
    access_token: 'new-access-token',
    refresh_token: 'rotated-refresh-token',
    expires_in: 3600,
  }, {
    refresh_token: 'stored-refresh-token',
    scope: 'calendar',
  }, NOW)

  assert.equal(payload.refresh_token, 'rotated-refresh-token')
  assert.equal(payload.scope, 'calendar')
})

test('first Google connection fails safely when no refresh token is returned', () => {
  assert.throws(() => buildGoogleOAuthTokenPayload({
    access_token: 'new-access-token',
    expires_in: 3600,
  }, null, NOW), /did not return a refresh token/)
})

test('invalid Google token responses are rejected before storage', () => {
  assert.throws(() => buildGoogleOAuthTokenPayload({
    refresh_token: 'refresh-token',
    expires_in: 3600,
  }, null, NOW), /access token/)

  assert.throws(() => buildGoogleOAuthTokenPayload({
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 0,
  }, null, NOW), /valid expiry/)
})
