import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function requireGoogleManualUser(req: Request, bodyUserId?: string) {
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''

  if (!token) {
    throw new AuthError('Missing authorization token')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase auth configuration')
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await authClient.auth.getUser(token)

  if (error || !data.user?.id) {
    throw new AuthError('Invalid authorization token')
  }

  const userId = data.user.id
  if (bodyUserId && bodyUserId !== userId) {
    throw new AuthError('User mismatch')
  }

  return userId
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function authErrorResponse(error: unknown, corsHeaders: Record<string, string>) {
  const message = error instanceof AuthError ? error.message : 'Unauthorized'
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
