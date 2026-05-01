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
headline와 summary는 서로 역할이 겹치지 않게 쓰세요. headline은 짧고 인상적인 제목, summary는 오늘의 분위기와 조심할 점, 실천 태도를 자연스럽게 담는 문장으로 쓰세요.
문체는 분석 보고서보다 생활 조언에 가깝게 유지하세요. 신호를 그대로 번역한 말투는 피하고, 사용자가 오늘 실제로 느낄 감각으로 풀어 쓰세요.
문장은 부드럽게 쓰되 오늘의 핵심 신호가 흐려지지 않게 하세요. summary와 각 섹션에는 inputs의 흐름이 자연스럽게 남아 있어야 합니다.
문장을 완성한 뒤에는 조사와 연결 표현을 한 번 더 다듬어 자연스러운 한국어인지 확인하세요. "말과 표현은 통해"처럼 어색하게 붙지 않게 하고, "말과 표현을 통해", "말과 표현이 자연스럽게 전해지며"처럼 자연스럽게 고쳐 쓰세요.
의미가 비슷한 단어를 억지로 병렬하지 말고, 한 문장 안에서 자연스럽게 이어지도록 쓰세요. "매력과 소통이 통합니다"보다 "내 마음과 분위기가 자연스럽게 전해지기 쉬워요"처럼 읽히는 문장을 우선하세요.

[작성 가이드]
- headline: 오늘만의 개성이 드러나는 짧은 제목 1문장. 18자 안팎, 담백하고 기억에 남게 작성하세요.
- basis: 해석 근거를 압축한 내부 보조 문장 1문장. 사용자 화면에 따로 설명으로 내보내지 않아도 되는 메모처럼 쓰세요.
- 요약(summary): 최대 2개의 짧은 문장. 1문장은 오늘의 긍정적 흐름이나 중심 분위기, 2문장은 조심할 점과 실천 태도를 담아 자연스럽게 이어지게 작성하세요.
- 각 섹션: 1문장(흐름) + 1문장(실천/태도). 전체 섹션은 2문장씩으로 제한.
- 길이 제한: 각 섹션과 문장은 가급적 70자 이내로 짧게 작성.
- action_tip: 오늘의 핵심 리스크를 완화하는 행동 하나만 50자 이내의 한 문장으로 제안.
- 주의점(cautions): 2개의 짧고 부드러운 주의문. 상태 묘사로 끝내지 말고, 오늘 무엇을 조심할지 또는 어떤 작은 행동을 할지 함께 적으세요.
- cautions는 branchRelations, overloads 성격, fieldImpacts.risks를 우선 반영하세요.
- 각 분야별 운세는 fieldImpacts와 branchRelations를 참고해 날짜별 결이 느껴지게 쓰세요. 너무 일반적인 격려문만 쓰지 마세요.
- summary와 각 섹션은 signals, branchRelations, fieldImpacts, fieldReasonHints 중 적어도 하나의 의미를 자연스럽게 반영하세요. 단, 전문용어를 화면에 직접 쓰지 말고 일상 언어로 풀어 쓰세요.
- 섹션 문장을 단독 자기관리 조언으로 끝내지 말고, 오늘 흐름과 연결된 이유나 감각을 한 번 더 붙이세요.
- 경쟁심, 주관, 감정의 파고, 현상 유지 같은 표현은 그대로 쓰지 말고 일상에서 느낄 말로 풀어 쓰세요.
- 예를 들어 경쟁심은 "내 생각을 지키고 싶은 마음", "괜히 비교하고 싶어지는 마음", "반응이 빨라지는 상태"처럼 바꿔 쓰세요.
- 현상 유지는 "무리한 변화는 줄이기", "지금의 흐름을 안정적으로 지키기"처럼 풀어 쓰세요.
- 감정의 파고는 "올라온 감정", "마음의 출렁임", "잠깐 커진 감정"처럼 부드럽게 쓰세요.
- 점검하고 표현하세요 같은 말은 "한 번 고르고 전해보세요", "바로 꺼내기보다 조금 정리한 뒤 말해보세요"처럼 자연스럽게 쓰세요.
- 매력과 소통이 잘 통합니다 같은 병렬 표현은 피하고, "내 마음과 분위기가 자연스럽게 전해지기 쉬워요"처럼 쓰세요.
- health 섹션은 오늘의 흐름과 연결해 쓰세요. 몸 상태를 일반 건강 앱처럼 분리하지 말고, 에너지의 몰림/분산과 리듬 조절을 함께 보여주세요.
- "규칙적인 식사", "가벼운 스트레칭", "짧은 스트레칭" 같은 표현은 반복 기본값으로 쓰지 마세요. 정말 필요할 때만 쓰되, 오늘의 긴장감·호흡·몸의 무게감·생각 과열·책임감 피로·리듬 회복과 연결해서 적으세요.
- 건강 문장은 "왜 그 행동이 필요한지"가 함께 느껴지게 쓰세요. 단순 습관 안내보다 오늘의 흐름을 조율하는 말투를 우선하세요.
- 너무 분석적인 말투보다 하루를 부드럽게 조율해주는 말투를 우선하세요.
- 지나치게 시적이거나 추상적인 표현은 피하고, 실제 행동으로 이어질 수 있게 작성하세요.
- basis는 summary의 내용을 뒷받침하는 내부 근거로만 쓰고, summary와 같은 말을 반복하지 마세요.
- cautions는 반드시 행동형 한국어 문장으로 쓰세요. 상태 묘사나 명사형으로 끝내지 말고, 오늘 무엇을 어떻게 조절할지 분명히 적으세요. "~할 수 있음", "~할 수 있어요", "~이 생길 수 있음", "~에 주의"로 끝내지 마세요.
- action_tip은 1~3분 안에 할 수 있는 작은 행동을 우선 제안하세요. 오늘의 핵심이 대화나 감정 반응이면 말하기 전에 멈추기, 문장 다시 읽기, 숨 고르기처럼 바로 실행 가능한 행동을 우선 쓰세요. 건강이 핵심일 때만 식사나 스트레칭을 쓰세요.
- action_tip은 오늘의 가장 강한 흐름에 맞춰 쓰세요. mind/recovery면 한 줄 적기나 숨 고르기, communication/relationship이면 답장 다시 읽기나 말하기 전 멈추기, money/work면 우선순위와 지출 확인처럼 구체적으로 제안하세요.
- 금지 사항: REMOVE_EXTRA_CHAR, TODO, placeholder, undefined, null, schema, instruction 등의 제어 텍스트, 마크다운, 코드 블록 절대 포함 금지.

[예시]
- headline: "말은 잘 풀리고, 마음은 천천히"
- basis: "표현과 소통의 흐름은 살아나지만 관계 반응이 예민해질 수 있어 속도 조절이 중요합니다."
- 요약(summary): "오늘은 대화와 표현이 자연스럽게 이어지기 쉬운 날이에요. 다만 내 생각을 지키고 싶은 마음이 강해질 수 있으니, 바로 반응하기보다 한 박자 쉬어가면 하루가 더 편안해집니다."
- 요약(summary): "겉으로는 차분해도 안쪽에서 버티는 힘이 느껴지는 날이에요. 표현과 소통이 자연스럽게 이어지니, 중요한 말은 한 번 고르고 천천히 전해보세요."
- 업무: "업무는 아이디어를 정리해 실행으로 옮기기 좋은 흐름이에요. 한 번에 밀어붙이기보다 우선순위를 나누면 힘이 덜 분산됩니다."
- 금전: "지출 감각이 예민해져서 들어오고 나가는 흐름을 더 잘 볼 수 있어요. 충동적 선택만 조금 줄이면 무난하게 지나가기 좋습니다."
- 관계: "말과 표현이 자연스럽게 전해지며 신뢰를 쌓기 좋은 흐름이에요. 솔직하되 상대의 반응을 살피며 속도를 맞춰보세요."
- 마음: "내면에서 생각을 정리하는 힘이 있어 평온함이 가능해집니다. 감정이 올라오면 바로 붙잡기보다 한 발짝 떨어져 바라보세요."
- 건강: "몸의 긴장이 천천히 쌓일 수 있어 리듬을 무리하게 흔들지 않는 편이 좋아요. 잠깐 어깨 힘을 풀고 숨을 고르며 하루의 속도를 조금 낮춰보세요."
- 주의점: "눈에 잘 드러나지 않는 부담은 쌓이기 전에 잠깐 덜어내세요."
- 주의점: "가까운 관계에서는 바로 반응하기보다 한 번 숨을 고르세요."
- action_tip: "중요한 말은 한 번 더 생각하고 천천히 표현하세요."`;

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
          summary: "오늘은 관계와 선택이 함께 움직이면서 속도 조절이 필요한 날이에요. 바로 반응하기보다 한 번 정리하고 움직이면 실수와 피로를 덜 수 있습니다.",
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
