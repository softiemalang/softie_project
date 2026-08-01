# Softie personal reference external contract analysis

판정: `external_verification_incomplete`

신뢰도: `medium`

권장 행동: `preserve_until_external_verification_is_complete`

## 기준선

- branch: `main`
- HEAD: `2d699e82b4c2665b241ab697e712d20d22516e83`
- `origin/main...main`: `0 0`
- target: `src/saju/personal/softiePersonalReference.js`
- export: `SOFTIE_PERSONAL_REFERENCE`

## 로컬 계약

The target module is a versioned reference object for `/softie-fortune` and is not imported by the local source tree. The current UI does request `softiePersonalRag: true`, invokes `generate-fortune-report`, and the Edge Function builds a Softie Personal RAG draft for prompt guidance. This proves a related active contract, not that the target JavaScript object is the datastore payload.

## Git history

- `1af593ee`: introduced the target as a Softie personal fortune reference document.
- `2e7a994`: added the Softie personal RAG hook to `generate-fortune-report` using Google Discovery Engine search.
- No later local import, re-export, or explicit deprecation/consumer-termination record was found.

## GitHub

- Status: `partial`.
- Authenticated repository search was unavailable because the configured GitHub CLI credentials were invalid.
- Public exact-identifier search found no matching consumer.
- Private, inaccessible, or unlisted repositories remain unverified.

## Vercel

- Status: `partial`.
- Local `.vercel/project.json` identifies project `project-fp5ie`.
- Vercel CLI access did not return a readable account/project result, so production deployment, route bundle, environment-variable names, and archived/disabled state remain unverified.

## Supabase

- Status: `checked` for the linked project `txkqkvkwasfzapvcbezv`.
- Deployed function list shows `generate-fortune-report` as `ACTIVE`.
- The local function source reads `SOFTIE_PERSONAL_RAG_ENABLED`, `SOFTIE_PERSONAL_SEARCH_APP_ID`, `SOFTIE_PERSONAL_SEARCH_DATASTORE_ID`, and `GOOGLE_CLOUD_PROJECT_ID`, then calls Google Discovery Engine through a service-account token.
- Metadata-only database queries found `public.saju_fortune_reports`, no matching routines, and no storage buckets. No user rows or reference contents were read.
- The function's deployed source and external Discovery Engine datastore identity/content were not inspected.

## Contract assessment

The safe result is `external_verification_incomplete`. There is high-strength evidence for an active related `/softie-fortune` → Supabase Edge Function → external RAG path, but no evidence that the exact `softiePersonalReference.js` bytes are consumed externally. Because GitHub and Vercel access is incomplete and the external datastore was not inspected, the module must be preserved pending verification.

Unverified surfaces:

- authenticated GitHub repositories and legacy clients;
- Vercel production project/deployment and route bundle;
- Google Discovery Engine app/datastore identity and contents;
- deployed Edge Function source parity.

## Safety

- Secrets: names/existence only; values were not read or recorded.
- User rows, reference text, and embeddings: not read.
- External writes: none.
- Deployments: unchanged.
- Database changes: none.
- The target source file and all source/test/config files were unchanged.
