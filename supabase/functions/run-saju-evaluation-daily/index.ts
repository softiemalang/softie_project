import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { searchEvaluatorSnippets, evaluateReportWithGPT } from "../_shared/saju-evaluator-logic.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const runId = crypto.randomUUID();
  console.log(`[RunSajuEvaluationDaily] Started runId=${runId}`);

  try {
    // Check Authorization secret (Strict check for production)
    const cronSecret = Deno.env.get("SAJU_EVALUATION_CRON_SECRET") || Deno.env.get("EVALUATION_CRON_SECRET");
    if (!cronSecret) {
      console.error(`[RunSajuEvaluationDaily] Security Error: SAJU_EVALUATION_CRON_SECRET is not configured.`);
      return new Response(JSON.stringify({ error: "Internal Server Error: Security configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid cron secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read body parameters (optional)
    let body: any = {};
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch (e) {
        // ignore parse error if empty
      }
    }
    const force = !!body.force;
    let targetDate = body.targetDate;

    if (!targetDate) {
      // Calculate yesterday KST
      const now = new Date();
      const utcMillis = now.getTime();
      const kstMillis = utcMillis + (9 * 60 * 60 * 1000);
      const kstDate = new Date(kstMillis);
      kstDate.setDate(kstDate.getDate() - 1);
      targetDate = kstDate.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    const softieProfileId = Deno.env.get("SOFTIE_SAJU_PROFILE_ID") || null;
    console.log(`[RunSajuEvaluationDaily] targetDate=${targetDate}, force=${force}, softieProfileConfigured=${Boolean(softieProfileId)}`);

    // Init Supabase Service Role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the single most recent candidate report for the target date.
    let reportQuery = supabase
      .from("saju_fortune_reports")
      .select("id, profile_id, report_date, report_content, generated_at, created_at, updated_at")
      .eq("report_date", targetDate)
      .not("report_content", "is", null);

    if (softieProfileId) {
      reportQuery = reportQuery.eq("profile_id", softieProfileId);
    } else {
      console.warn(`[RunSajuEvaluationDaily] SOFTIE_SAJU_PROFILE_ID is missing. Falling back to the latest previous-day report.`);
    }

    const { data: selectedReports, error: fetchError } = await reportQuery
      .order("generated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch reports: ${fetchError.message}`);
    }

    const selectedReport = selectedReports?.[0] || null;
    const selectedTimestamp = selectedReport?.generated_at || selectedReport?.created_at || selectedReport?.updated_at || null;

    if (!selectedReport) {
      console.log(`[RunSajuEvaluationDaily] No report found for targetDate=${targetDate}. softieProfileUsed=${Boolean(softieProfileId)}`);
      return new Response(JSON.stringify({
        runId,
        targetDate,
        softieProfileUsed: Boolean(softieProfileId),
        selectedReportId: null,
        selectedProfileId: softieProfileId,
        selectedReportTimestamp: null,
        foundReports: 0,
        eligibleReports: 0,
        skippedAlreadyEvaluated: 0,
        evaluatedReports: 0,
        savedEvaluations: 0,
        batchCreated: false,
        batchId: null,
        summary: {},
        warnings: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(
      `[RunSajuEvaluationDaily] selectedReportId=${selectedReport.id}, selectedProfileId=${selectedReport.profile_id}, selectedReportTimestamp=${selectedTimestamp}, softieProfileUsed=${Boolean(softieProfileId)}`
    );

    const isEligibleReport = (() => {
      const r = selectedReport;
      const c = r.report_content;
      if (!c || typeof c !== "object") return false;
      if (!c.sections) return false;
      if (!c.headline && !c.summary && !c.action_tip) return false;
      return true;
    })();

    if (!isEligibleReport) {
      console.log(
        `[RunSajuEvaluationDaily] Selected report is not eligible. reportId=${selectedReport.id}, profileId=${selectedReport.profile_id}`
      );
      return new Response(JSON.stringify({
        runId,
        targetDate,
        softieProfileUsed: Boolean(softieProfileId),
        selectedReportId: selectedReport.id,
        selectedProfileId: selectedReport.profile_id,
        selectedReportTimestamp: selectedTimestamp,
        foundReports: 1,
        eligibleReports: 0,
        skippedAlreadyEvaluated: 0,
        evaluatedReports: 0,
        savedEvaluations: 0,
        batchCreated: false,
        batchId: null,
        summary: {},
        warnings: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[RunSajuEvaluationDaily] foundReports=1, eligibleReports=1`);

    let skippedAlreadyEvaluated = 0;
    if (!force) {
      const { data: existingEval, error: evalCheckError } = await supabase
        .from("saju_report_evaluations")
        .select("report_id")
        .eq("report_id", selectedReport.id)
        .maybeSingle();

      if (evalCheckError) {
        throw new Error(`Failed to check existing evaluation: ${evalCheckError.message}`);
      }

      if (existingEval) {
        skippedAlreadyEvaluated = 1;
        console.log(
          `[RunSajuEvaluationDaily] Skipped already evaluated report. reportId=${selectedReport.id}, profileId=${selectedReport.profile_id}`
        );
        return new Response(JSON.stringify({
          runId,
          targetDate,
          softieProfileUsed: Boolean(softieProfileId),
          selectedReportId: selectedReport.id,
          selectedProfileId: selectedReport.profile_id,
          selectedReportTimestamp: selectedTimestamp,
          foundReports: 1,
          eligibleReports: 1,
          skippedAlreadyEvaluated,
          evaluatedReports: 0,
          savedEvaluations: 0,
          batchCreated: false,
          batchId: null,
          summary: {},
          warnings: []
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    console.log(`[RunSajuEvaluationDaily] Pending for evaluation: 1, skipped: ${skippedAlreadyEvaluated}`);

    const warnings: string[] = [];
    let evaluatedReports = 0;
    let savedEvaluations = 0;

    // Search common evaluator snippets once per batch
    const queries = [
      "사주 리포트 품질 평가 메타 문구 누수 확정 예언 공포 표현 금지",
      "relationships love 섹션 경계 평가 기준",
      "health mind 섹션 경계 평가 기준",
      "반복 행동축 정리 확인 속도 낮추기 회복 시간 평가",
      "평가 출력 JSON overallGrade issues repeatAxis codexPrompt"
    ];
    let retrievedChunks: any[] = [];
    try {
      retrievedChunks = await searchEvaluatorSnippets(queries, runId);
    } catch (e: any) {
      console.warn(`[RunSajuEvaluationDaily] Snippet retrieval failed: ${e.message}`);
      warnings.push(`Snippet retrieval failed: ${e.message.slice(0, 100)}`);
    }

    try {
      // Sanitize report content: remove debug object (internal observability) to avoid meta_leak in evaluator
      const { debug, ...sanitizedReportContent } = selectedReport.report_content ?? {};

      const evaluation = await evaluateReportWithGPT(sanitizedReportContent, retrievedChunks);
      evaluatedReports++;

      // Save to saju_report_evaluations
      const modelName = Deno.env.get("OPENAI_FORTUNE_MODEL") || "gpt-5-mini";

      const { error: saveError } = await supabase
        .from("saju_report_evaluations")
        .upsert({
          report_id: selectedReport.id,
          report_date: targetDate,
          overall_grade: evaluation.overallGrade,
          issues: evaluation.issues || [],
          repeat_axis: evaluation.repeatAxis || {},
          codex_prompt: evaluation.codexPrompt || null,
          retrieved_chunks: retrievedChunks,
          warning: null,
          model_name: modelName,
          evaluated_at: new Date().toISOString()
        }, { onConflict: "report_id" });

      if (saveError) {
        console.error(`[RunSajuEvaluationDaily] DB Save failed for report_id=${selectedReport.id}`, saveError.message);
        warnings.push(`DB Save failed for report_id=${selectedReport.id}: ${saveError.message}`);
      } else {
        savedEvaluations++;
      }
    } catch (err: any) {
      console.error(`[RunSajuEvaluationDaily] Evaluation failed for report_id=${selectedReport.id}`, err.message);
      warnings.push(`Eval fail for report_id=${selectedReport.id}: ${err.message.slice(0, 100)}`);
    }

    let batchCreated = false;
    let batchId = null;
    let summaryData: any = {};

    return new Response(JSON.stringify({
      runId,
      targetDate,
      softieProfileUsed: Boolean(softieProfileId),
      selectedReportId: selectedReport.id,
      selectedProfileId: selectedReport.profile_id,
      selectedReportTimestamp: selectedTimestamp,
      foundReports: 1,
      eligibleReports: 1,
      skippedAlreadyEvaluated,
      evaluatedReports,
      savedEvaluations,
      batchCreated,
      batchId,
      summary: summaryData,
      warnings
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    let preview = "";
    try {
      preview = String(error.message).slice(0, 200);
    } catch (e) {}
    console.error(`[RunSajuEvaluationDaily] Fatal error:`, preview);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      warning: preview ? `Daily batch failed: ${preview}` : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
