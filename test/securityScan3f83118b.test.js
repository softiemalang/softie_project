import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('corrective RLS removes the scan-era open rehearsal and band policies', () => {
  const migration = read('supabase/migrations/20260812090000_harden_security_scan_rls.sql')

  assert.doesNotMatch(migration, /create policy[\s\S]{0,180}rehearsal[\s\S]{0,240}(?:or true|with check \(true\)|using \(true\))/i)
  assert.match(migration, /rehearsal events authenticated owner select[\s\S]*to authenticated[\s\S]*auth\.uid\(\)/i)
  assert.match(migration, /rehearsal events authenticated owner insert[\s\S]*with check[\s\S]*auth\.uid\(\)/i)
  assert.match(migration, /rehearsal events authenticated owner update[\s\S]*using[\s\S]*auth\.uid\(\)[\s\S]*with check[\s\S]*auth\.uid\(\)/i)
  assert.match(migration, /revoke all on table public\.rehearsal_events from public, anon/i)

  assert.doesNotMatch(migration, /create policy "rooms authenticated read"/i)
  assert.doesNotMatch(migration, /create policy "members authenticated insert"/i)
  assert.doesNotMatch(migration, /create policy "availabilities authenticated read"/i)
  assert.match(migration, /rooms authenticated read owner or member[\s\S]*using \(public\.is_band_room_owner\(id\) or public\.is_band_room_member\(id\)\)/i)
  assert.match(migration, /members authenticated insert owner[\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*is_band_room_owner\(room_id\)/i)
  assert.match(migration, /revoke select on table public\.members from authenticated[\s\S]*grant select \(id, room_id, user_id, display_name, created_at\) on table public\.members to authenticated/i)
  assert.match(migration, /revoke update on table public\.members from authenticated[\s\S]*grant update \(display_name\) on table public\.members to authenticated/i)
  assert.match(migration, /drop function if exists public\.join_band_room_by_code\(text, text\)[\s\S]*create function public\.join_band_room_by_code[\s\S]*security definer[\s\S]*p_room_code/i)
  assert.match(migration, /revoke all on table public\.rooms, public\.members, public\.availabilities from public, anon/i)
})

test('public Saju and internal test surfaces are bounded or fail closed', () => {
  const rls = read('supabase/migrations/20260812090000_harden_security_scan_rls.sql')
  const natalRls = read('supabase/migrations/20260812020105_close_public_saju_natal_snapshot_read.sql')
  const generate = read('supabase/functions/generate-fortune-report/index.ts')
  const knowledge = read('supabase/functions/saju-knowledge-test/index.ts')
  const evaluator = read('supabase/functions/saju-evaluator-test/index.ts')
  const profile = read('supabase/functions/get-softie-saju-profile/index.ts')
  const api = read('src/saju/api.js')
  const page = read('src/saju/SoftieFortunePage.jsx')

  assert.match(knowledge, /requireInternalFunctionSecret[\s\S]*SAJU_INTERNAL_TEST_SECRET/)
  assert.match(evaluator, /requireInternalFunctionSecret[\s\S]*SAJU_INTERNAL_TEST_SECRET/)
  assert.match(rls, /revoke all on table public\.saju_report_evaluations, public\.saju_evaluation_batches from public, anon, authenticated/i)
  assert.match(profile, /select\('id, name, birth_date, birth_time, gender'\)/)
  assert.doesNotMatch(profile, /select\('\*'\)/)
  assert.match(rls, /drop policy if exists "Saju profiles public select for public profile"/i)
  assert.match(rls, /revoke select on table public\.saju_profiles from public, anon/i)
  assert.match(rls, /drop policy if exists "Saju daily snapshots public select for public profile"/i)
  assert.match(rls, /get_public_saju_daily_snapshot\(uuid, date\)/i)
  assert.match(natalRls, /drop policy if exists "Saju natal snapshots public select for public profile"/i)
  assert.match(natalRls, /revoke select on table public\.saju_natal_snapshots from public, anon/i)

  assert.match(generate, /saju_fortune_generation_locks/)
  assert.match(generate, /if \(forceGenerate\)[\s\S]{0,160}Public report regeneration is not available/)
  assert.match(generate, /if \(finalResponse\?\.content[\s\S]*&& !isSoftiePublic\)/)
  assert.match(generate, /Retaining the lock until expiry after a failed generation/)
  assert.match(generate, /stripPublicDebug\(savedReport\.report_content\)/)
  assert.match(rls, /coalesce\(r\.report_content, '\{\}'::jsonb\) - 'debug'/)
  assert.match(rls, /revoke all on table public\.saju_fortune_reports from public, anon/i)
  assert.match(rls, /drop function if exists public\.get_public_saju_fortune_report\(uuid, date, text\)[\s\S]*create function public\.get_public_saju_fortune_report/i)
  assert.match(api, /rpc\('get_public_saju_fortune_report'/)
  assert.match(api, /rpc\('get_public_saju_fortune_history'/)
  assert.match(api, /rpc\('get_public_saju_fortune_report_by_id'/)
  assert.match(api, /rpc\('get_public_saju_daily_snapshot'/)
  assert.match(api, /from\('saju_daily_snapshots'\)[\s\S]*select\('id, profile_id, target_date, daily_stem, daily_branch, computed_data, created_at, updated_at'\)/)
  assert.doesNotMatch(api, /from\('saju_daily_snapshots'\)\s*\.select\('\*'\)/)
  assert.doesNotMatch(page, /getFortuneReport\(/)
  assert.doesNotMatch(page, /getDailySnapshot\(/)
  assert.doesNotMatch(page, /getNatalSnapshot\(|createNatalSnapshot\(|createDailySnapshot\(/)
  assert.match(page, /오늘의 운세 스냅샷이 아직 준비되지 않았어요/)
})

test('caller-selected identities are bound to authenticated subjects', () => {
  const spotifyStart = read('supabase/functions/spotify-oauth-start/index.ts')
  const spotifyControl = read('supabase/functions/spotify-player-control/index.ts')
  const spotifyCallback = read('supabase/functions/spotify-oauth-callback/index.ts')
  const kakao = read('src/lib/kakaoMessage.js')
  const kakaoCreate = read('supabase/functions/kakao-calendar-create-event/index.ts')
  const kakaoUpdate = read('supabase/functions/kakao-calendar-update-event/index.ts')
  const kakaoDelete = read('supabase/functions/kakao-calendar-delete-event/index.ts')

  assert.match(spotifyStart, /if \(!bearerToken \|\| bearerToken === anonKey\)/)
  assert.match(spotifyStart, /if \(user\.id !== normalizedUserId\)/)
  assert.match(spotifyControl, /if \(!bearerToken \|\| bearerToken === anonKey\)/)
  assert.match(spotifyControl, /if \(user\.id !== normalizedUserId\)/)
  assert.match(spotifyCallback, /used_at/)
  assert.match(spotifyCallback, /\.is\('used_at', null\)/)

  assert.match(kakao, /!state[\s\S]*typeof state\.nonce !== 'string'[\s\S]*state\.nonce !== storedNonce[\s\S]*state\.reason !== 'memo'/)
  for (const source of [kakaoCreate, kakaoUpdate, kakaoDelete]) {
    assert.match(source, /requestedOwnerKey && requestedOwnerKey !== user\.id/)
    assert.match(source, /existing\.owner_key !== user\.id/)
  }
})

test('legacy local storage is not silently uploaded across signed-in identities', () => {
  const rehearsalPage = read('src/pages/RehearsalCalendarPage.jsx')
  const rehearsalApi = read('src/rehearsals/api.js')
  const schedulerApi = read('src/scheduler/api.js')
  const schedulerPage = read('src/scheduler/TodaySchedulerPage.jsx')

  assert.doesNotMatch(rehearsalPage, /linkLocalRehearsalEventsToUser/)
  assert.doesNotMatch(rehearsalApi, /claim_rehearsal_events|linkUnownedRehearsalsToOwner|\.is\(['"]owner_key['"],\s*null\)/)
  assert.doesNotMatch(schedulerApi, /migrateLocalWorkLogsToSupabase/)
  assert.doesNotMatch(schedulerPage, /migrateLocalWorkLogsToSupabase|loadWorkLogs/)
  assert.match(schedulerPage, /legacy scheduler:work-logs has no authenticated owner binding/i)
})

test('scheduled privileged backup fails closed when its secret is absent', () => {
  const source = read('supabase/functions/google-drive-scheduled-backup/index.ts')
  const docs = read('GOOGLE_INTEGRATION.md')
  const generator = read('patch_readme.cjs')

  assert.match(source, /if \(!cronSecret\)[\s\S]*status: 503/)
  assert.match(source, /authHeader !== `Bearer \$\{cronSecret\}`/)
  assert.match(docs, /BACKUP_CRON_SECRET`: Required/i)
  assert.match(generator, /BACKUP_CRON_SECRET\\`\: Required/i)
})
