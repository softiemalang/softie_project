# Google Ecosystem Integration MVP

This document outlines the current state of the Google Ecosystem integrations within the `softie_project`.

## 1. Overview of Completed MVP Features

- **Google Calendar (One-Way Creation):** Automatically creates a Google Calendar event when a reservation is saved or updated.
- **Google Drive (Manual Backup):** Exports important application data (scheduler, fortune, settings) as a JSON file and uploads it to a `softie_project/backups` folder in the user's Google Drive.
- **Google Sheets (Append Logging):** Best-effort logging of reservation events and backup completions to a designated Google Spreadsheet.

## 2. Architecture & Security

- **Frontend Role:** The frontend only triggers actions via Supabase Edge Function invocations and displays the result status.
- **Backend Role:** All Google API calls are securely performed within Supabase Edge Functions.
- **Token Management:** The `_shared/googleToken.ts` helper handles loading and refreshing Google access tokens.
- **Security:** Google access tokens, refresh tokens, client secrets, and service role keys are **never** exposed to the frontend code.
- **Authentication & JWT Bypass:** 
  - The application currently authenticates users via `deviceId` / `localKey` rather than full Supabase Auth sessions. 
  - Therefore, the Google Edge Functions (`google-oauth-callback`, `google-calendar-create-event`, `google-drive-backup`, `google-sheets-append-log`) are deployed with `verify_jwt = false` in `supabase/config.toml`.
  - `google-oauth-callback` MUST bypass JWT because it receives external redirects from Google that do not contain a Supabase Authorization header.
  - **Safety Requirement:** Because JWT verification is disabled, each public Google function strictly validates the `userId`/`deviceId` parameter internally before performing any action.
- **OAuth Flow:** 
  - Frontend redirect starts at `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=...`
  - The `redirect_uri` MUST be the URL of the deployed `google-oauth-callback` Edge Function.
  - The Edge Function exchanges the code for a token, stores it, and redirects back to the `FRONTEND_URL`.
  - The frontend tracks its Google connection status using a separate `googleStatus` UI state, preventing conflicts with Web Push notification states.

## 3. Required Environment Variables & Secrets

**Frontend (Vercel / Vite env):**
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID.
- `VITE_GOOGLE_REDIRECT_URI`: The exact URL to the deployed `google-oauth-callback` Edge Function.

**Backend (Supabase Edge Functions):**
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret.
- `GOOGLE_REDIRECT_URI`: The exact URL to the deployed `google-oauth-callback` Edge Function (Must match the one provided by frontend).
- `FRONTEND_URL`: The URL of the deployed frontend (e.g., `https://softie-project.vercel.app`). Used by the Edge Function to redirect back after success.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Supabase API keys.
- `GOOGLE_SHEETS_LOG_SPREADSHEET_ID`: (Optional) If omitted, the app auto-creates/reuses a `softie_project_logs` spreadsheet.

## 4. Required OAuth Scopes

Users must consent to the following scopes during the OAuth flow:

- `https://www.googleapis.com/auth/calendar.events` (Calendar event creation)
- `https://www.googleapis.com/auth/drive.file` (Drive file access for app-created files)
- `https://www.googleapis.com/auth/spreadsheets` (Sheets append access)

## 5. Edge Functions

- `google-oauth-callback`: Handles the OAuth redirect, exchanges the code for tokens, and redirects back to `FRONTEND_URL`.
- `google-calendar-create-event`: Creates calendar events and prevents duplicates.
- `google-drive-backup`: Generates JSON backups and uploads them to Google Drive.
- `google-sheets-append-log`: Appends rows to specific tabs. Auto-creates `softie_project_logs` if `GOOGLE_SHEETS_LOG_SPREADSHEET_ID` is missing.

## 6. Database Changes

- `reservations.google_event_id`: Added to track the linked Google Calendar event and prevent duplicate creations.
- `google_calendar_tokens`: Stores user OAuth tokens. **This table is explicitly excluded from Drive backups for security.**

## 7. Manual Deployment Checklist

1. Push database changes: `supabase db push`
2. Set all required secrets in Supabase:
   ```bash
   supabase secrets set GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." GOOGLE_REDIRECT_URI="https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-oauth-callback" FRONTEND_URL="https://softie-project.vercel.app"
   ```
3. Set Vercel Env Vars:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_REDIRECT_URI` (Must match Supabase `GOOGLE_REDIRECT_URI`)
4. Deploy Edge Functions:
   - `supabase functions deploy google-oauth-callback`
   - `supabase functions deploy google-calendar-create-event`
   - `supabase functions deploy google-drive-backup`
   - `supabase functions deploy google-sheets-append-log`
5. Reconnect the Google account in the app.
6. Test Calendar, Drive, and Sheets features.

## 8. Manual Test Checklist

- [ ] Create a reservation in the app.
- [ ] Verify the event appears in Google Calendar.
- [ ] Verify `reservations.google_event_id` is populated in the database.
- [ ] Run a manual Drive backup from the app settings.
- [ ] Verify the JSON backup file is created in Google Drive.
- [ ] Verify new rows are appended to the `scheduler_logs` and `backup_logs` tabs in the configured Google Sheet.

## 9. Troubleshooting Google OAuth (redirect_uri & bad_oauth_state)

- **UNAUTHORIZED_NO_AUTH_HEADER:**
  If an Edge Function returns a "Missing authorization header" error, it means `verify_jwt = false` is missing in `supabase/config.toml`, or the function was deployed without the `--no-verify-jwt` flag. OAuth callbacks must allow unauthenticated redirects from Google, and the current app design requires other Google functions to accept deviceId instead of Supabase Auth.
- **Could not find the table 'public.google_calendar_tokens' in the schema cache:**
  If the OAuth callback fails with this error, it means the database migrations have not been pushed to the production Supabase database. Run `supabase db push` to apply the migrations.
- **Safari cannot connect to localhost / Redirects to localhost in production:** 
  If you see the app attempting to redirect to `http://localhost:5173/scheduler` in production, it means the `FRONTEND_URL` secret is missing from Supabase Edge Functions. Set it using `supabase secrets set FRONTEND_URL="https://your-app.vercel.app"`.
- **error=invalid_request & error_code=bad_oauth_state:** 
  This happens when the `redirect_uri` doesn't match what's configured in Google Cloud Console. Ensure `VITE_GOOGLE_REDIRECT_URI` (Frontend) and `GOOGLE_REDIRECT_URI` (Backend) are exactly identical and point to the `google-oauth-callback` Edge Function URL. Both must be added to the Google Cloud Console "Authorized redirect URIs".

## 10. Known Limitations

- Calendar sync is one-way (creation only); updates and deletions are not synced to Google Calendar.
- Drive restore functionality is not yet implemented.
- Sheets logging is best-effort (fire-and-forget); failures will not block core application flows.
- Fortune report logging is currently skipped due to identifier differences (uses `localKey` instead of `deviceId`).

## 11. Recommended Next Phases

- Implement a secure connection status check endpoint (to replace the current `localStorage` heuristic).
- Add sync status fields (e.g., `google_sync_status`, `google_sync_error`) to relevant tables.
- Implement a preview-only MVP for Drive restore (allowing users to see what will be restored before applying).
