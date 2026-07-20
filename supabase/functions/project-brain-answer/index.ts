import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

const supabaseAdmin = createClient(
  supabaseUrl,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
const supabaseAuth = createClient(
  supabaseUrl,
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const PROJECT_BRAIN_DISABLED_WARNING = 'Project Brain RAG is disabled.';
const MAX_QUESTION_LENGTH = 4000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('Authorization') || '';
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}

async function requireAuthenticatedUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) throw new RequestError(401, 'Missing authorization token.');

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new RequestError(401, 'Invalid authorization token.');
  }

  return data.user.id;
}

function createFallbackAnswer(question: string) {
  return `Project Brain is currently disabled. I received your question: "${question}".`;
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

function extractAnswerText(payload: any) {
  return payload?.answer?.answerText
    || payload?.answer?.text
    || payload?.answerText
    || payload?.answer?.state?.answerText
    || null;
}

function extractCitations(payload: any) {
  const citations = payload?.answer?.citations
    || payload?.citations
    || payload?.answer?.references
    || [];

  return Array.isArray(citations) ? citations : [];
}

async function callVertexAiSearchAnswer(question: string) {
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
  const location = Deno.env.get('GOOGLE_CLOUD_LOCATION') || 'global';
  const appId = Deno.env.get('VERTEX_AI_SEARCH_APP_ID');
  const servingConfig = Deno.env.get('VERTEX_AI_SEARCH_SERVING_CONFIG') || 'default_search';
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!projectId || !appId || !serviceAccountEmail || !privateKey) {
    return {
      answer: null,
      citations: [],
      warning: 'Vertex AI Search is not configured.',
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
        text: question,
      },
      answerGenerationSpec: {
        includeCitations: true,
      },
    }),
  });

  if (!response.ok) {
    const preview = (await response.text()).slice(0, 1000);
    console.error('Vertex AI Search request failed', {
      status: response.status,
      preview,
    });
    throw new Error('Vertex AI Search request failed.');
  }

  const payload = await response.json();
  return {
    answer: extractAnswerText(payload),
    citations: extractCitations(payload),
    warning: null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const userId = await requireAuthenticatedUser(req);
    const ownerKey = userId;

    const body = await req.json();
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) throw new RequestError(400, 'Question is required.');
    if (question.length > MAX_QUESTION_LENGTH) {
      throw new RequestError(400, `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
    }

    const requestedThreadId = body.threadId;
    if (requestedThreadId != null && typeof requestedThreadId !== 'string') {
      throw new RequestError(400, 'threadId must be a UUID string.');
    }

    let threadId = requestedThreadId?.trim() || null;
    if (threadId && !UUID_PATTERN.test(threadId)) {
      throw new RequestError(400, 'threadId must be a valid UUID.');
    }

    // 1. Create thread if missing
    if (!threadId) {
      const { data: newThread, error: threadErr } = await supabaseAdmin
        .from('project_brain_threads')
        .insert([{ owner_key: ownerKey, user_id: userId, title: question.slice(0, 60) }])
        .select('id')
        .single();

      if (threadErr) throw threadErr;
      threadId = newThread.id;
    } else {
      const { data: ownedThread, error: threadErr } = await supabaseAdmin
        .from('project_brain_threads')
        .select('id')
        .eq('id', threadId)
        .eq('owner_key', ownerKey)
        .maybeSingle();

      if (threadErr) throw threadErr;
      if (!ownedThread) throw new RequestError(404, 'Thread not found.');
    }

    // 2. Save user message
    const { error: userMessageError } = await supabaseAdmin
      .from('project_brain_messages')
      .insert([{ thread_id: threadId, role: 'user', content: question }]);

    if (userMessageError) throw userMessageError;

    // 3. Generate answer with Vertex AI Search only when explicitly enabled.
    let answer = createFallbackAnswer(question);
    let citations: unknown[] = [];
    let warning: string | null = null;

    if (Deno.env.get('PROJECT_BRAIN_RAG_ENABLED') === 'true') {
      try {
        const vertexResult = await callVertexAiSearchAnswer(question);
        answer = vertexResult.answer || answer;
        citations = vertexResult.citations;
        warning = vertexResult.warning;
      } catch (_err) {
        warning = 'Vertex AI Search request failed.';
      }
    } else {
      warning = PROJECT_BRAIN_DISABLED_WARNING;
    }

    // 4. Save assistant message
    const { error: assistantMessageError } = await supabaseAdmin
      .from('project_brain_messages')
      .insert([{ thread_id: threadId, role: 'assistant', content: answer }]);

    if (assistantMessageError) throw assistantMessageError;

    return jsonResponse({ answer, citations, threadId, warning });
  } catch (err) {
    const status = err instanceof RequestError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (status >= 500) console.error('Error:', err);
    return jsonResponse({ error: message }, status);
  }
});
