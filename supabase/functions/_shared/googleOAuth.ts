const ALLOWED_RETURN_PATHS = ['/scheduler', '/fortune', '/rehearsals', '/']

export function normalizeGoogleReturnPath(requestedPath?: string | null): string {
  if (!requestedPath) return '/scheduler'

  const normalizedPath = requestedPath === '/saju' ? '/fortune' : requestedPath
  return ALLOWED_RETURN_PATHS.includes(normalizedPath) ? normalizedPath : '/scheduler'
}

export function createGoogleOauthStateToken(): string {
  return crypto.randomUUID()
}
