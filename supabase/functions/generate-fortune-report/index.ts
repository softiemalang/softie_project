import { createSajuKnowledgeDraft } from "../_shared/saju-knowledge-logic.ts";

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

const SECTION_KEYS = ['work', 'money', 'relationships', 'love', 'health', 'mind'] as const
const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const REPEAT_AXIS_PATTERNS: Record<string, string[]> = {
  organize: ['정리', '다시 잡', '우선순위', '줄여'],
  confirm: ['확인', '다시 읽', '살펴', '점검'],
  slowDown: ['속도', '천천히', '한 박자', '바로'],
  recovery: ['회복', '쉬', '덜어', '자극'],
  boundaryRole: ['경계', '역할', '몫', '도움 범위'],
  emotionExpectation: ['호감', '기대', '확답', '감정 속도', '안부'],
  bodySense: ['몸', '긴장', '호흡', '리듬', '무게감'],
  innerOrganizing: ['생각', '이름', '기준', '내면', '적어'],
}

function sanitizePreview(value: unknown, maxLength = 80) {
  if (typeof value !== 'string') return null
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createGoogleAccessToken(serviceAccountEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountEmail,
    scope: GOOGLE_OAUTH_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedJwt = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedJwt)
  );
  const signedJwt = `${unsignedJwt}.${base64UrlEncode(new Uint8Array(signature))}`;

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const preview = (await tokenResponse.text()).slice(0, 500);
    console.error('Google OAuth token request failed', {
      status: tokenResponse.status,
      preview,
    });
    throw new Error('Failed to create Google OAuth token.');
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error('Google OAuth token response did not include an access token.');
  }

  return tokenData.access_token as string;
}

function shortenErrorMessage(value: unknown, maxLength = 120) {
  const text = typeof value === 'string'
    ? value
    : value instanceof Error
      ? value.message
      : String(value ?? 'Unknown error')
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function analyzeRepeatAxes(sections: Record<string, unknown> | null | undefined) {
  if (!sections || typeof sections !== 'object') return {}

  const summary = Object.fromEntries(
    Object.keys(REPEAT_AXIS_PATTERNS).map((axis) => [axis, { count: 0, sections: [] as string[] }]),
  ) as Record<string, { count: number; sections: string[] }>

  for (const section of SECTION_KEYS) {
    const text = typeof sections[section] === 'string' ? sections[section] : ''
    if (!text) continue

    for (const [axis, patterns] of Object.entries(REPEAT_AXIS_PATTERNS)) {
      if (patterns.some((pattern) => text.includes(pattern))) {
        summary[axis].count += 1
        summary[axis].sections.push(section)
      }
    }
  }

  return Object.fromEntries(
    Object.entries(summary).filter(([, value]) => value.count > 0),
  )
}

function formatRepeatAxisLog(summary: Record<string, { count: number; sections: string[] }>) {
  const parts = Object.entries(summary).map(
    ([axis, value]) => `${axis}=${value.count}(${value.sections.join(',')})`,
  )
  return parts.join(', ')
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
          periodContextHints: computedData.interpretationProfile.periodContextHints ?? [],
          personalContextHints: computedData.interpretationProfile.personalContextHints ?? [],
          natalProfileSummary: computedData.interpretationProfile.natalProfileSummary
            ? {
                baselineTemperament:
                  computedData.interpretationProfile.natalProfileSummary.baselineTemperament?.slice(0, 2) ?? [],
                recoveryKeys:
                  computedData.interpretationProfile.natalProfileSummary.recoveryKeys?.slice(0, 2) ?? [],
                healthCareKeys:
                  computedData.interpretationProfile.natalProfileSummary.healthCareKeys?.slice(0, 2) ?? [],
                stressTriggers:
                  computedData.interpretationProfile.natalProfileSummary.stressTriggers?.slice(0, 2) ?? [],
                relationshipStyle:
                  computedData.interpretationProfile.natalProfileSummary.relationshipStyle?.slice(0, 2) ?? [],
                workStyle:
                  computedData.interpretationProfile.natalProfileSummary.workStyle?.slice(0, 2) ?? [],
                moneyStyle:
                  computedData.interpretationProfile.natalProfileSummary.moneyStyle?.slice(0, 2) ?? [],
              }
            : null,
          avoidNarratives: computedData.interpretationProfile.avoidNarratives ?? [],
        }
      : null,
  }
}

function compactPersonalContext(personalContext: any = null) {
  if (!personalContext || typeof personalContext !== 'object') return null

  return {
    source: typeof personalContext.source === 'string' ? personalContext.source.slice(0, 80) : null,
    mode: typeof personalContext.mode === 'string' ? personalContext.mode.slice(0, 40) : null,
    usageRule: typeof personalContext.usageRule === 'string' ? personalContext.usageRule.slice(0, 180) : null,
    compactHints: Array.isArray(personalContext.compactHints)
      ? personalContext.compactHints
          .filter((hint: unknown) => typeof hint === 'string')
          .map((hint: string) => hint.replace(/\s+/g, ' ').trim().slice(0, 140))
          .filter(Boolean)
          .slice(0, 6)
      : [],
    toneHints: Array.isArray(personalContext.toneHints)
      ? personalContext.toneHints
          .filter((hint: unknown) => typeof hint === 'string')
          .map((hint: string) => hint.replace(/\s+/g, ' ').trim().slice(0, 90))
          .filter(Boolean)
          .slice(0, 3)
      : [],
    avoidTone: Array.isArray(personalContext.avoidTone)
      ? personalContext.avoidTone
          .filter((hint: unknown) => typeof hint === 'string')
          .map((hint: string) => hint.replace(/\s+/g, ' ').trim().slice(0, 90))
          .filter(Boolean)
          .slice(0, 4)
      : [],
    dailyReportRules: Array.isArray(personalContext.dailyReportRules)
      ? personalContext.dailyReportRules
          .filter((hint: unknown) => typeof hint === 'string')
          .map((hint: string) => hint.replace(/\s+/g, ' ').trim().slice(0, 120))
          .filter(Boolean)
          .slice(0, 4)
      : []
  }
}

function normalizeText(value: unknown, maxLength = 140) {
  if (typeof value !== 'string') return null
  const normalized = value
    .replace(/\s+/g, ' ')
    .replace(/[•▪◦●·]+/g, ' ')
    .trim()
    .slice(0, maxLength)
  return normalized || null
}

function containsBirthDetail(text: string) {
  return (
    /\b(19|20)\d{2}[-./년]\s?\d{1,2}[-./월]\s?\d{1,2}/.test(text) ||
    /\b\d{1,2}:\d{2}\b/.test(text) ||
    /(생년월일|출생|태어난 시간|birth|birthday|birth date|birth time)/i.test(text)
  )
}

function similarityKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupePersonalReferenceLines(lines: string[]) {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const line of lines) {
    const key = similarityKey(line)
    if (!key || seen.has(key)) continue
    seen.add(key)
    deduped.push(line)
  }

  return deduped
}

function compactRetrievedPersonalChunks(rawValues: unknown[]) {
  const compacted = rawValues
    .map((value) => normalizeText(value, 140))
    .filter((value): value is string => Boolean(value))
    .filter((value) => !containsBirthDetail(value))

  return dedupePersonalReferenceLines(compacted).slice(0, 5)
}

function buildSoftiePersonalQueries(computedData: any = {}, personalContext: any = null) {
  const primarySections = Array.isArray(computedData?.sectionPriority?.primary)
    ? computedData.sectionPriority.primary
    : []
  const recoveryLevel = String(computedData?.dailyBalance?.recoveryLevel || '').toLowerCase()
  const queries = ['오늘의 운세 작성 기준 softie fortune']

  if (primarySections.includes('relationships') || primarySections.includes('love')) {
    queries.push('관계 기준 말의 온도 안정감 부담감')
  }
  if (primarySections.includes('money')) {
    queries.push('돈 기반감 숨통 남는 부담')
  }
  if (primarySections.includes('work')) {
    queries.push('FOH 직업운 환경 적합도 재량 조율')
  }
  if (primarySections.includes('health') || recoveryLevel === 'high') {
    queries.push('건강 회복 루틴 몸의 무게감 긴장 회복 시간')
  }
  if (queries.length === 1) {
    queries.push('원국 고정축 압 체감형 계수 금수 보완')
  }

  const fallbackHint = typeof personalContext?.compactHints?.[0] === 'string'
    ? normalizeText(personalContext.compactHints[0], 100)
    : null
  if (queries.length < 3 && fallbackHint) {
    queries.push(`softie 개인 해석 기준 ${fallbackHint}`)
  }

  return dedupePersonalReferenceLines(queries.map((query) => normalizeText(query, 120)).filter((value): value is string => Boolean(value))).slice(0, 4)
}

function extractPersonalReferenceSnippets(payload: any) {
  const candidates: unknown[] = [
    ...(Array.isArray(payload?.answer?.citations) ? payload.answer.citations.flatMap((citation: any) => [
      citation?.source?.content,
      citation?.source?.snippet,
      citation?.source?.title,
    ]) : []),
    ...(Array.isArray(payload?.searchResults) ? payload.searchResults.flatMap((result: any) => [
      result?.document?.derivedStructData?.snippets?.join(' '),
      result?.document?.derivedStructData?.extractive_answers?.map((item: any) => item?.content)?.join(' '),
      result?.document?.derivedStructData?.extractive_segments?.map((item: any) => item?.content)?.join(' '),
      result?.document?.derivedStructData?.link,
      result?.document?.structData?.content,
      result?.document?.content,
      result?.snippet,
      result?.chunk?.content,
      result?.chunkInfo?.content,
    ]) : []),
    payload?.answer?.answerText,
    payload?.answerText,
  ]

  return compactRetrievedPersonalChunks(candidates)
}

async function callSoftiePersonalSearch(query: string) {
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')
  const location = Deno.env.get('GOOGLE_CLOUD_LOCATION') || 'global'
  const appId = Deno.env.get('SOFTIE_PERSONAL_SEARCH_APP_ID')
  const servingConfig = 'default_search'
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n')

  if (!projectId || !appId || !serviceAccountEmail || !privateKey) {
    throw new Error('missing-config')
  }

  const accessToken = await createGoogleAccessToken(serviceAccountEmail, privateKey)
  const endpoint = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${location}/collections/default_collection/engines/${appId}/servingConfigs/${servingConfig}:answer`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        text: query,
      },
      answerGenerationSpec: {
        includeCitations: true,
      },
    }),
  })

  if (!response.ok) {
    const preview = (await response.text()).slice(0, 1000)
    console.warn('Softie personal Vertex request failed', {
      status: response.status,
      preview,
    })
    throw new Error(`request-failed:${response.status}`)
  }

  return await response.json()
}

async function createSoftiePersonalReferenceDraft(args: {
  computedData?: any;
  targetDate?: string | null;
  personalContext?: any;
}) {
  const ragEnabled = Deno.env.get('SOFTIE_PERSONAL_RAG_ENABLED') === 'true'
  const searchAppId = Deno.env.get('SOFTIE_PERSONAL_SEARCH_APP_ID')
  const searchDatastoreId = Deno.env.get('SOFTIE_PERSONAL_SEARCH_DATASTORE_ID')

  if (!ragEnabled) {
    console.log('[SoftiePersonalRAG] disabled: feature flag off')
    return { enabled: false, success: false, reason: 'disabled', queryCount: 0, snippets: [] }
  }

  if (args.personalContext?.mode !== 'softie-fortune') {
    return { enabled: false, success: false, reason: 'not-softie-mode', queryCount: 0, snippets: [] }
  }

  if (!Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || !searchAppId) {
    console.log('[SoftiePersonalRAG] disabled: missing config', {
      hasProjectId: Boolean(Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')),
      hasSearchAppId: Boolean(searchAppId),
      hasSearchDatastoreId: Boolean(searchDatastoreId),
    })
    return { enabled: false, success: false, reason: 'missing-config', queryCount: 0, snippets: [] }
  }

  const queries = buildSoftiePersonalQueries(args.computedData || {}, args.personalContext)
  if (queries.length === 0) {
    return { enabled: true, success: false, reason: 'no-queries', queryCount: 0, snippets: [] }
  }

  try {
    const payloads = await Promise.all(
      queries.map((query) => callSoftiePersonalSearch(query).catch((error) => ({ __error: error, query })))
    )

    const snippets = compactRetrievedPersonalChunks(
      payloads.flatMap((payload: any) => {
        if (payload?.__error) return []
        return extractPersonalReferenceSnippets(payload)
      })
    )

    const hadErrors = payloads.some((payload: any) => payload?.__error)
    if (snippets.length === 0) {
      return {
        enabled: true,
        success: false,
        reason: hadErrors ? 'request-failed' : 'no-snippets',
        queryCount: queries.length,
        snippets: [],
      }
    }

    return {
      enabled: true,
      success: true,
      reason: hadErrors ? 'partial-success' : null,
      queryCount: queries.length,
      snippets: snippets.slice(0, 5),
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown-error'
    console.warn(`[SoftiePersonalRAG] failed: ${reason}`)
    return {
      enabled: true,
      success: false,
      reason,
      queryCount: queries.length,
      snippets: [],
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  let profileId = 'unknown';
  try {
    const { computedData, targetDate, profileId: requestProfileId, personalContext } = await req.json()
    profileId = requestProfileId || computedData?.profileId || 'unknown'

    // 0. Saju Knowledge RAG 초안 생성 (활성화 시)
    const ragEnabled = Deno.env.get("SAJU_KNOWLEDGE_RAG_ENABLED") === "true";
    const ragObservation: {
      enabled: boolean;
      successCount: number;
      failedCount: number;
      durationMs: number;
      sections: string[];
      failedSections: string[];
      draftPreviews: Record<string, string>;
      failedMessages: Record<string, string>;
    } = {
      enabled: ragEnabled,
      successCount: 0,
      failedCount: 0,
      durationMs: 0,
      sections: [],
      failedSections: [],
      draftPreviews: {},
      failedMessages: {},
    }
    let ragDraftsText = "";

    if (ragEnabled) {
      const ragStartTime = Date.now();
      const sections = [...SECTION_KEYS];
      
      const draftPromises = sections.map(section => 
        createSajuKnowledgeDraft({
          mode: "draft",
          section: section as any,
          profileId,
          targetDate: targetDate ?? computedData?.targetDate ?? computedData?.target_date ?? null,
          computedData,
          tags: [],
          question: `오늘 ${section} 섹션 초안을 작성해줘`
        }).catch(err => {
          return { error: err.message || String(err), section };
        })
      );

      const draftResults = await Promise.allSettled(draftPromises);
      const successfulDrafts: string[] = [];

      draftResults.forEach((res, index) => {
        const section = sections[index];
        if (res.status === 'fulfilled' && res.value && !('error' in res.value) && res.value.answer) {
          successfulDrafts.push(`[${section}] ${res.value.answer}`);
          ragObservation.sections.push(section);
          const preview = sanitizePreview(res.value.answer);
          if (preview) {
            ragObservation.draftPreviews[section] = preview;
          }
        } else {
          const errMsg = res.status === 'fulfilled' && res.value && 'error' in res.value 
            ? res.value.error 
            : (res.status === 'rejected' ? res.reason : 'Unknown error');
          ragObservation.failedSections.push(section);
          ragObservation.failedMessages[section] = shortenErrorMessage(errMsg);
        }
      });

      const ragEndTime = Date.now();
      ragObservation.successCount = successfulDrafts.length;
      ragObservation.failedCount = ragObservation.failedSections.length;
      ragObservation.durationMs = ragEndTime - ragStartTime;
      console.log(
        `[RAG] Enabled=${ragObservation.enabled} Success=${ragObservation.successCount} Failed=${ragObservation.failedCount} Time=${ragObservation.durationMs}ms Sections=${ragObservation.sections.join(',') || 'none'}`,
      );
      if (ragObservation.failedSections.length > 0) {
        const failedSummary = ragObservation.failedSections
          .map((section) => `${section}:${ragObservation.failedMessages[section]}`)
          .join(', ');
        console.warn(`[RAG] FailedSections=${failedSummary}`);
      }

      if (successfulDrafts.length > 0) {
        ragDraftsText = "\n\n[Saju Knowledge RAG 참고 초안]\n" + successfulDrafts.join("\n");
      }
    } else {
      console.log("[RAG] Disabled.");
    }

    const softiePersonalRagDraft = await createSoftiePersonalReferenceDraft({
      computedData,
      targetDate: targetDate ?? computedData?.targetDate ?? computedData?.target_date ?? null,
      personalContext,
    })

    // 1. 프롬프트 구성 (콤팩트한 JSON 데이터 활용)
    const compactPayload = compactComputedData({
      ...computedData,
      targetDate: targetDate ?? computedData?.targetDate ?? computedData?.target_date ?? null,
    })
    const compactPersonal = compactPersonalContext(personalContext)

    const systemPrompt = `당신은 사주 엔진 신호를 따뜻하고 생활감 있는 오늘의 리포트로 다듬는 편집자입니다.
사주 전문용어, 신비주의, 확정적 예언, 로맨스/금전 확언, 공포를 유도하는 표현은 쓰지 마세요.

[우선 근거]
모든 문장은 반드시 입력 근거를 바탕으로 쓰세요. 특히 아래 순서를 우선 참고하세요.
1. interpretationProfile.basisHint
2. interpretationProfile.dailyKeyPoints
3. interpretationProfile.fieldReasonHints
4. interpretationProfile.personalContextHints
5. interpretationProfile.periodContextHints
6. fieldImpacts
7. branchRelations
8. love.summary_hint
입력 힌트가 있으면 일반적인 위로나 건강 앱 문장으로 흐리지 마세요.

[RAG 참고 자료 활용 규칙]
- 제공된 "Saju Knowledge RAG 참고 초안"은 지식 베이스에서 추출된 좋은 표현들입니다.
- RAG 초안은 참고용입니다. 그대로 복사하지 말고, 위의 [우선 근거] 데이터와 결합하여 자연스럽게 다듬으세요.
- 만약 RAG 초안의 내용이 interpretationProfile이나 fieldImpacts의 신호(score, risks 등)와 충돌한다면, 반드시 엔진 신호를 우선하세요.

[Softie 전용 개인화 힌트 활용 규칙]
- softiePersonalContext가 있으면 /softie-fortune 전용 보조 힌트입니다.
- 이 힌트는 엔진 신호를 덮어쓰지 말고, 생활 번역과 문체를 더 정확하게 맞추는 데만 사용하세요.
- compactHints는 오늘 흐름과 맞는 것만 자연스럽게 반영하고, 모든 힌트를 억지로 쓰지 마세요.
- 매일 같은 표현이 반복되지 않게, 같은 뜻이라도 오늘의 dayType, dailyBalance, fieldReasonHints에 맞춰 변주하세요.

[Softie 개인 기준서 RAG 활용 규칙]
- softiePersonalRag.snippets가 있으면 /softie-fortune 전용 검색 참고 자료입니다.
- 검색 결과는 그대로 복사하지 말고, 오늘의 엔진 신호와 맞는 내용만 1~3개 정도 자연스럽게 반영하세요.
- compact personalContext와 내용이 겹치면 중복하지 말고 한 번만 반영하세요.
- 관계, 돈, 건강, 직업 문장은 검색 자료보다 오늘의 dailyBalance와 sectionPriority를 우선하세요.

[출력 규칙]
- headline: 짧은 한국어 제목 1문장. summary를 반복하지 마세요.
- basis: 내부 보조 문장 1개. summary를 그대로 반복하지 마세요.
- summary: 짧은 2문장 이내. 1문장은 오늘의 핵심 흐름, 2문장은 조심할 점과 실천 태도.
- sections.work/money/relationships/love/health/mind: 가능하면 각 2문장. 1문장은 흐름과 이유, 2문장은 실천이나 태도.
- cautions: 정확히 2개의 행동형 한국어 문장.
- action_tip: 오늘의 가장 강한 흐름에 맞는 1~3분 행동 1문장.

[문체]
- 따뜻하고 부드럽고 실용적인 한국어로 쓰세요.
- 분석 보고서처럼 딱딱하게 쓰지 말고, 생활 조언처럼 자연스럽게 쓰세요.
- 조사와 연결 표현을 자연스럽게 다듬으세요. "A은 통해", "A는 통해", "매력과 소통이 통합니다" 같은 어색한 표현은 피하세요.
- 문장을 지나치게 압축하지 말고, 오늘 실제로 느낄 감각으로 풀어 쓰세요.

[건강 섹션 엄수]
- sections.health에는 정확히 "규칙적 식사", "규칙적인 식사", "가벼운 스트레칭", "짧은 스트레칭"을 쓰지 마세요.
- 건강 문장은 오늘 흐름과 연결하세요. 쌓인 긴장, 호흡 리듬, 몸의 무게감, 생각 과열, 책임감 피로, 회복 시간, 자극 줄이기 같은 방향을 우선 쓰세요.
- 건강 조언이 필요해도 일반적인 웰니스 앱처럼 보이지 않게, 왜 지금 필요한지 함께 느껴지게 쓰세요.

[주의문 엄수]
- cautions는 상태 묘사나 명사형이 아니라 반드시 행동형 문장이어야 합니다.
- "~할 수 있어요", "~할 수 있음", "~이 생길 수 있어요", "~이 생길 수 있음", "~에 주의"로 끝내지 마세요.
- 대신 "~하세요", "~보세요", "~덜어내세요", "~확인하세요", "~나누어 보세요" 같은 구체적 행동으로 고쳐 쓰세요.

[action_tip]
- mind/recovery가 강하면 숨 고르기, 한 줄 적기, 감정 정리처럼 쓰세요.
- communication/relationship가 강하면 말하기 전 멈추기, 문장 다시 읽기, 답장 천천히 보내기처럼 쓰세요.
- money/work가 강하면 우선순위 1개 확인, 지출 1건 재확인처럼 쓰세요.
- health가 가장 강한 날이 아니면 식사나 스트레칭을 기본값으로 쓰지 마세요.

[짧은 예시]
- health: "책임감이 몸의 무게감으로 이어지기 쉬운 날이에요. 오늘은 무리한 속도보다 회복 시간을 먼저 챙겨보세요."
- caution: "민감한 반응이 올라올 땐 바로 말하기보다 한 번 숨을 고르세요."
- caution: "계획 없는 지출은 결제 전에 한 번 더 살펴보세요."
- action_tip: "중요한 말은 한 번 더 생각하고 천천히 표현하세요."
- action_tip: "오늘 할 일을 세 가지로 줄여 우선순위를 정하세요."

최종 JSON을 내보내기 전에 조용히 다시 점검하세요.
- health에 금지 문구가 있으면 오늘 흐름과 연결된 다른 표현으로 고치세요.
- cautions가 행동형 문장이 아니면 행동형으로 다시 쓰세요.
- 전체 문장은 짧고 자연스럽게 유지하세요.
- 마크다운, 코드블록, 제어 텍스트는 절대 넣지 마세요.`;

    const userPrompt = JSON.stringify(
      {
        ...compactPayload,
        softiePersonalContext: compactPersonal,
        softiePersonalRag: {
          snippets: softiePersonalRagDraft?.snippets || []
        }
      },
    ) + ragDraftsText;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    const modelName = Deno.env.get("OPENAI_FORTUNE_MODEL") || "gpt-5-mini"
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
            health: "몸과 마음의 속도가 흐트러지기 쉬우니, 잠깐 호흡을 고르며 리듬을 낮춰보세요.",
            mind: "긍정적인 마음가짐으로 하루를 시작해보세요."
          },
          cautions: ["서두르는 결정은 시간을 두고 한 번 더 확인하세요.", "쌓인 부담은 혼자 끌어안기보다 작게 나누어 보세요."],
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
              model: modelName,
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
              finalResponse = { model: modelName, content };
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

    try {
      const repeatAxisSummary = analyzeRepeatAxes(finalResponse?.content?.sections);
      if (Object.keys(repeatAxisSummary).length > 0) {
        console.log(`[RepeatAxis] ${formatRepeatAxisLog(repeatAxisSummary)}`);
      } else {
        console.log('[RepeatAxis] none');
      }

      const debug = {
        ...(finalResponse?.content?.debug && typeof finalResponse.content.debug === 'object'
          ? finalResponse.content.debug
          : {}),
        rag: {
          enabled: ragObservation.enabled,
          successCount: ragObservation.successCount,
          failedCount: ragObservation.failedCount,
          durationMs: ragObservation.durationMs,
          sections: ragObservation.sections,
          failedSections: ragObservation.failedSections,
          draftPreviews: ragObservation.draftPreviews,
        },
        personalContext: {
          provided: Boolean(compactPersonal),
          source: compactPersonal?.source ?? null,
          hintCount: compactPersonal?.compactHints?.length ?? 0,
        },
        softiePersonalRag: {
          enabled: Boolean(softiePersonalRagDraft?.enabled),
          success: Boolean(softiePersonalRagDraft?.success),
          queryCount: softiePersonalRagDraft?.queryCount ?? 0,
          snippetCount: softiePersonalRagDraft?.snippets?.length ?? 0,
          reason: softiePersonalRagDraft?.reason ?? null,
        },
        repeatAxisSummary,
      };

      if (finalResponse?.content && typeof finalResponse.content === 'object') {
        finalResponse.content.debug = debug;
      }
    } catch (observabilityError) {
      console.warn(`[Observability] Failed: ${shortenErrorMessage(observabilityError)}`);
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[Error] Execution failed. profileId: ${profileId || 'unknown'}, Time: ${Date.now() - startTime}ms. Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  } finally {
    console.log(`[Total] Fortune report generation finished. Time: ${Date.now() - startTime}ms`);
  }
})
