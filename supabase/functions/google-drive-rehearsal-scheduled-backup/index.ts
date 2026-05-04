import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { backupUserRehearsalEvents } from '../_shared/rehearsalBackup.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Optional: Validate cron secret if passed via header
    const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
    if (cronSecret) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
      }
    }

    // Find all users who have Google tokens (meaning they have connected)
    const { data: tokens, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('user_id')

    if (tokenError) throw new Error(`Failed to fetch users: ${tokenError.message}`)

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No users found with Google connection' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get current month in Asia/Seoul (YYYY-MM)
    const now = new Date()
    const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const yearMonth = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}`

    const results = []
    for (const token of tokens) {
      const userId = token.user_id
      try {
        const result = await backupUserRehearsalEvents(supabase, userId, yearMonth)
        results.push({ userId, status: 'success', ...result })
      } catch (err) {
        console.error(`Failed to backup for user ${userId}:`, err)
        results.push({ userId, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, yearMonth, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[google-drive-rehearsal-scheduled-backup]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
