import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SECTION_VALUES = ['work', 'money', 'relationships', 'love', 'health', 'mind'] as const;
type DraftSection = typeof SECTION_VALUES[number];
type ResponseMode = 'retrieve' | 'draft';

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

function uniqueStrings(values: unknown[], limit = 20) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => String(value).trim()))]
    .slice(0, limit);
}

function collectFieldSignals(fieldImpacts: any = {}) {
  const keys = ['work', 'money', 'relationships', 'love', 'health', 'mind'];
  return keys.flatMap((key) => Array.isArray(fieldImpacts?.[key]?.signals) ? fieldImpacts[key].signals : []);
}

function deriveTagsFromComputedData(computedData: any = {}) {
  const interpretationProfile = computedData?.interpretationProfile || {};
  const love = computedData?.love || {};
  const fieldImpacts = computedData?.fieldImpacts || {};

  return uniqueStrings([
    interpretationProfile?.primaryTheme,
    interpretationProfile?.secondaryTheme,
    ...(interpretationProfile?.dominantSignals || []),
    ...(interpretationProfile?.topRisks || []),
    ...(interpretationProfile?.topOpportunities || []),
    ...(love?.keySignals || []),
    ...collectFieldSignals(fieldImpacts),
  ]);
}

function normalizeMode(value: unknown): ResponseMode {
  return value === 'draft' ? 'draft' : 'retrieve';
}

function normalizeSection(value: unknown): DraftSection | null {
  return typeof value === 'string' && SECTION_VALUES.includes(value as DraftSection)
    ? value as DraftSection
    : null;
}

function buildRetrievalQuery(
  question: string,
  extractedTags: string[],
  targetDate: string | null,
  mode: ResponseMode,
  section: DraftSection | null,
) {
  if (mode === 'draft') {
    const normalizedQuestion = question || (section ? `오늘 ${section} 섹션 초안을 작성해줘` : '오늘 섹션 초안을 작성해줘');
    return [
      section ? `[section:${section}]` : '[section:general]',
      normalizedQuestion,
      '섹션 초안 작성 기준',
      section ? `sections.${section}` : null,
      section ? `오늘 ${section} 운세 문단` : null,
      targetDate ? `targetDate:${targetDate}` : null,
      extractedTags.join(' '),
      '사주 해석 기준 Recommended tone Action tip examples',
    ].filter(Boolean).join(' ');
  }

  return [question, targetDate ? `targetDate:${targetDate}` : null, extractedTags.join(' ')].filter(Boolean).join(' | ');
}

function extractAnswerText(payload: any) {
  return payload?.answer?.answerText
    || payload?.answer?.text
    || payload?.answerText
    || payload?.answer?.state?.answerText
    || null;
}

const MAX_RETRIEVED_CHUNKS = 10;
const MAX_RAW_STRING_LENGTH = 300;
const MAX_FIELD_LENGTH = 500;

function truncateString(value: unknown, limit = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, limit);
}

function pickFirstString(values: unknown[], limit = MAX_FIELD_LENGTH) {
  for (const value of values) {
    const truncated = truncateString(value, limit);
    if (truncated) {
      return truncated;
    }
  }
  return null;
}

function safeRawPreview(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.slice(0, MAX_RAW_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 3).map((item) => safeRawPreview(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[truncated]';
    }

    const preview: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>).slice(0, 8)) {
      if (/token|secret|private.?key|authorization|credential/i.test(key)) {
        continue;
      }
      preview[key] = safeRawPreview(nestedValue, depth + 1);
    }
    return preview;
  }

  return String(value).slice(0, MAX_RAW_STRING_LENGTH);
}

function getNestedCandidates(item: any) {
  return [
    item,
    item?.reference,
    item?.references,
    item?.citation,
    item?.document,
    item?.chunk,
    item?.resource,
    item?.groundingChunk,
    item?.groundingMetadata,
    item?.support,
    item?.source,
  ].filter(Boolean);
}

function normalizeRetrievedChunk(item: any, source: string) {
  const candidates = getNestedCandidates(item);
  const title = pickFirstString(candidates.flatMap((candidate) => [
    candidate?.title,
    candidate?.documentTitle,
    candidate?.document?.title,
    candidate?.chunkInfo?.title,
    candidate?.source?.title,
    candidate?.structData?.title,
    candidate?.derivedStructData?.title,
  ]));
  const uri = pickFirstString(candidates.flatMap((candidate) => [
    candidate?.uri,
    candidate?.link,
    candidate?.url,
    candidate?.document?.uri,
    candidate?.document?.link,
    candidate?.resource?.uri,
    candidate?.resource?.link,
    candidate?.source?.uri,
    candidate?.source?.url,
    candidate?.structData?.uri,
    candidate?.derivedStructData?.link,
    candidate?.derivedStructData?.uri,
  ]));
  const document = pickFirstString(candidates.flatMap((candidate) => [
    candidate?.document,
    candidate?.documentName,
    candidate?.documentId,
    candidate?.id,
    candidate?.name,
    candidate?.chunk?.name,
    candidate?.resourceName,
    candidate?.source?.document,
    candidate?.source?.id,
  ]));
  const snippet = pickFirstString(candidates.flatMap((candidate) => [
    candidate?.snippet,
    candidate?.content,
    candidate?.text,
    candidate?.answerText,
    candidate?.extractiveSegment,
    candidate?.extractiveAnswer,
    candidate?.document?.snippet,
    candidate?.document?.content,
    candidate?.chunk?.content,
    candidate?.chunkInfo?.content,
    candidate?.groundingText,
    candidate?.supportText,
    candidate?.evidence,
    candidate?.quote,
    candidate?.summary,
    candidate?.structData?.snippet,
    candidate?.derivedStructData?.snippets?.[0]?.snippet,
  ]));

  if (!title && !uri && !document && !snippet) {
    return null;
  }

  return {
    source,
    title,
    uri,
    document,
    snippet,
    raw: safeRawPreview(item),
  };
}

function extractRetrievedChunks(payload: any) {
  const candidates = [
    { source: 'answer.citations', value: payload?.answer?.citations },
    { source: 'answer.references', value: payload?.answer?.references },
    { source: 'answer.groundingSupports', value: payload?.answer?.groundingSupports },
    { source: 'answer.groundingSupport', value: payload?.answer?.groundingSupport },
    { source: 'answer.steps', value: payload?.answer?.steps },
    { source: 'citations', value: payload?.citations },
    { source: 'references', value: payload?.references },
  ];
  const normalized: any[] = [];
  const seenKeys = new Set<string>();

  for (const candidate of candidates) {
    const items = Array.isArray(candidate.value)
      ? candidate.value
      : candidate.value
        ? [candidate.value]
        : [];

    for (const item of items) {
      const normalizedItem = normalizeRetrievedChunk(item, candidate.source);
      if (!normalizedItem) {
        continue;
      }

      const dedupeKey = JSON.stringify([
        normalizedItem.title,
        normalizedItem.uri,
        normalizedItem.document,
        normalizedItem.snippet,
      ]);
      if (seenKeys.has(dedupeKey)) {
        continue;
      }

      seenKeys.add(dedupeKey);
      normalized.push(normalizedItem);

      if (normalized.length >= MAX_RETRIEVED_CHUNKS) {
        return normalized;
      }
    }
  }

  return normalized;
}

const SECTION_FALLBACKS: Record<DraftSection, string> = {
  work: '오늘은 일을 넓히기보다 이미 맡은 것을 차분히 정리하는 편이 좋아요. 중요한 전달이나 숫자는 한 번 더 확인하면 불필요한 피로를 줄일 수 있습니다.',
  money: '오늘은 돈을 크게 움직이기보다 예정된 지출과 조건을 살피기 좋은 흐름이에요. 결제 전 금액과 기간을 한 번 더 확인해보세요.',
  relationships: '오늘은 말의 속도가 관계의 온도에 영향을 주기 쉬워요. 바로 답하기보다 문장을 한 번 고르면 불필요한 오해를 줄일 수 있습니다.',
  love: '오늘은 마음을 크게 확인하려 하기보다 대화의 온도를 살피기 좋은 흐름이에요. 짧은 안부나 가벼운 표현이 부담 없이 닿을 수 있습니다.',
  health: '오늘은 몸보다 마음이 먼저 바빠질 수 있어요. 자극을 조금 줄이고 회복 시간을 남겨두면 컨디션을 지키는 데 도움이 됩니다.',
  mind: '오늘은 마음이 바쁘게 앞서기 쉬운 흐름이에요. 감정을 바로 해결하려 하기보다 먼저 이름 붙여 적어보면 생각의 무게가 조금 가벼워질 수 있습니다.',
};

const DRAFT_BANNED_LABEL_PATTERNS = [
  /Bad examples?/i,
  /Bad (work|money|relationships|love|health|mind) section examples?/i,
  /Good (work|money|relationships|love|health|mind) section examples?/i,
  /Action tip examples?/i,
  /Recommended tone/i,
  /Output usage/i,
  /Search keywords?/i,
  /Version:/i,
  /Title:/i,
  /Tags:/i,
  /When to use:/i,
  /Signals:/i,
  /Interpretation rule:/i,
  /Avoid:/i,
  /Score guide:/i,
  /Risk interpretation:/i,
  /Strength and balance guide:/i,
  /Ten gods/i,
  /오늘\s*(마음운|업무운|금전운|관계운|연애운|건강운)\s*해석 기준/,
  /(업무운|일운|커리어)\s*,\s*(업무|마감|보고)/,
  /(금전운|돈|소비)\s*,\s*(지출|결제)/,
  /(관계운|인간관계|소통)\s*,\s*(말실수|오해)?/,
  /(연애운|호감|감정 표현)\s*,\s*(안부|고백|연락)?/,
  /(건강운|컨디션|피로)\s*,\s*(몸의 무게감|회복)?/,
  /(마음운|멘탈|감정|불안)\s*,\s*(생각|회복|자기정리)?/,
];

const SECTION_KEYWORDS: Record<DraftSection, { positive: RegExp[]; negative: RegExp[] }> = {
  work: {
    positive: [/업무운/, /일운/, /업무/, /마감/, /보고/, /책임/, /sections\.work/i],
    negative: [/금전운/, /지출/, /결제/, /관계운/, /연애운/, /건강운/, /컨디션/, /피로/, /몸의 무게감/, /마음운/, /멘탈/, /sections\.(money|relationships|love|health|mind)/i],
  },
  money: {
    positive: [/금전운/, /돈/, /지출/, /결제/, /계약/, /정산/, /sections\.money/i],
    negative: [/업무운/, /관계운/, /연애운/, /건강운/, /컨디션/, /몸의 무게감/, /마음운/, /멘탈/, /sections\.(work|relationships|love|health|mind)/i],
  },
  relationships: {
    positive: [/관계운/, /인간관계/, /소통/, /말실수/, /오해/, /sections\.relationships/i],
    negative: [/업무운/, /금전운/, /연애운/, /건강운/, /컨디션/, /피로/, /몸의 무게감/, /마음운/, /멘탈/, /sections\.(work|money|love|health|mind)/i],
  },
  love: {
    positive: [/연애운/, /호감/, /안부/, /고백/, /연락/, /감정 표현/, /대화의 온도/, /마음/, /sections\.love/i],
    negative: [/Good health section examples/i, /Bad health section examples/i, /sections\.health/i, /건강운/, /컨디션/, /피로/, /몸의 무게감/, /회복/, /자극/, /업무운/, /금전운/, /관계운/, /마음운/, /멘탈/],
  },
  health: {
    positive: [/건강운/, /컨디션/, /피로/, /몸의 무게감/, /회복/, /자극/, /sections\.health/i],
    negative: [/업무운/, /금전운/, /관계운/, /연애운/, /호감/, /안부/, /고백/, /마음운/, /멘탈/, /sections\.(work|money|relationships|love|mind)/i],
  },
  mind: {
    positive: [/마음운/, /멘탈/, /감정/, /생각/, /불안/, /마음/, /sections\.mind/i],
    negative: [/업무운/, /금전운/, /관계운/, /연애운/, /건강운/, /컨디션/, /피로/, /몸의 무게감/, /sections\.(work|money|relationships|love|health)/i],
  },
};

function hasDisallowedDraftPattern(text: string) {
  return /기준은 다음과 같습니다|사용자님/.test(text)
    || /^\s*[-*•]/m.test(text)
    || /(^|\n)\s*\d+\./m.test(text);
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentences(text: string) {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?]|[가-힣][요다]\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function stripTerminalPunctuation(text: string) {
  return text.replace(/[.!?。！？…]+$/g, '').trim();
}

function normalizeSentenceForComparison(sentence: string) {
  return stripTerminalPunctuation(sentence)
    .replace(/[“”"'‘’]/g, '')
    .replace(/[^\p{L}\p{N}\s가-힣]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sentenceSimilarity(left: string, right: string) {
  const a = normalizeSentenceForComparison(left);
  const b = normalizeSentenceForComparison(right);
  if (!a || !b) {
    return 0;
  }

  if (a === b || a.includes(b) || b.includes(a)) {
    return 1;
  }

  const leftTerms = new Set(a.split(' ').filter(Boolean));
  const rightTerms = new Set(b.split(' ').filter(Boolean));
  const shared = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  const total = new Set([...leftTerms, ...rightTerms]).size;
  return total === 0 ? 0 : shared / total;
}

function dedupeSimilarSentences(sentences: string[]) {
  const deduped: string[] = [];

  for (const sentence of sentences) {
    const cleaned = cleanDraftSentence(sentence);
    if (!cleaned) {
      continue;
    }

    const isDuplicate = deduped.some((existing) => sentenceSimilarity(existing, cleaned) >= 0.72);
    if (!isDuplicate) {
      deduped.push(cleaned);
    }
  }

  return deduped;
}

const WORK_ACTION_SENTENCES = [
  '중요한 전달이나 숫자는 한 번 더 확인하면 불필요한 피로를 줄일 수 있습니다.',
  '보내기 전 문장과 수치를 다시 읽어보면 작은 오차를 줄일 수 있습니다.',
  '결정 전에 메모를 한 번 정리해두면 뒤늦은 수정 부담을 줄일 수 있습니다.',
];

function pickWorkActionSentence(existing: string[]) {
  return WORK_ACTION_SENTENCES.find((sentence) => !existing.some((current) => sentenceSimilarity(current, sentence) >= 0.72))
    || WORK_ACTION_SENTENCES[0];
}

function polishDraftAnswer(section: DraftSection | null, answer: string) {
  const rawSentences = splitSentences(answer);
  const sentences = dedupeSimilarSentences(rawSentences);

  if (section === 'work' && sentences.length === 1 && !isConcreteActionSentence(sentences[0])) {
    sentences.push(pickWorkActionSentence(sentences));
  }

  const polished = sentences
    .slice(0, 2)
    .map((sentence) => stripTerminalPunctuation(sentence))
    .filter(Boolean)
    .join(' ');

  if (!polished) {
    return polished;
  }

  return `${polished.replace(/[.!?]+$/g, '').trim()}.`;
}

function cleanDraftSentence(sentence: string) {
  let cleaned = sentence;
  for (const pattern of DRAFT_BANNED_LABEL_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  cleaned = cleaned
    .replace(/^[-*•\d.\s]+/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/기준은 다음과 같습니다/g, '')
    .replace(/사용자님/g, '')
    .replace(/[:.]\s*["']?\s*$/g, '')
    .replace(/["']?\s*[:.]\s*$/g, '')
    .replace(/\\+"/g, '')
    .replace(/\s{2,}/g, ' ');

  return normalizeWhitespace(cleaned);
}

function sectionLabel(section: DraftSection | null) {
  switch (section) {
    case 'work':
      return '업무운';
    case 'money':
      return '금전운';
    case 'relationships':
      return '관계운';
    case 'love':
      return '연애운';
    case 'health':
      return '건강운';
    case 'mind':
      return '마음 흐름';
    default:
      return '오늘 흐름';
  }
}

function isAcceptableDraftAnswer(text: string) {
  const normalized = normalizeWhitespace(text);
  if (!normalized || hasDisallowedDraftPattern(normalized) || isMetadataLikeSentence(normalized)) {
    return false;
  }

  const sentences = splitSentences(normalized);
  return sentences.length >= 1
    && sentences.length <= 2
    && normalized.length <= 180;
}

function hasBannedDraftLabel(text: string) {
  return DRAFT_BANNED_LABEL_PATTERNS.some((pattern) => pattern.test(text));
}

function countCommaSeparatedTerms(text: string) {
  return text
    .split(',')
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

function hasAdviceLikeEnding(text: string) {
  return /(좋아요|해보세요|도움이 됩니다|줄일 수 있습니다|살펴보세요|정리해보세요|낮춰보세요|좋은 흐름이에요|좋아요\.$|보는 편이 좋아요|닿을 수 있습니다|가벼워질 수 있습니다)$/.test(text);
}

function isVagueWarningSentence(text: string) {
  const normalized = normalizeWhitespace(text);
  return /(?:말실수|오해|관계|건강|돈 문제|실수|피로|몸|컨디션|감정|소통|상대 마음|마음)\s*(?:에|에 대해|쪽에)?\s*(?:주의하세요|조심하세요)$/.test(normalized)
    || /(?:주의하세요|조심하세요)$/.test(normalized) && !isConcreteActionSentence(normalized);
}

function isConcreteActionSentence(text: string) {
  const normalized = normalizeWhitespace(text);
  return /(?:바로|한 번|짧게|부드럽게|다시|천천히|먼저|작은|짧은|가볍게|확인|읽어보|고르면|바꿔보|건네보)/.test(normalized)
    || hasAdviceLikeEnding(normalized)
    || /[가-힣]+(해보세요|읽어보세요|보세요|바꿔보세요|건네보세요|다시 읽어보세요)$/.test(normalized);
}

function isMetadataLikeSentence(text: string) {
  const normalized = normalizeWhitespace(text);
  const commaTerms = countCommaSeparatedTerms(normalized);
  const shortCommaTerms = commaTerms.filter((term) => term.length <= 12);

  if (/해석 기준/.test(normalized) && commaTerms.length >= 4) {
    return true;
  }

  if (shortCommaTerms.length >= 5) {
    return true;
  }

  if (
    /(오늘\s*(마음운|업무운|금전운|관계운|연애운|건강운)\s*해석 기준)/.test(normalized)
    || /(마음운,\s*멘탈,\s*감정,\s*불안)/.test(normalized)
    || /(연애운,\s*호감,\s*감정 표현)/.test(normalized)
    || /(금전운,\s*돈,\s*소비,\s*지출)/.test(normalized)
    || /(건강운,\s*컨디션,\s*피로)/.test(normalized)
    || /(관계운,\s*인간관계,\s*소통)/.test(normalized)
    || /(업무운,\s*일운,\s*커리어)/.test(normalized)
  ) {
    return true;
  }

  if (commaTerms.length >= 3 && !hasAdviceLikeEnding(normalized)) {
    return true;
  }

  return false;
}

function getSectionKeywordScore(section: DraftSection, text: string) {
  const { positive, negative } = SECTION_KEYWORDS[section];
  let score = 0;

  for (const pattern of positive) {
    if (pattern.test(text)) {
      score += 2;
    }
  }

  for (const pattern of negative) {
    if (pattern.test(text)) {
      score -= 3;
    }
  }

  return score;
}

function isSectionCompatible(section: DraftSection, text: string) {
  const score = getSectionKeywordScore(section, text);
  const hasPositive = SECTION_KEYWORDS[section].positive.some((pattern) => pattern.test(text));
  const hasNegative = SECTION_KEYWORDS[section].negative.some((pattern) => pattern.test(text));
  if (hasNegative && !hasPositive) {
    return false;
  }
  return score >= 0;
}

function extractCandidateSentences(section: DraftSection, answer: string | null, retrievedChunks: any[]) {
  const chunkTexts = retrievedChunks
    .map((chunk) => typeof chunk?.snippet === 'string' ? chunk.snippet : null)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => getSectionKeywordScore(section, b) - getSectionKeywordScore(section, a));
  const texts = [...chunkTexts, answer].filter((value): value is string => typeof value === 'string' && value.trim());

  const candidates: string[] = [];
  for (const text of texts) {
    if (!isSectionCompatible(section, text) && hasBannedDraftLabel(text)) {
      continue;
    }

    const normalized = text
      .replace(/\s+-\s+/g, '. ')
      .replace(/\s*\*\s*/g, ' ')
      .replace(/[“”]/g, '"');

    for (const sentence of splitSentences(normalized)) {
      const cleaned = cleanDraftSentence(sentence);
      if (
        cleaned
        && cleaned.length >= 12
        && !hasDisallowedDraftPattern(cleaned)
        && !hasBannedDraftLabel(cleaned)
        && !isMetadataLikeSentence(cleaned)
        && !isVagueWarningSentence(cleaned)
        && isSectionCompatible(section, cleaned)
      ) {
        candidates.push(cleaned);
      }
    }
  }

  return candidates;
}

function chooseActionSentence(section: DraftSection, candidates: string[]) {
  const keywordPatterns: Record<DraftSection, RegExp[]> = {
    work: [/확인/, /정리/, /마무리/, /우선순위/, /전달/, /숫자/],
    money: [/지출/, /결제/, /금액/, /조건/, /확인/, /살피/],
    relationships: [/오해/, /답하기보다/, /문장/, /표현/, /속도/, /말/],
    love: [/안부/, /표현/, /대화/, /부담/, /온도/, /천천히/],
    health: [/회복/, /자극/, /속도/, /무리/, /몸/, /컨디션/],
    mind: [/감정/, /정리/, /적어/, /숨/, /무게/, /천천히/],
  };
  const sectionPatterns = keywordPatterns[section];

  for (const candidate of candidates) {
    if (sectionPatterns.some((pattern) => pattern.test(candidate))) {
      return candidate;
    }
  }

  return null;
}

function buildSectionLead(section: DraftSection, tags: string[]) {
  const hasWeakEnergyTag = tags.some((tag) => /신약/.test(tag));
  const hasPressureTag = tags.some((tag) => /토 과다|압박|책임/.test(tag));

  switch (section) {
    case 'work':
      if (hasWeakEnergyTag) {
        return '오늘은 일을 넓히기보다 이미 맡은 것을 가볍게 정리하는 편이 좋아요.';
      }
      return hasPressureTag
        ? '오늘은 책임을 한꺼번에 끌어안기보다 흐름을 나누어 보는 편이 좋아요.'
        : '오늘은 일을 무리하게 늘리기보다 흐름을 고르게 정리하는 편이 좋아요.';
    case 'money':
      return hasPressureTag
        ? '오늘은 돈을 크게 움직이기보다 이미 잡힌 지출의 무게를 가볍게 정리하는 편이 좋아요.'
        : '오늘은 돈을 크게 움직이기보다 예정된 지출과 조건을 차분히 살피기 좋은 흐름이에요.';
    case 'relationships':
      return '오늘은 말의 속도와 거리감이 관계의 온도에 더 크게 닿기 쉬워요.';
    case 'love':
      return '오늘은 마음을 크게 확인하려 하기보다 대화의 온도를 천천히 살피기 좋은 흐름이에요.';
    case 'health':
      return hasPressureTag
        ? '오늘은 책임감이 몸의 무게로 이어지기 쉬워서 속도를 조금 낮추는 편이 좋아요.'
        : '오늘은 몸보다 마음이 먼저 바빠질 수 있어 흐름을 가볍게 조절하는 편이 좋아요.';
    case 'mind':
      return '오늘은 마음이 앞서 달리기 쉬워서 감정의 이름을 천천히 붙여보는 편이 좋아요.';
  }
}

function sanitizeActionSentence(section: DraftSection, sentence: string) {
  const cleaned = cleanDraftSentence(sentence);
  if (!cleaned) {
    return null;
  }

  const label = sectionLabel(section);
  if (cleaned.includes(label) || hasBannedDraftLabel(cleaned) || !isSectionCompatible(section, cleaned)) {
    return null;
  }

  if (isMetadataLikeSentence(cleaned)) {
    return null;
  }

  if (isVagueWarningSentence(cleaned)) {
    return null;
  }

  if (section === 'health' && /규칙적 식사|규칙적인 식사|가벼운 스트레칭|짧은 스트레칭/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

function validateDraftAnswer(section: DraftSection, answer: string) {
  const normalized = normalizeWhitespace(answer);
  if (!normalized) {
    return false;
  }

  if (hasDisallowedDraftPattern(normalized) || hasBannedDraftLabel(normalized)) {
    return false;
  }

  const sentences = splitSentences(normalized);
  if (sentences.length < 1 || sentences.length > 2) {
    return false;
  }

  if (!sentences.every((sentence) => isSectionCompatible(section, sentence))) {
    return false;
  }

  if (sentences.some((sentence) => isMetadataLikeSentence(sentence))) {
    return false;
  }

  if (sentences.every((sentence) => isVagueWarningSentence(sentence))) {
    return false;
  }

  if (sentences.some((sentence) => isVagueWarningSentence(sentence)) && !sentences.some((sentence) => isConcreteActionSentence(sentence))) {
    return false;
  }

  if (isVagueWarningSentence(sentences[sentences.length - 1])) {
    return false;
  }

  return true;
}

function buildRelationshipsFallback(tags: string[]) {
  const fallbackActions = [
    '바로 답하기보다 문장을 한 번 고르면 불필요한 오해를 줄일 수 있습니다.',
    '중요한 답장은 바로 보내지 말고 한 번 다시 읽어보세요.',
    '단정적인 표현 하나를 부드러운 표현으로 바꿔보세요.',
    '상대 마음을 짐작하기보다 짧은 확인 질문을 하나 건네보세요.',
  ];

  const lead = buildSectionLead('relationships', tags);
  const leadSentence = splitSentences(lead)[0] || '오늘은 말의 속도와 거리감이 관계의 온도에 더 크게 닿기 쉬워요.';
  const actionSentence = fallbackActions.find((sentence) => isConcreteActionSentence(sentence))
    || fallbackActions[0];

  return `${leadSentence} ${actionSentence}`;
}

function createDraftAnswer(section: DraftSection | null, tags: string[], vertexAnswer: string | null, retrievedChunks: any[]) {
  if (!section) {
    return '오늘은 흐름을 크게 밀어붙이기보다 먼저 마음에 남는 한 가지를 정리해보는 편이 좋아요. 바로 결론내리기보다 작은 확인 하나를 더하면 불필요한 흔들림을 줄일 수 있습니다.';
  }

  if (vertexAnswer && isAcceptableDraftAnswer(vertexAnswer)) {
    const directAnswer = polishDraftAnswer(section, vertexAnswer);
    if (validateDraftAnswer(section, directAnswer)) {
      return directAnswer;
    }
  }

  const candidates = extractCandidateSentences(section, vertexAnswer, retrievedChunks);
  const actionSentence = chooseActionSentence(section, candidates);
  const sanitizedAction = actionSentence ? sanitizeActionSentence(section, actionSentence) : null;

  if (sanitizedAction) {
    const lead = buildSectionLead(section, tags);
    const leadSentences = splitSentences(lead);
    const actionSentences = splitSentences(sanitizedAction);
    const draft = polishDraftAnswer(section, [...leadSentences.slice(0, 1), ...actionSentences.slice(0, 1)].join(' '));
    if (validateDraftAnswer(section, draft)) {
      return draft;
    }

    const leadOnly = polishDraftAnswer(section, leadSentences.slice(0, 1).join(' '));
    if (validateDraftAnswer(section, leadOnly)) {
      return leadOnly;
    }
  }

  if (section === 'relationships') {
    const relationshipsFallback = buildRelationshipsFallback(tags);
    const polishedRelationshipsFallback = polishDraftAnswer(section, relationshipsFallback);
    if (validateDraftAnswer(section, polishedRelationshipsFallback)) {
      return polishedRelationshipsFallback;
    }
  }

  return polishDraftAnswer(section, SECTION_FALLBACKS[section]);
}

async function callVertexAiSearchAnswer(query: string) {
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
  const location = Deno.env.get('GOOGLE_CLOUD_LOCATION') || 'global';
  const appId = Deno.env.get('SAJU_VERTEX_AI_SEARCH_APP_ID') || Deno.env.get('VERTEX_AI_SEARCH_APP_ID');
  const servingConfig = Deno.env.get('VERTEX_AI_SEARCH_SERVING_CONFIG') || 'default_search';
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!projectId || !appId || !serviceAccountEmail || !privateKey) {
    return {
      answer: null,
      retrievedChunks: [],
      warning: 'Vertex AI Search is not configured.',
      modelName: null,
    };
  }

  const accessToken = await createGoogleAccessToken(serviceAccountEmail, privateKey);
  const endpoint = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${location}/collections/default_collection/engines/${appId}/servingConfigs/${servingConfig}:answer`;

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
  });

  if (!response.ok) {
    const preview = (await response.text()).slice(0, 1000);
    console.error('Saju knowledge Vertex request failed', {
      status: response.status,
      preview,
    });
    throw new Error('Vertex AI Search request failed.');
  }

  const payload = await response.json();
  const retrievedChunks = extractRetrievedChunks(payload);
  if (retrievedChunks.length === 0) {
    console.log('Saju Vertex response shape', {
      topLevelKeys: Object.keys(payload || {}),
      answerKeys: Object.keys(payload?.answer || {}),
    });
  }

  return {
    answer: extractAnswerText(payload),
    retrievedChunks,
    warning: null,
    modelName: 'vertex-ai-search-answer',
  };
}

function createFallbackAnswer(tags: string[], warning: string | null) {
  return `[Fallback] Saju Knowledge RAG test received the request, but Vertex AI Search is not configured or failed. Tags: ${tags.join(', ') || 'none'}.`;
}

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
    const mode = normalizeMode(body?.mode);
    const section = normalizeSection(body?.section);
    const question = typeof body?.question === 'string' && body.question.trim()
      ? body.question.trim()
      : mode === 'draft' && section
        ? `오늘 ${sectionLabel(section)} 섹션 초안을 작성해줘`
        : '사주 해석 기준을 찾아줘';

    const extractedTags = uniqueStrings([
      ...providedTags,
      ...deriveTagsFromComputedData(computedData || {}),
    ]);
    const retrievalQuery = buildRetrievalQuery(question, extractedTags, targetDate, mode, section);
    const retrievalQueries = retrievalQuery ? [retrievalQuery] : [];

    let answer = '';
    let retrievedChunks: any[] = [];
    let warning: string | null = null;
    let modelName: string | null = null;
    let status = 'completed';

    try {
      const vertexResult = await callVertexAiSearchAnswer(retrievalQuery || question);
      answer = mode === 'draft'
        ? createDraftAnswer(section, extractedTags, vertexResult.answer, vertexResult.retrievedChunks)
        : vertexResult.answer || createFallbackAnswer(extractedTags, vertexResult.warning);
      retrievedChunks = vertexResult.retrievedChunks;
      warning = vertexResult.warning;
      modelName = vertexResult.modelName;
      if (vertexResult.warning) {
        status = 'fallback';
      }
    } catch (_error) {
      warning = 'Vertex AI Search request failed.';
      answer = createFallbackAnswer(extractedTags, warning);
      status = 'fallback';
    }

    const { data: insertedRun, error: insertError } = await supabaseAdmin
      .from('saju_knowledge_runs')
      .insert([{
        profile_id: profileId,
        target_date: targetDate,
        source: mode === 'draft'
          ? `manual-test:draft:${section || 'general'}`
          : 'manual-test:retrieve',
        computed_data: computedData,
        extracted_tags: extractedTags,
        retrieval_queries: retrievalQueries,
        retrieved_chunks: retrievedChunks,
        final_answer: answer,
        model_name: modelName,
        warning,
        status,
      }])
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        runId: insertedRun?.id || null,
        answer,
        extractedTags,
        retrievalQueries,
        retrievedChunks,
        warning,
        mode,
        section,
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
