import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const profileId = Deno.env.get('SOFTIE_SAJU_PROFILE_ID')

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'Softie profile is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('saju_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Softie profile was not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ profile: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('get-softie-saju-profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to load Softie profile.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
