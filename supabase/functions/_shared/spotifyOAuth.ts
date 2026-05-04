export const ALLOWED_RETURN_PATHS = ['/music', '/']

export function normalizeSpotifyReturnPath(requestedPath?: string | null): string {
  if (!requestedPath) return '/music'
  return ALLOWED_RETURN_PATHS.includes(requestedPath) ? requestedPath : '/music'
}

export function createSpotifyOauthStateToken(): string {
  return crypto.randomUUID()
}
