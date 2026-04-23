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
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  attempt_count: number
  retry_after: string | null
  reservations: {
    branch: string
    room: string
    customer_name: string
  } | null
  work_events: Array<{
    event_type: SchedulerNotificationType
    scheduled_at: string
  }>
}

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

async function markExpiredPendingReminders(supabase: ReturnType<typeof createServiceRoleClient>, now: Date) {
  const cutoff = toIso(addMinutes(now, -1))
  const { data, error } = await supabase
    .from('push_reminders')
    .update({
      status: 'skipped',
      error_message: 'Reminder window passed before dispatch.',
      updated_at: toIso(now),
    })
    .eq('status', 'pending')
    .lt('scheduled_for', cutoff)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

async function fetchDueReminders(
  supabase: ReturnType<typeof createServiceRoleClient>,
  now: Date,
) {
  const nowIso = toIso(now)
  const windowStartIso = toIso(addMinutes(now, -1))

  const baseSelect = `
    id,
    reservation_id,
    notification_type,
    scheduled_for,
    status,
    attempt_count,
    retry_after,
    reservations!inner(branch, room, customer_name),
    work_events!inner(event_type, scheduled_at)
  `

  const [{ data: pendingRows, error: pendingError }, { data: retryRows, error: retryError }] =
    await Promise.all([
      supabase
        .from('push_reminders')
        .select(baseSelect)
        .eq('status', 'pending')
        .lte('scheduled_for', nowIso)
        .gte('scheduled_for', windowStartIso)
        .order('scheduled_for', { ascending: true }),
      supabase
        .from('push_reminders')
        .select(baseSelect)
        .eq('status', 'failed')
        .eq('attempt_count', 1)
        .not('retry_after', 'is', null)
        .lte('retry_after', nowIso)
        .gte('retry_after', windowStartIso)
        .order('retry_after', { ascending: true }),
    ])

  if (pendingError) throw pendingError
  if (retryError) throw retryError

  return [...(pendingRows ?? []), ...(retryRows ?? [])] as ReminderRow[]
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

    failedStep = 'mark_expired'
    const skippedCount = await markExpiredPendingReminders(supabase, now)

    failedStep = 'fetch_due_reminders'
    const dueReminders = await fetchDueReminders(supabase, now)

    if (dueReminders.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        sent: 0,
        failed: 0,
        skipped: skippedCount,
        processed: 0,
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
      const matchingWorkEvent = reminder.work_events.find((item) => item.event_type === reminder.notification_type)

      if (!matchingWorkEvent || !reminder.reservations) {
        await supabase
          .from('push_reminders')
          .update({
            status: 'failed',
            attempt_count: attemptNumber,
            last_attempt_at: toIso(now),
            retry_after: attemptNumber === 1 ? toIso(addMinutes(now, 1)) : null,
            error_message: 'Reminder context is incomplete.',
          })
          .eq('id', reminder.id)

        failedCount += 1
        continue
      }

      const eligibleSubscriptions = activeSubscriptions.filter((subscription) =>
        Array.isArray(subscription.notification_types)
          && subscription.notification_types.includes(reminder.notification_type)
          && subscription.notifications_enabled !== false
      )

      if (eligibleSubscriptions.length === 0) {
        await supabase
          .from('push_reminders')
          .update({
            status: 'skipped',
            error_message: 'No active subscriptions are enabled for this reminder type.',
            updated_at: toIso(now),
          })
          .eq('id', reminder.id)

        totalSkipped += 1
        continue
      }

      const title = formatReminderTitle({
        notificationType: reminder.notification_type,
        branch: reminder.reservations.branch,
        room: reminder.reservations.room,
        customerName: reminder.reservations.customer_name,
        time: formatDisplayTime(matchingWorkEvent.scheduled_at),
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
        await supabase
          .from('push_reminders')
          .update({
            status: 'sent',
            attempt_count: attemptNumber,
            last_attempt_at: toIso(now),
            retry_after: null,
            sent_at: toIso(now),
            error_message: failureMessages.length ? failureMessages.join('\n') : null,
          })
          .eq('id', reminder.id)

        sentCount += 1
        continue
      }

      await supabase
        .from('push_reminders')
        .update({
          status: 'failed',
          attempt_count: attemptNumber,
          last_attempt_at: toIso(now),
          retry_after: attemptNumber === 1 ? toIso(addMinutes(now, 1)) : null,
          error_message: failureMessages.join('\n') || 'Reminder delivery failed.',
        })
        .eq('id', reminder.id)

      failedCount += 1
    }

    return new Response(JSON.stringify({
      ok: true,
      sent: sentCount,
      failed: failedCount,
      skipped: totalSkipped,
      processed: dueReminders.length,
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
