function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value : null
}

export function buildGoogleOAuthTokenPayload(tokens, existingToken = null, nowMs = Date.now()) {
  const accessToken = nonEmptyString(tokens?.access_token)
  if (!accessToken) {
    throw new Error('Google token response did not include an access token')
  }

  const refreshToken = nonEmptyString(tokens?.refresh_token)
    || nonEmptyString(existingToken?.refresh_token)
  if (!refreshToken) {
    throw new Error('Google did not return a refresh token. Please reconnect with consent.')
  }

  const expiresIn = Number(tokens?.expires_in)
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('Google token response did not include a valid expiry')
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(nowMs + expiresIn * 1000).toISOString(),
    scope: nonEmptyString(tokens?.scope) || nonEmptyString(existingToken?.scope),
  }
}
