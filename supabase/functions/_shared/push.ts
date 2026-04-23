import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

export type NotificationCategory = 'test' | 'checkin' | 'warning' | 'checkout'

export type PushSubscriptionRow = {
  id: string
  device_id: string
  endpoint_hash: string
  subscription: Record<string, unknown>
}

export function createServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function hashEndpoint(endpoint: string) {
  const encoded = new TextEncoder().encode(endpoint)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function configureWebPush() {
  const subject = Deno.env.get('WEB_PUSH_SUBJECT')
  const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
  const privateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')

  if (!subject || !publicKey || !privateKey) {
    throw new Error('WEB_PUSH_SUBJECT / WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY 설정이 필요합니다.')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export function buildPushPayload({
  type,
  title,
  body,
  url = '/scheduler',
  tag,
}: {
  type: NotificationCategory
  title: string
  body: string
  url?: string
  tag?: string
}) {
  return JSON.stringify({
    type,
    title,
    body,
    url,
    tag: tag || `scheduler-${type}`,
  })
}

export async function sendWebPush(subscription: Record<string, unknown>, payload: string) {
  configureWebPush()
  return webpush.sendNotification(subscription as never, payload)
}
