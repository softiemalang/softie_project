import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { searchEvaluatorSnippets, evaluateReportWithGPT } from "../_shared/saju-evaluator-logic.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const runId = crypto.randomUUID();
  console.log(`[SajuEvaluator] Started runId=${runId}`);

  try {
    const body = await req.json();
    const { reportContent, targetDate } = body;

    if (!reportContent) {
      console.warn(`[SajuEvaluator] Bad Request: Missing reportContent`);
      return new Response(JSON.stringify({ error: "reportContent is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const queries = [
      "사주 리포트 품질 평가 메타 문구 누수 확정 예언 공포 표현 금지",
      "relationships love 섹션 경계 평가 기준",
      "health mind 섹션 경계 평가 기준",
      "반복 행동축 정리 확인 속도 낮추기 회복 시간 평가",
      "평가 출력 JSON overallGrade issues repeatAxis codexPrompt"
    ];

    let retrievedChunks: any[] = [];
    let warning: string | null = null;

    try {
      retrievedChunks = await searchEvaluatorSnippets(queries);
      console.log(`[SajuEvaluator] Retrieved chunks=${retrievedChunks.length}`);
    } catch (err: any) {
      console.error(`[SajuEvaluator] Search failed:`, err.message);
      warning = "Evaluator retrieval failed; evaluated from reportContent only.";
    }

    let evaluation;
    try {
      evaluation = await evaluateReportWithGPT(reportContent, retrievedChunks);
      console.log(`[SajuEvaluator] Finished grade=${evaluation.overallGrade}`);
    } catch (err: any) {
      console.error(`[SajuEvaluator] GPT Evaluation failed:`, err.message);
      // fallback handled by returning 500
      throw err;
    }

    return new Response(JSON.stringify({
      runId,
      evaluation,
      retrievedChunks,
      warning
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    let preview = "";
    try {
      // attempt to safe-log some of the error without leaking sensitive PII
      preview = String(error.message).slice(0, 200);
    } catch (e) {
      // ignore
    }
    console.error(`[SajuEvaluator] Unhandled error:`, preview);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      warning: preview ? `Evaluation failed: ${preview}` : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
