const fs = require('fs');
let content = fs.readFileSync('GOOGLE_INTEGRATION.md', 'utf-8');

content = content.replace(
  '- **Google Drive (Manual Backup):** Exports important application data (scheduler, fortune, settings) as a JSON file and uploads it to a `softie_project/backups` folder in the user\'s Google Drive.',
  `- **Google Drive (Manual Backup):** Exports important application data as a JSON file and uploads it to \`softie_project/backups/manual/YYYY/\` in the user's Google Drive.
- **Google Drive (Scheduled Backup):** An automated Edge Function that runs daily to create a snapshot at \`softie_project/backups/daily/YYYY/YYYY-MM-DD.json\`. Skips if already exists.`
);

content = content.replace(
  '- `GOOGLE_SHEETS_LOG_SPREADSHEET_ID`: (Optional) If omitted, the app auto-creates/reuses a `softie_project_logs` spreadsheet.',
  `- \`GOOGLE_SHEETS_LOG_SPREADSHEET_ID\`: (Optional) If omitted, the app auto-creates/reuses a \`softie_project_logs\` spreadsheet.
- \`GOOGLE_BACKUP_USER_ID\`: The \`user_id\` (or \`deviceId\`) corresponding to the dedicated Google account in \`google_calendar_tokens\`. Used by the scheduled backup function to identify which token to use.
- \`BACKUP_CRON_SECRET\`: (Optional but recommended) A secret key to protect the \`google-drive-scheduled-backup\` endpoint from unauthorized external invocation.`
);

content = content.replace(
  '- `google-drive-backup`: Generates JSON backups and uploads them to Google Drive.',
  `- \`google-drive-backup\`: Generates manual JSON backups and uploads them to Google Drive.
- \`google-drive-scheduled-backup\`: Generates automated daily JSON backups and updates the Sheets dashboard/snapshots.`
);

content = content.replace(
  '   - `supabase functions deploy google-sheets-append-log`',
  `   - \`supabase functions deploy google-sheets-append-log\`
   - \`supabase functions deploy google-drive-scheduled-backup\``
);

const schedulingSection = `
## 12. Automated Backup Scheduling

The automated backup uses the \`google-drive-scheduled-backup\` Edge Function. To set it up to run at 00:05 KST daily (which is 15:05 UTC):

**1. Find your GOOGLE_BACKUP_USER_ID:**
Check the \`google_calendar_tokens\` table in your Supabase Dashboard. Find the row for your dedicated Softie Gmail account and copy its \`user_id\`.
\`supabase secrets set GOOGLE_BACKUP_USER_ID="<that-user-id>"\`

**2. Set a CRON Secret (Optional but Recommended):**
\`supabase secrets set BACKUP_CRON_SECRET="your-secure-random-string"\`

**3. Schedule via pg_cron (Supabase Native):**
Run the following SQL in your Supabase SQL Editor to schedule the backup using the \`pg_net\` extension:

\`\`\`sql
-- Schedule to run at 15:05 UTC (00:05 KST) every day
select cron.schedule(
  'daily-softie-backup',
  '5 15 * * *',
  $$
  select net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-drive-scheduled-backup',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer your-secure-random-string"}'::jsonb
  );
  $$
);
\`\`\`

Alternatively, you can trigger the Edge Function URL via an external service like GitHub Actions or cron-job.org, passing the \`Authorization: Bearer your-secure-random-string\` header.
`;

content += schedulingSection;

fs.writeFileSync('GOOGLE_INTEGRATION.md', content);
