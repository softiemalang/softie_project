import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";
import { createSajuKnowledgeDraft } from "../_shared/saju-knowledge-logic.ts";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const profileId = body?.profileId || null;
    const targetDate = body?.targetDate || null;
    const computedData = body?.computedData || null;
    const providedTags = Array.isArray(body?.tags) ? body.tags : [];
    const mode = body?.mode;
    const section = body?.section;
    const question = body?.question;

    const result = await createSajuKnowledgeDraft({
      mode,
      section,
      profileId,
      targetDate,
      computedData,
      tags: providedTags,
      question
    });

    const { data: insertedRun, error: insertError } = await supabaseAdmin
      .from('saju_knowledge_runs')
      .insert([{
        profile_id: profileId,
        target_date: targetDate,
        source: result.mode === 'draft'
          ? `manual-test:draft:${result.section || 'general'}`
          : 'manual-test:retrieve',
        computed_data: computedData,
        extracted_tags: result.extractedTags,
        retrieval_queries: result.retrievalQueries,
        retrieved_chunks: result.retrievedChunks,
        final_answer: result.answer,
        model_name: result.modelName,
        warning: result.warning,
        status: result.status,
      }])
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        runId: insertedRun?.id || null,
        answer: result.answer,
        extractedTags: result.extractedTags,
        retrievalQueries: result.retrievalQueries,
        retrievedChunks: result.retrievedChunks,
        warning: result.warning,
        mode: result.mode,
        section: result.section,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('saju-knowledge-test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
