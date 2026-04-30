/*
 * NOTE: 이 함수는 public/local_key 기반 운세 페이지에서 호출되므로 
 * Supabase Auth 도입 전까지 verify_jwt=false를 유지합니다. 
 * OPENAI_API_KEY는 Edge Function Secret으로 안전하게 관리됩니다.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function compactComputedData(computedData: any = {}) {
  const compactSignals = Array.isArray(computedData?.signals)
    ? computedData.signals.map((signal: any) => ({
        type: signal?.type,
        tenGod: signal?.tenGod,
        element: signal?.element,
      }))
    : []

  const compactBranchRelations = Array.isArray(computedData?.branchRelations)
    ? computedData.branchRelations.map((relation: any) => ({
        target: relation?.target,
        relation: relation?.relation,
        meaning: relation?.meaning,
      }))
    : []

  const fieldKeys = ['work', 'money', 'relationships', 'love', 'health', 'mind']
  const compactFieldImpacts = Object.fromEntries(
    fieldKeys.map((key) => [
      key,
      {
        score: computedData?.fieldImpacts?.[key]?.score ?? null,
        signals: computedData?.fieldImpacts?.[key]?.signals ?? [],
        risks: computedData?.fieldImpacts?.[key]?.risks ?? [],
        adviceType: computedData?.fieldImpacts?.[key]?.adviceType ?? null,
      },
    ]),
  )

  return {
    targetDate: computedData?.targetDate ?? null,
    summary_hint: computedData?.summary_hint ?? null,
    dailyPillar: computedData?.dailyPillar
      ? {
          stem: computedData.dailyPillar.stem,
          branch: computedData.dailyPillar.branch,
        }
      : null,
    signals: compactSignals,
    branchRelations: compactBranchRelations,
    fieldImpacts: compactFieldImpacts,
    love: computedData?.love
      ? {
          score: computedData.love.score,
          keySignals: computedData.love.keySignals ?? [],
          tone: computedData.love.tone,
          summary_hint: computedData.love.summary_hint,
        }
      : null,
    interpretationProfile: computedData?.interpretationProfile
      ? {
          primaryTheme: computedData.interpretationProfile.primaryTheme,
          secondaryTheme: computedData.interpretationProfile.secondaryTheme,
          intensity: computedData.interpretationProfile.intensity,
          dominantSignals: computedData.interpretationProfile.dominantSignals ?? [],
          topOpportunities: computedData.interpretationProfile.topOpportunities ?? [],
          topRisks: computedData.interpretationProfile.topRisks ?? [],
          recommendedNarrative: computedData.interpretationProfile.recommendedNarrative,
          basisHint: computedData.interpretationProfile.basisHint ?? null,
          dailyKeyPoints: computedData.interpretationProfile.dailyKeyPoints ?? [],
          fieldNarratives: computedData.interpretationProfile.fieldNarratives ?? {},
          fieldReasonHints: computedData.interpretationProfile.fieldReasonHints ?? {},
          avoidNarratives: computedData.interpretationProfile.avoidNarratives ?? [],
        }
      : null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { computedData, targetDate } = await req.json()

    // 1. 프롬프트 구성 (콤팩트한 JSON 데이터 활용)
    const systemPrompt = `당신은 사주 결과를 따뜻하고 구체적인 일일 리포트로 다듬는 편집자입니다.
사주 용어, 신비주의, 확정적 예언, 로맨스/금전 확언은 금지합니다.
사용자 화면에는 전문용어를 과하게 드러내지 않되, 입력으로 주어진 일진 흐름, 십성 신호, 충합, 분야별 영향, 관계/연애 힌트를 반드시 근거로 사용하세요.

[작성 가이드]
- headline: 오늘만의 개성이 드러나는 짧은 제목 1문장. 18자 안팎, 담백하고 기억에 남게 작성하세요.
- basis: 오늘 해석의 이유를 사주 전문용어 없이 설명하는 1문장. "왜 이런 흐름인지"가 느껴지게 쓰세요.
- 요약(summary): 최대 2개의 짧은 문장. 차분하고 따뜻한 어조로 오늘의 전반적인 분위기를 설명하되, basis와 자연스럽게 이어지게 작성하세요.
- 각 섹션: 1문장(흐름) + 1문장(실천/태도). 전체 섹션은 2문장씩으로 제한.
- 길이 제한: 각 섹션과 문장은 가급적 70자 이내로 짧게 작성.
- action_tip: 오늘의 핵심 리스크를 완화하는 행동 하나만 50자 이내의 한 문장으로 제안.
- 주의점(cautions): 2개의 짧은 bullet string.
- cautions는 branchRelations, overloads 성격, fieldImpacts.risks를 우선 반영하세요.
- 각 분야별 운세는 fieldImpacts와 branchRelations를 참고해 날짜별 결이 느껴지게 쓰세요. 너무 일반적인 격려문만 쓰지 마세요.
- 금지 사항: REMOVE_EXTRA_CHAR, TODO, placeholder, undefined, null, schema, instruction 등의 제어 텍스트, 마크다운, 코드 블록 절대 포함 금지.

[예시]
- headline: "무리보다 리듬을 지키는 날"
- basis: "오늘은 표현과 정리의 흐름이 함께 들어오지만, 관계 반응이 예민해질 수 있어 속도 조절이 중요해요."
- 요약(summary): "오늘은 주변과 조화를 맞출수록 흐름이 편해지는 날이에요. 서두르기보다 차분히 준비한 만큼 실질적인 성과로 이어지기 쉽습니다."
- 업무: "업무 우선순위가 명확해지며 성과를 내기 좋은 날이에요. 차분히 할 일을 정리하면 마음이 한결 가벼워집니다."
- 금전: "돈의 흐름이 눈에 들어오며 지출을 점검하기 좋은 때예요. 작은 여유가 생기는 곳에 집중해보세요."`;

    const userPrompt = JSON.stringify(
      compactComputedData({
        ...computedData,
        targetDate: targetDate ?? computedData?.targetDate ?? computedData?.target_date ?? null,
      }),
    );

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    let finalResponse;

    const getFallback = (reason, error = null, status = null, body_preview = null) => {
      const debug = {
        fallback_reason: reason,
        error_name: error?.name || null,
        error_message: error?.message || String(error),
        error_stack_preview: String(error?.stack || "").slice(0, 500),
        status: status,
        body_preview: body_preview ? String(body_preview).slice(0, 300) : null,
        timestamp: new Date().toISOString()
      };

      return {
        model: `edge-fallback-${reason}`,
        content: {
          headline: "오늘의 흐름을 차분히 살피는 하루",
          basis: "오늘은 할 일과 관계 흐름이 함께 움직여서, 속도를 조금 늦추며 정리하는 편이 안정적이에요.",
          summary: "오늘은 관계와 선택에서 속도 조절이 필요한 흐름이에요.",
          sections: {
            work: "주어진 업무에 집중하며 내실을 다지는 것이 좋습니다.",
            money: "돈의 흐름을 점검하며 계획적인 소비를 실천해 보세요.",
            relationships: "상대방의 의견을 존중하는 태도가 큰 도움이 됩니다.",
            love: "작은 배려가 관계를 더욱 따뜻하게 만듭니다.",
            health: "규칙적인 생활로 몸의 컨디션을 관리하세요.",
            mind: "긍정적인 마음가짐으로 하루를 시작해보세요."
          },
          cautions: ["서두르는 결정은 실수를 부를 수 있습니다.", "과도한 카페인 섭취를 주의하세요."],
          action_tip: "오늘의 우선순위를 차분히 정리해보세요.",
          debug
        }
      };
    };

    if (openaiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            text: {
              format: {
                type: "json_schema",
                name: "fortune_report",
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["headline", "basis", "summary", "sections", "cautions", "action_tip"],
                  properties: {
                    headline: { type: "string" },
                    basis: { type: "string" },
                    summary: { type: "string" },
                    sections: {
                      type: "object",
                      additionalProperties: false,
                      required: ["work", "money", "relationships", "love", "health", "mind"],
                      properties: {
                        work: { type: "string" },
                        money: { type: "string" },
                        relationships: { type: "string" },
                        love: { type: "string" },
                        health: { type: "string" },
                        mind: { type: "string" }
                      }
                    },
                    cautions: {
                      type: "array",
                      minItems: 2,
                      maxItems: 2,
                      items: { type: "string" }
                    },
                    action_tip: { type: "string" }
                  }
                },
                strict: true
              }
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          finalResponse = getFallback('openai-http-error', null, response.status, errBody);
        } else {
          const result = await response.json();
          let rawText;
          if (typeof result.output_text === 'string') {
            rawText = result.output_text;
          } else if (Array.isArray(result.output)) {
            const content = result.output
              ?.flatMap((item) => item.content ?? [])
              ?.find((c) => c.type === "output_text" || c.text || typeof c === 'string');
            rawText = content?.text ?? (typeof content === 'string' ? content : null);
          }

          try {
            const content = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
            const isForbidden = (str) => typeof str === 'string' && /REMOVE_EXTRA_CHAR|TODO|placeholder|undefined|null|schema|instruction/i.test(str);
            
            const validate = (obj) => {
              if (typeof obj === 'string') {
                if (isForbidden(obj)) throw new Error('Forbidden control text found');
                return true;
              }
              if (Array.isArray(obj)) return obj.every(validate);
              if (typeof obj === 'object' && obj !== null) return Object.values(obj).every(validate);
              return true;
            };

            if (content && content.sections && validate(content)) {
              finalResponse = { model: "gpt-5-mini", content };
            } else {
              throw new Error("Validation failed");
            }
          } catch (pe) {
            finalResponse = getFallback(pe.message === 'Forbidden control text found' ? 'forbidden-control-text' : 'parsing-failed', pe, null, String(rawText).slice(0, 300));
          }
        }
      } catch (e) {
        console.error("OpenAI call failed:", e);
        finalResponse = getFallback('network-error', e);
      }
    } else {
      finalResponse = getFallback('missing-key');
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
