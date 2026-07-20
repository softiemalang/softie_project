export function getGoogleDisconnectReason(error) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('no refresh token')) return 'missing_refresh_token'
  if (message.includes('invalid_grant') || message.includes('token has been expired or revoked')) {
    return 'token_expired_or_revoked'
  }
  if (message.includes('not connected')) return 'missing_token'
  return null
}

export function isDisconnectedGoogleTokenError(error) {
  return getGoogleDisconnectReason(error) !== null
}
