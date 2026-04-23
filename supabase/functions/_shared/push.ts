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

const SCHEDULER_TIMEZONE = 'Asia/Seoul'

export type PushSubscriptionRow = {
  id: string
  device_id: string
  endpoint_hash: string
  subscription: Record<string, unknown>
  notifications_enabled?: boolean
  notification_types?: SchedulerNotificationType[]
  work_time_enabled?: boolean
  work_time_start_hour?: number | null
  work_time_end_hour?: number | null
}

export type PushPreferencePayload = {
  notificationsEnabled: boolean
  notificationTypes: SchedulerNotificationType[]
  workTimeEnabled: boolean
  workTimeStartHour: number | null
  workTimeEndHour: number | null
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

function toSafeHour(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) {
    throw new Error('근무 시간은 0시부터 23시 사이여야 해요.')
  }
  return parsed
}

export function validatePushPreferencePayload(
  notificationsEnabled: unknown,
  notificationTypes: unknown,
  workTimeEnabled: unknown,
  workTimeStartHour: unknown,
  workTimeEndHour: unknown,
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

  if (typeof workTimeEnabled !== 'boolean') {
    throw new Error('workTimeEnabled가 필요합니다.')
  }

  const normalizedStartHour = toSafeHour(workTimeStartHour)
  const normalizedEndHour = toSafeHour(workTimeEndHour)

  if (workTimeEnabled && (normalizedStartHour === null || normalizedEndHour === null)) {
    throw new Error('근무 시간 시작/종료 시각이 필요합니다.')
  }

  if (
    workTimeEnabled
    && normalizedStartHour !== null
    && normalizedEndHour !== null
    && normalizedEndHour < normalizedStartHour
  ) {
    throw new Error('근무 시간 종료 시각은 시작 시각보다 빠를 수 없어요.')
  }

  return {
    notificationsEnabled,
    notificationTypes: uniqueTypes as SchedulerNotificationType[],
    workTimeEnabled,
    workTimeStartHour: workTimeEnabled ? normalizedStartHour : null,
    workTimeEndHour: workTimeEnabled ? normalizedEndHour : null,
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

export function getSchedulerLocalHour(input: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SCHEDULER_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  })

  return Number(formatter.format(new Date(input)))
}

export function formatSchedulerLocalTime(input: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SCHEDULER_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return formatter.format(new Date(input))
}

export function isWorkTimeEligible(
  subscription: {
    work_time_enabled?: boolean
    work_time_start_hour?: number | null
    work_time_end_hour?: number | null
  },
  eventScheduledAt: string,
) {
  if (!subscription.work_time_enabled) return true
  if (subscription.work_time_start_hour === null || subscription.work_time_start_hour === undefined) return false
  if (subscription.work_time_end_hour === null || subscription.work_time_end_hour === undefined) return false

  const scheduledHour = getSchedulerLocalHour(eventScheduledAt)
  return scheduledHour >= subscription.work_time_start_hour && scheduledHour <= subscription.work_time_end_hour
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
