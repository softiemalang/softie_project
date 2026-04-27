import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { computedData, targetDate } = await req.json()

    // 1. 프롬프트 구성 (콤팩트한 JSON 데이터 활용)
    const systemPrompt = `당신은 전문적인 사주 명리학 분석가입니다. 
차분하고 따뜻하며 신뢰감 있는 어조로 오늘의 운세를 작성하세요. 
신비주의적인 미사여구는 지양하고, 일상적이고 실천적인 조언에 집중하세요.
반드시 제공된 JSON 데이터(십성 신호, 오행 점수 등)를 바탕으로 해석해야 합니다.`

    const userPrompt = `다음 사주 분석 데이터를 바탕으로 리포트를 작성하세요:
${JSON.stringify(computedData)}

응답은 반드시 다음 형식을 포함하는 JSON이어야 합니다:
{
  "headline": "한 줄 요약 제목",
  "summary": "종합적인 흐름 요약",
  "sections": {
    "work": "업무/커리어 조언",
    "money": "경제/지출 조언",
    "relationships": "대인관계 조언",
    "love": "연애/애정 조언",
    "health": "건강 관리",
    "mind": "마음가짐"
  },
  "cautions": ["주의점1", "주의점2"],
  "action_tip": "오늘의 실천 팁 한 문장"
}`

    // 2. 실제 LLM API 호출 (OpenAI 예시 - 환경변수 OPENAI_API_KEY 필요)
    // 현재는 로직 흐름 완성을 위해 모크 응답 반환
    // 실제 구현 시 fetch("https://api.openai.com/v1/chat/completions", ...) 사용
    const mockModelResponse = {
      model: "gpt-4o-mini-mock",
      content: {
        headline: `${computedData.summary_hint}의 지혜로운 하루`,
        summary: `오늘은 ${computedData.dailyPillar.stem}${computedData.dailyPillar.branch}의 기운이 강하게 들어오는 날입니다. ${computedData.signals[0].tenGod}의 영향으로 창의적인 아이디어가 샘솟을 수 있습니다.`,
        sections: {
          work: "새로운 프로젝트를 기획하기에 더할 나위 없이 좋은 시기입니다.",
          money: "충동적인 지출보다는 저축과 계획적인 소비가 유리한 날입니다.",
          relationships: "가까운 사람들과의 대화에서 예상치 못한 도움을 받을 수 있습니다.",
          love: "오늘은 감정을 너무 앞세우기보다 자연스러운 대화 속에서 호감을 쌓기 좋은 흐름입니다.",
          health: "가벼운 산책이나 스트레칭으로 몸의 순환을 도와주세요.",
          mind: "스스로에게 관대한 마음을 가질 때 평온함을 유지할 수 있습니다."
        },
        cautions: ["서두르는 결정은 실수를 부를 수 있습니다.", "과도한 카페인 섭취를 주의하세요."],
        action_tip: "따뜻한 차 한 잔과 함께 하루의 우선순위를 정리해보세요."
      }
    }

    return new Response(JSON.stringify(mockModelResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
