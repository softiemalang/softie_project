# Google Ecosystem Integration MVP

This document outlines the current state of the Google Ecosystem integrations within the `softie_project`.

## 1. Overview of Completed MVP Features

- **Google Calendar (One-Way Creation):** Automatically creates a Google Calendar event when a reservation is saved or updated.
- **Google Drive (Manual Backup):** Exports important application data (scheduler, fortune, settings) as a JSON file and uploads it to a `softie_project/backups` folder in the user's Google Drive.
- **Google Sheets (Append Logging):** Best-effort logging of reservation events and backup completions to a designated Google Spreadsheet.

## 2. Architecture

- **Frontend Role:** The frontend only triggers actions via Supabase Edge Function invocations and displays the result status.
- **Backend Role:** All Google API calls are securely performed within Supabase Edge Functions.
- **Token Management:** The `_shared/googleToken.ts` helper handles loading and refreshing Google access tokens.
- **Security:** Google access tokens, refresh tokens, client secrets, and service role keys are **never** exposed to the frontend code.

## 3. Required Supabase Secrets

The following secrets must be set in the Supabase environment:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SHEETS_LOG_SPREADSHEET_ID` (Optional - if omitted, app auto-creates/reuses `softie_project_logs`)

## 4. Required OAuth Scopes

Users must consent to the following scopes during the OAuth flow:

- `https://www.googleapis.com/auth/calendar.events` (Calendar event creation)
- `https://www.googleapis.com/auth/drive.file` (Drive file access for app-created files)
- `https://www.googleapis.com/auth/spreadsheets` (Sheets append access)

## 5. Edge Functions

- `google-oauth-callback`: Handles the OAuth redirect, exchanges the code for tokens, and stores them.
- `google-calendar-create-event`: Creates calendar events and prevents duplicates.
- `google-drive-backup`: Generates JSON backups and uploads them to Google Drive.
- `google-sheets-append-log`: Appends rows to specific tabs. Auto-creates `softie_project_logs` if `GOOGLE_SHEETS_LOG_SPREADSHEET_ID` is missing.

## 6. Database Changes

- `reservations.google_event_id`: Added to track the linked Google Calendar event and prevent duplicate creations.
- `google_calendar_tokens`: Stores user OAuth tokens. **This table is explicitly excluded from Drive backups for security.**

## 7. Manual Deployment Checklist

1. Push database changes: `supabase db push`
2. Set all required secrets: `supabase secrets set GOOGLE_CLIENT_ID="..." ...`
3. Deploy Edge Functions:
   - `supabase functions deploy google-oauth-callback`
   - `supabase functions deploy google-calendar-create-event`
   - `supabase functions deploy google-drive-backup`
   - `supabase functions deploy google-sheets-append-log`
4. Reconnect the Google account in the app (due to added scopes).
5. Test Calendar, Drive, and Sheets features.

## 8. Manual Test Checklist

- [ ] Create a reservation in the app.
- [ ] Verify the event appears in Google Calendar.
- [ ] Verify `reservations.google_event_id` is populated in the database.
- [ ] Run a manual Drive backup from the app settings.
- [ ] Verify the JSON backup file is created in Google Drive.
- [ ] Verify new rows are appended to the `scheduler_logs` and `backup_logs` tabs in the configured Google Sheet.

## 9. Known Limitations

- Calendar sync is one-way (creation only); updates and deletions are not synced to Google Calendar.
- Drive restore functionality is not yet implemented.
- Sheets logging is best-effort (fire-and-forget); failures will not block core application flows.
- Fortune report logging is currently skipped due to identifier differences (uses `localKey` instead of `deviceId`).
- Existing users must reconnect their Google accounts when new scopes are added to the application.

## 10. Recommended Next Phases

- Implement a secure connection status check endpoint (to replace the current `localStorage` heuristic).
- Add sync status fields (e.g., `google_sync_status`, `google_sync_error`) to relevant tables.
- Implement a preview-only MVP for Drive restore (allowing users to see what will be restored before applying).
- Integrate Vertex AI/Gemini for advanced fortune report generation.
