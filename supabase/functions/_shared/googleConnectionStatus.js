export function isDisconnectedGoogleTokenError(error) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('not connected')
    || message.includes('no refresh token')
    || message.includes('invalid_grant')
    || message.includes('token has been expired or revoked')
}
