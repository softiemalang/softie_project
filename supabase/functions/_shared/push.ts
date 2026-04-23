import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

export type NotificationCategory = 'test' | 'checkin' | 'warning' | 'checkout'
export type SchedulerNotificationType = 'checkin' | 'warning' | 'checkout'

export const SCHEDULER_NOTIFICATION_TYPES: SchedulerNotificationType[] = ['checkin', 'warning', 'checkout']
export const SCHEDULER_NOTIFICATION_LABELS: Record<SchedulerNotificationType, string> = {
  checkin: '입실',
  warning: '퇴실등',
  checkout: '퇴실',
}

export type PushSubscriptionRow = {
  id: string
  device_id: string
  endpoint_hash: string
  subscription: Record<string, unknown>
  notifications_enabled?: boolean
  notification_types?: SchedulerNotificationType[]
}

export type PushPreferencePayload = {
  notificationsEnabled: boolean
  notificationTypes: SchedulerNotificationType[]
}

export type PushSubscriptionPayload = {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
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

export function isSchedulerNotificationType(value: unknown): value is SchedulerNotificationType {
  return typeof value === 'string' && SCHEDULER_NOTIFICATION_TYPES.includes(value as SchedulerNotificationType)
}

export function validatePushPreferencePayload(
  notificationsEnabled: unknown,
  notificationTypes: unknown,
): PushPreferencePayload {
  if (typeof notificationsEnabled !== 'boolean') {
    throw new Error('notificationsEnabled가 필요합니다.')
  }

  if (!Array.isArray(notificationTypes)) {
    throw new Error('notificationTypes가 필요합니다.')
  }

  const uniqueTypes = Array.from(new Set(notificationTypes))
  if (!uniqueTypes.every((value) => isSchedulerNotificationType(value))) {
    throw new Error('notificationTypes에는 checkin, warning, checkout만 사용할 수 있어요.')
  }

  return {
    notificationsEnabled,
    notificationTypes: uniqueTypes as SchedulerNotificationType[],
  }
}

export async function sendWebPush(subscription: Record<string, unknown>, payload: string) {
  configureWebPush()
  return webpush.sendNotification(subscription as never, payload)
}

export function formatReminderTitle({
  notificationType,
  branch,
  room,
  customerName,
  time,
}: {
  notificationType: SchedulerNotificationType
  branch: string
  room: string
  customerName: string
  time: string
}) {
  return [
    SCHEDULER_NOTIFICATION_LABELS[notificationType],
    branch,
    room,
    customerName,
    time,
  ].join(' · ')
}

export function validatePushSubscriptionPayload(subscription: unknown): PushSubscriptionPayload {
  if (!subscription || typeof subscription !== 'object') {
    throw new Error('subscription payload가 필요합니다.')
  }

  const endpoint = Reflect.get(subscription, 'endpoint')
  if (typeof endpoint !== 'string' || !endpoint.trim()) {
    throw new Error('subscription.endpoint가 필요합니다.')
  }

  const keys = Reflect.get(subscription, 'keys')
  if (!keys || typeof keys !== 'object') {
    throw new Error('subscription.keys가 필요합니다.')
  }

  const auth = Reflect.get(keys, 'auth')
  if (typeof auth !== 'string' || !auth.trim()) {
    throw new Error('subscription.keys.auth가 필요합니다.')
  }

  const p256dh = Reflect.get(keys, 'p256dh')
  if (typeof p256dh !== 'string' || !p256dh.trim()) {
    throw new Error('subscription.keys.p256dh가 필요합니다.')
  }

  return {
    endpoint: endpoint.trim(),
    keys: {
      auth: auth.trim(),
      p256dh: p256dh.trim(),
    },
  }
}

export function describePushError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown error',
      details: null,
    }
  }

  if (error && typeof error === 'object') {
    const message = Reflect.get(error, 'message')
    const details = Reflect.get(error, 'details')
    const hint = Reflect.get(error, 'hint')
    const code = Reflect.get(error, 'code')
    const body = Reflect.get(error, 'body')

    const resolvedMessage =
      typeof message === 'string' && message.trim()
        ? message
        : typeof code === 'string' && code.trim()
          ? code
          : 'Unknown error'

    const resolvedDetails = [details, hint, body]
      .map((value) => {
        if (!value) return null
        if (typeof value === 'string') return value
        try {
          return JSON.stringify(value)
        } catch {
          return String(value)
        }
      })
      .filter(Boolean)
      .join(' | ')

    return {
      message: resolvedMessage,
      details: resolvedDetails || null,
    }
  }

  return {
    message: 'Unknown error',
    details: null,
  }
}
