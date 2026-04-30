import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const user = authHeader ? await supabaseAdmin.auth.getUser(authHeader.split(' ')[1]) : null;
    const userId = user?.data?.user?.id || null;
    const ownerKey = userId || 'anonymous-mvp';

    const body = await req.json();
    const question = body.question || 'No question provided.';
    let threadId = body.threadId || null;

    // 1. Create thread if missing
    if (!threadId) {
      const { data: newThread, error: threadErr } = await supabaseAdmin
        .from('project_brain_threads')
        .insert([{ owner_key: ownerKey, user_id: userId, title: question.substring(0, 60) }])
        .select()
        .single();
      
      if (threadErr) throw threadErr;
      threadId = newThread.id;
    }

    // 2. Save user message
    await supabaseAdmin
      .from('project_brain_messages')
      .insert([{ thread_id: threadId, role: 'user', content: question }]);

    // 3. Generate Answer (Mock/Fallback)
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    const answer = projectId 
      ? "Vertex AI Search integration logic is ready. (Awaiting API configuration)"
      : `[Mock Answer] I received your question: "${question}". The Vertex AI Search integration is not fully configured yet.`;

    // 4. Save assistant message
    await supabaseAdmin
      .from('project_brain_messages')
      .insert([{ thread_id: threadId, role: 'assistant', content: answer }]);

    return new Response(
      JSON.stringify({ answer, citations: [], threadId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
