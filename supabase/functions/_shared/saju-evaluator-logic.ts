const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

function base64UrlEncode(bytes: Uint8Array) {
  if (!(bytes instanceof Uint8Array)) return '';
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string) {
  if (typeof pem !== 'string') {
    return new ArrayBuffer(0);
  }

  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Failed to decode PEM base64', e);
    return new ArrayBuffer(0);
  }
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

export async function searchEvaluatorSnippets(queries: string[]): Promise<any[]> {
  const isEnabled = Deno.env.get('SAJU_EVALUATOR_ENABLED') !== 'false';
  if (!isEnabled) {
    console.log('[SajuEvaluator] Search skipped due to SAJU_EVALUATOR_ENABLED=false');
    return [];
  }

  const projectNumber = Deno.env.get('SAJU_EVALUATOR_PROJECT_NUMBER') || '888064596054';
  const location = Deno.env.get('SAJU_EVALUATOR_LOCATION') || 'global';
  const dataStoreId = Deno.env.get('SAJU_EVALUATOR_DATA_STORE_ID') || 'saju-evaluator-bundle_1777718277036';
  const servingConfig = Deno.env.get('SAJU_EVALUATOR_SERVING_CONFIG') || 'default_config';
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[SajuEvaluator] Google credentials not configured. Search skipped.');
    return [];
  }

  try {
    const accessToken = await createGoogleAccessToken(serviceAccountEmail, privateKey);
    const endpoint = `https://discoveryengine.googleapis.com/v1/projects/${projectNumber}/locations/${location}/collections/default_collection/dataStores/${dataStoreId}/servingConfigs/${servingConfig}:search`;

    const allChunks: any[] = [];
    const seenTitles = new Set<string>();

    const searchPromises = queries.map(async (query) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            pageSize: 3,
          }),
        });

        if (!response.ok) {
          const preview = (await response.text()).slice(0, 500);
          console.error(`[SajuEvaluator] Search failed for query "${query}"`, { status: response.status, preview });
          return [];
        }

        const data = await response.json();
        const results = data.results || [];
        const extracted = [];

        for (const res of results) {
          const document = res.document || {};
          const structData = document.structData || {};
          const derivedStructData = document.derivedStructData || {};
          const title = document.name || structData.title || derivedStructData.title || 'Untitled';
          const uri = structData.uri || derivedStructData.link || '';
          
          let snippet = '';
          if (derivedStructData.snippets && derivedStructData.snippets.length > 0) {
            snippet = derivedStructData.snippets[0].snippet;
          } else if (document.content) {
            snippet = document.content.slice(0, 500);
          }

          if (snippet && !seenTitles.has(title)) {
            seenTitles.add(title);
            extracted.push({ source: 'search', title, uri, snippet });
          }
        }
        return extracted;
      } catch (err) {
        console.error(`[SajuEvaluator] Search error for query "${query}":`, err.message);
        return [];
      }
    });

    const resultsArray = await Promise.all(searchPromises);
    for (const arr of resultsArray) {
      allChunks.push(...arr);
    }

    return allChunks.slice(0, 10);
  } catch (error) {
    console.error('[SajuEvaluator] Failed to execute Discovery Engine search:', error.message);
    return [];
  }
}

export async function evaluateReportWithGPT(reportContent: any, retrievedChunks: any[]) {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const modelName = Deno.env.get("OPENAI_FORTUNE_MODEL") || "gpt-5-mini";

  const systemPrompt = `너는 사주 운세 리포트 품질 평가자다.
사용자를 위한 운세를 새로 작성하지 않는다. 오직 입력된 reportContent를 평가만 한다.
제공된 evaluator 기준서 snippets(retrieved chunks)를 최우선 평가 기준으로 삼는다.

[평가 기준]
- 확정 예언, 공포 표현, 건강 진단, 연애 결과 단정, 메타 문구 누수를 철저히 점검한다.
- 각 섹션(work, money, relationships, love, health, mind)의 경계가 흐려졌는지 평가한다.
- 행동축(정리, 확인, 속도 늦추기, 회복 시간 등)이 과도하게 반복되었는지 점검한다.
- 모호한 조언(추상적인 위로)이 없는지 확인한다.

[출력 형식]
- 반드시 JSON만 반환한다.
- Markdown 코드블록(\`\`\`json 등)을 쓰지 않는다.
- evidence에는 실제 문제가 된 문장 또는 표현을 짧게 넣는다.
- 문제가 없으면 issues는 빈 배열로 둔다.
- codexPrompt는 문제가 있을 때만 구체적으로 작성하고, 문제가 없으면 "수정 필요 없음"으로 둔다.
- 코드 수정 대상 파일을 단정하지 말고 후보만 제안한다.
- 작은 변경을 우선한다.`;

  const chunksText = retrievedChunks.map((c, i) => `[Chunk ${i+1}] Title: ${c.title}\nSnippet: ${c.snippet}`).join('\n\n');
  const userPrompt = `[Retrieved Evaluator Chunks]\n${chunksText || 'No specific rules retrieved.'}\n\n[Report Content to Evaluate]\n${JSON.stringify(reportContent, null, 2)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evaluation_result",
          schema: {
            type: "object",
            properties: {
              overallGrade: { type: "string", enum: ["pass", "watch", "fix"] },
              summary: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["meta_leak", "section_boundary", "repetition", "forbidden_expression", "vague_advice", "tone", "schema"] },
                    section: { type: "string", enum: ["headline", "basis", "summary", "work", "money", "relationships", "love", "health", "mind", "cautions", "action_tip", "overall"] },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    problem: { type: "string" },
                    evidence: { type: "string" },
                    suggestion: { type: "string" }
                  },
                  required: ["type", "section", "severity", "problem", "evidence", "suggestion"],
                  additionalProperties: false
                }
              },
              repeatAxis: {
                type: "object",
                properties: {
                  organize: { type: "number" },
                  confirm: { type: "number" },
                  slowDown: { type: "number" },
                  recovery: { type: "number" },
                  boundaryRole: { type: "number" },
                  emotionExpectation: { type: "number" },
                  bodySense: { type: "number" },
                  innerOrganizing: { type: "number" }
                },
                required: ["organize", "confirm", "slowDown", "recovery", "boundaryRole", "emotionExpectation", "bodySense", "innerOrganizing"],
                additionalProperties: false
              },
              codexPrompt: { type: "string" }
            },
            required: ["overallGrade", "summary", "issues", "repeatAxis", "codexPrompt"],
            additionalProperties: false
          },
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[SajuEvaluator] OpenAI API Error:', response.status, errorBody.slice(0, 500));
    throw new Error(`OpenAI evaluation failed with status ${response.status}`);
  }

  const result = await response.json();
  const contentText = result.choices?.[0]?.message?.content;
  if (!contentText) {
    throw new Error('No content returned from OpenAI');
  }

  try {
    return JSON.parse(contentText);
  } catch (e) {
    console.error('[SajuEvaluator] Failed to parse OpenAI JSON response');
    throw new Error('Invalid JSON format from OpenAI');
  }
}
