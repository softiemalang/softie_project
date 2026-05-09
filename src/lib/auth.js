import { supabase } from './supabase'

const configuredRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL

function getAuthRedirectUrl() {
  if (typeof window !== 'undefined') {
    return window.location.href || window.location.origin
  }

  return configuredRedirectUrl || 'http://localhost:5173'
}

export async function getCurrentSession() {
  if (!supabase) return null
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) console.error('Error getting session:', error)
  return session
}

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user || null
}

export async function signInWithGoogle(returnUrl = getAuthRedirectUrl()) {
  if (!supabase) return

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: returnUrl,
    }
  })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function subscribeAuthChanges(callback) {
  if (!supabase) return { unsubscribe: () => {} }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })
  return data.subscription
}