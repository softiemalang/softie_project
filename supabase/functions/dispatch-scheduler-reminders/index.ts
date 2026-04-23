import { corsHeaders } from '../_shared/cors.ts'
import {
  buildPushPayload,
  createServiceRoleClient,
  describePushError,
  formatReminderTitle,
  sendWebPush,
  type PushSubscriptionRow,
  type SchedulerNotificationType,
} from '../_shared/push.ts'

type ReminderRow = {
  id: string
  reservation_id: string
  notification_type: SchedulerNotificationType
  scheduled_for: string
  status: 'pending' | 'retry_pending' | 'sent' | 'failed' | 'skipped'
  attempt_count: number
  retry_after: string | null
  branch: string
  room: string
  customer_name: string
  event_scheduled_at: string
}

const ACTIVE_WINDOW_START_MINUTE = 44
const ACTIVE_WINDOW_END_MINUTE = 56
const CLAIM_LIMIT = 50

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDisplayTime(input: string) {
  const date = new Date(input)
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`
}

function toIso(input: Date) {
  return input.toISOString()
}

function addMinutes(input: Date, minutes: number) {
  return new Date(input.getTime() + minutes * 60 * 1000)
}

function getWindowStart(now: Date) {
  const windowStart = new Date(now)
  windowStart.setUTCMinutes(ACTIVE_WINDOW_START_MINUTE, 0, 0)
  return windowStart
}

function isActiveScanWindow(now: Date) {
  const minute = now.getUTCMinutes()
  return minute >= ACTIVE_WINDOW_START_MINUTE && minute <= ACTIVE_WINDOW_END_MINUTE
}

async function markStaleReminders(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: Date,
  windowStart: Date,
) {
  const nowIso = toIso(now)
  const windowStartIso = toIso(windowStart)

  const [{ data: stalePending, error: pendingError }, { data: staleRetry, error: retryError }] =
    await Promise.all([
      supabase
        .from('push_reminders')
        .update({
          status: 'skipped',
          error_message: 'Reminder window passed before dispatch.',
          claimed_at: null,
          claim_token: null,
          updated_at: nowIso,
        })
        .eq('status', 'pending')
        .lt('scheduled_for', windowStartIso)
        .select('id'),
      supabase
        .from('push_reminders')
        .update({
          status: 'skipped',
          error_message: 'Retry window passed before dispatch.',
          claimed_at: null,
          claim_token: null,
          updated_at: nowIso,
        })
        .eq('status', 'retry_pending')
        .not('retry_after', 'is', null)
        .lt('retry_after', windowStartIso)
        .select('id'),
    ])

  if (pendingError) throw pendingError
  if (retryError) throw retryError

  return (stalePending?.length ?? 0) + (staleRetry?.length ?? 0)
}

async function claimDueReminders(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: Date,
  windowStart: Date,
  claimToken: string,
) {
  const { data, error } = await supabase.rpc('claim_due_push_reminders', {
    p_now: toIso(now),
    p_window_start: toIso(windowStart),
    p_claim_token: claimToken,
    p_limit: CLAIM_LIMIT,
  })

  if (error) throw error
  return (data ?? []) as ReminderRow[]
}

async function fetchTargetSubscriptions(
  supabase: ReturnType<typeof createServiceRoleClient>,
) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, device_id, endpoint_hash, subscription, notifications_enabled, notification_types')
    .eq('active', true)
    .eq('notifications_enabled', true)

  if (error) throw error
  return (data ?? []) as PushSubscriptionRow[]
}

async function markSubscriptionError(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscriptionId: string,
  message: string,
  deactivate = false,
) {
  await supabase
    .from('push_subscriptions')
    .update({
      active: deactivate ? false : true,
      last_error_at: new Date().toISOString(),
      last_error_message: message,
    })
    .eq('id', subscriptionId)
}

async function clearSubscriptionError(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscriptionId: string,
) {
  await supabase
    .from('push_subscriptions')
    .update({
      last_error_at: null,
      last_error_message: null,
    })
    .eq('id', subscriptionId)
}

async function updateReminderState(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reminderId: string,
  claimToken: string,
  values: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('push_reminders')
    .update(values)
    .eq('id', reminderId)
    .eq('claim_token', claimToken)

  if (error) throw error
}

Deno.serve(async (request) => {
  let failedStep = 'request'

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    failedStep = 'create_service_client'
    const supabase = createServiceRoleClient()
    const now = new Date()

    if (!isActiveScanWindow(now)) {
      return new Response(JSON.stringify({
        ok: true,
        idle: true,
        reason: 'outside_active_window',
        activeWindowMinutes: [ACTIVE_WINDOW_START_MINUTE, ACTIVE_WINDOW_END_MINUTE],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const windowStart = getWindowStart(now)
    const claimToken = crypto.randomUUID()

    failedStep = 'skip_stale'
    const skippedCount = await markStaleReminders(supabase, now, windowStart)

    failedStep = 'claim_due_reminders'
    const dueReminders = await claimDueReminders(supabase, now, windowStart, claimToken)

    if (dueReminders.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        sent: 0,
        failed: 0,
        skipped: skippedCount,
        processed: 0,
        activeWindowMinutes: [ACTIVE_WINDOW_START_MINUTE, ACTIVE_WINDOW_END_MINUTE],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    failedStep = 'fetch_target_subscriptions'
    const activeSubscriptions = await fetchTargetSubscriptions(supabase)

    let sentCount = 0
    let failedCount = 0
    let totalSkipped = skippedCount

    for (const reminder of dueReminders) {
      const attemptNumber = reminder.attempt_count + 1

      if (!reminder.branch || !reminder.room || !reminder.customer_name || !reminder.event_scheduled_at) {
        await updateReminderState(supabase, reminder.id, claimToken, {
          status: 'skipped',
          error_message: 'Reminder context is incomplete.',
          claimed_at: null,
          claim_token: null,
          updated_at: toIso(now),
        })
        totalSkipped += 1
        continue
      }

      const eligibleSubscriptions = activeSubscriptions.filter((subscription) =>
        Array.isArray(subscription.notification_types)
          && subscription.notification_types.includes(reminder.notification_type)
          && subscription.notifications_enabled !== false
      )

      if (eligibleSubscriptions.length === 0) {
        await updateReminderState(supabase, reminder.id, claimToken, {
          status: 'skipped',
          error_message: 'No active subscriptions are enabled for this reminder type.',
          claimed_at: null,
          claim_token: null,
          updated_at: toIso(now),
        })
        totalSkipped += 1
        continue
      }

      const title = formatReminderTitle({
        notificationType: reminder.notification_type,
        branch: reminder.branch,
        room: reminder.room,
        customerName: reminder.customer_name,
        time: formatDisplayTime(reminder.event_scheduled_at),
      })

      const payload = buildPushPayload({
        type: reminder.notification_type,
        title,
        body: '',
        url: '/scheduler',
        tag: `scheduler-${reminder.notification_type}-${reminder.reservation_id}`,
      })

      const failureMessages: string[] = []
      let deliveredCount = 0

      for (const subscription of eligibleSubscriptions) {
        try {
          failedStep = 'send_web_push'
          await sendWebPush(subscription.subscription as Record<string, unknown>, payload)
          deliveredCount += 1
          await clearSubscriptionError(supabase, subscription.id)
        } catch (error) {
          const { message, details } = describePushError(error)
          const statusCode = error && typeof error === 'object' ? Reflect.get(error, 'statusCode') : undefined
          const combined = [message, details].filter(Boolean).join(' | ')
          const deactivate = statusCode === 404 || statusCode === 410

          await markSubscriptionError(supabase, subscription.id, combined || message, deactivate)
          failureMessages.push(`${subscription.device_id}: ${combined || message}`)
        }
      }

      if (deliveredCount > 0) {
        await updateReminderState(supabase, reminder.id, claimToken, {
          status: 'sent',
          attempt_count: attemptNumber,
          last_attempt_at: toIso(now),
          retry_after: null,
          sent_at: toIso(now),
          error_message: failureMessages.length ? failureMessages.join('\n') : null,
          claimed_at: null,
          claim_token: null,
          updated_at: toIso(now),
        })
        sentCount += 1
        continue
      }

      const shouldRetry = attemptNumber === 1

      await updateReminderState(supabase, reminder.id, claimToken, {
        status: shouldRetry ? 'retry_pending' : 'failed',
        attempt_count: attemptNumber,
        last_attempt_at: toIso(now),
        retry_after: shouldRetry ? toIso(addMinutes(now, 1)) : null,
        error_message: failureMessages.join('\n') || 'Reminder delivery failed.',
        claimed_at: null,
        claim_token: null,
        updated_at: toIso(now),
      })

      failedCount += 1
    }

    return new Response(JSON.stringify({
      ok: true,
      sent: sentCount,
      failed: failedCount,
      skipped: totalSkipped,
      processed: dueReminders.length,
      activeWindowMinutes: [ACTIVE_WINDOW_START_MINUTE, ACTIVE_WINDOW_END_MINUTE],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { message, details } = describePushError(error)

    console.error('dispatch-scheduler-reminders failed', {
      step: failedStep,
      message,
      details,
    })

    return new Response(JSON.stringify({
      error: message,
      step: failedStep,
      details,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
