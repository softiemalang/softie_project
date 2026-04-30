import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const question = body.question || 'No question provided.';
    const threadId = body.threadId || null;

    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');

    if (!projectId) {
      return new Response(
        JSON.stringify({
          answer: `[Mock Answer] I received your question: "${question}". The Vertex AI Search integration is not fully configured yet.`,
          citations: [],
          threadId: threadId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        answer: "Vertex AI Search integration logic is ready. (Awaiting API configuration)",
        citations: [],
        threadId: threadId || crypto.randomUUID(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
