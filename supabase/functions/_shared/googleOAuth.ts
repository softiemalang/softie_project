const ALLOWED_RETURN_PATHS = ['/scheduler', '/fortune', '/softie-fortune', '/rehearsals', '/']
const ALLOWED_RETURN_ORIGINS = [
  'https://softieproject.com',
  'https://project-fp5ie.vercel.app',
  'http://localhost:5173',
]

export function normalizeGoogleReturnPath(requestedPath?: string | null): string {
  if (!requestedPath) return '/scheduler'

  const normalizedPath = requestedPath === '/saju' ? '/fortune' : requestedPath
  return ALLOWED_RETURN_PATHS.includes(normalizedPath) ? normalizedPath : '/scheduler'
}

export function normalizeGoogleReturnOrigin(requestedOrigin?: string | null): string | null {
  if (!requestedOrigin) return null

  try {
    const origin = new URL(requestedOrigin).origin
    return ALLOWED_RETURN_ORIGINS.includes(origin) ? origin : null
  } catch {
    return null
  }
}

export function createGoogleOauthStateToken(): string {
  return crypto.randomUUID()
}
