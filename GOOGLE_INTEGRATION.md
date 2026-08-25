# Google integrations

이 문서는 현재 checkout의 Google 연동 경계를 가리키는 최소 통합 문서다. 실행 가능한 source of truth는 다음 파일이다.

- Frontend 호출: [`src/scheduler/googleApi.js`](src/scheduler/googleApi.js), [`src/lib/googleApi.js`](src/lib/googleApi.js)
- Supabase 함수 설정: [`supabase/config.toml`](supabase/config.toml)
- OAuth 인증·state: [`supabase/functions/_shared/googleManualAuth.ts`](supabase/functions/_shared/googleManualAuth.ts), [`supabase/functions/_shared/googleOAuth.ts`](supabase/functions/_shared/googleOAuth.ts), `supabase/functions/google-oauth-*/`
- Token/Google API 처리: `supabase/functions/_shared/googleToken.ts`, `supabase/functions/_shared/googleBackup.ts`, `supabase/functions/_shared/googleSheets.ts`
- Database schema와 권한: `supabase/migrations/`

이 문서는 원격 배포 상태, Supabase secrets, Vercel 환경변수, Google Cloud Console 설정, pg_cron 등록 상태를 증명하지 않는다.

## Current authentication boundary

- Google 수동 연동은 `deviceId`/`localKey`를 인증 수단으로 사용하지 않는다. Frontend가 Supabase session의 bearer token과 `userId`를 보내고, Edge Function이 `auth.getUser()`로 token을 검증한 뒤 body의 `userId`와 일치하는지 확인한다.
- `google-oauth-callback`만 Google의 외부 redirect를 받기 때문에 gateway JWT 검증이 꺼져 있다. 정확한 함수별 `verify_jwt` 값은 [`supabase/config.toml`](supabase/config.toml)을 기준으로 한다.
- Callback은 `google_oauth_states`의 만료·일회성 사용·허용된 return origin을 확인한 뒤 token을 교환하고 저장한다.
- Google access/refresh token과 service-role key는 frontend에 전달하지 않는다. Token은 Edge Function의 service-role 경로에서만 읽고 갱신한다.

## OAuth contract

`src/scheduler/googleApi.js`가 `google-oauth-start`를 호출하고, 함수가 Google authorization URL을 생성한다. Google은 `google-oauth-callback`으로 redirect하며, callback의 `GOOGLE_REDIRECT_URI`와 state가 token 교환·저장에 사용된다.

현재 요청 scope는 다음과 같다.

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/spreadsheets`

OAuth state와 redirect origin의 허용 목록은 [`supabase/functions/_shared/googleOAuth.ts`](supabase/functions/_shared/googleOAuth.ts)의 실행 코드를 따른다. `FRONTEND_URL`/`SITE_URL`은 오래된 state 또는 허용 origin이 없는 경우의 callback fallback이다.

## Edge Functions

현재 Google 함수 표면은 `supabase/functions/`와 `supabase/config.toml`을 함께 확인한다.

- OAuth: `google-oauth-start`, `google-oauth-callback`, `google-connection-status`
- Calendar: `google-calendar-create-event`, `google-calendar-update-event`, `google-calendar-delete-event`
- Manual Drive: `google-drive-backup`, `google-drive-rehearsal-backup`
- Sheets: `google-sheets-append-log`
- Scheduled Drive: `google-drive-scheduled-backup`, `google-drive-scheduler-scheduled-backup`, `google-drive-rehearsal-scheduled-backup`, `google-drive-saju-daily-report-backup`

수동 함수는 handler-level bearer/user binding을 유지해야 한다. Scheduled 함수는 Supabase Auth 대신 `BACKUP_CRON_SECRET`을 확인하고 각 함수가 요구하는 owner/profile secret을 사용한다.

## Environment names

값 자체는 이 문서나 repository에 기록하지 않는다.

Frontend에서 설정 존재 여부를 확인하는 값:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_REDIRECT_URI`

Edge Function runtime에서 사용하는 값:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` 또는 callback fallback용 `SITE_URL`
- `GOOGLE_SHEETS_LOG_SPREADSHEET_ID` 및 Saju 전용 `GOOGLE_SAJU_SHEETS_LOG_SPREADSHEET_ID`
- `GOOGLE_BACKUP_USER_ID`, `BACKUP_CRON_SECRET`
- Scheduled 특화 값: `SCHEDULER_BACKUP_OWNER_KEY`, `REHEARSAL_BACKUP_OWNER_KEY`, `SOFTIE_SAJU_PROFILE_ID`

`VITE_GOOGLE_*` 값은 현재 client-side 설정 존재 여부 확인에 사용되고, 실제 authorization URL의 client ID·redirect URI source는 backend `GOOGLE_*` 값이다.

## Data and backup boundary

- `google_calendar_tokens`에는 Google token이 저장되고, `google_oauth_states`에는 일회성 OAuth state가 저장된다. 이 두 테이블의 접근권한은 migration과 현재 DB 권한 정의를 기준으로 한다.
- `reservations.google_event_id`와 `rehearsal_events.google_calendar_event_id`가 Google Calendar 연결을 보존한다. rehearsal 쪽에는 별도 sync/Drive backup 상태 필드가 있다.
- `google-drive-backup`은 인증된 사용자 범위의 manual backup을 수행한다. `google-drive-scheduled-backup`은 전역 scheduled backup이며, 다른 scheduled 함수들은 scheduler·rehearsal·Saju 범위를 별도로 처리한다.
- 현재 generic backup materializer는 `google_calendar_tokens`를 export 목록에서 제외하지만, 전역 경로의 export 목록에는 `push_subscriptions`가 포함될 수 있다. 백업 데이터의 민감도·보존·복구 정책은 별도 보안 검토 대상이며 이 문서는 안전성을 보증하지 않는다.

## Current behavior and limits

- 동기화 방향은 앱에서 Google로만 향한다. Calendar는 create/update/delete를 지원하며 Google에서 앱으로 역동기화하지 않는다.
- Drive restore는 구현되어 있지 않다.
- Sheets logging은 호출 경로에 따라 await 여부와 오류 표시가 다르므로, 모든 logging 실패가 동일하게 core flow를 차단한다고 가정하지 않는다.
- 연결 표시의 local cache는 편의 상태일 뿐 권위 있는 인증 근거가 아니다. 현재 scheduler 경로는 `google-connection-status`로 서버 확인을 수행한다.

## External-state boundary

다음은 repository source만으로 현재 값을 확정할 수 없는 별도 후속 항목이다.

- 배포된 Edge Function의 실제 `verify_jwt`와 코드 revision
- Supabase secrets와 remote migration history
- Vercel environment variables 및 실제 frontend origin
- Google Cloud Console의 OAuth client/redirect URI 등록
- Supabase pg_cron 또는 외부 scheduler의 실제 등록·실행 상태

## Separate follow-ups

다음 항목은 이 문서 정리에서 해결하거나 결론내리지 않는다.

- `push_subscriptions` payload를 Google Drive backup에 포함할지와 보존·접근 정책
- `google_calendar_tokens`의 저장·rotation·remote encryption 정책
- 배포된 함수와 local `supabase/config.toml`·migration의 parity
