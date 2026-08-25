import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  getGoogleBackupSelectFields,
  GOOGLE_BACKUP_FIELD_MANIFEST,
  GOOGLE_BACKUP_TABLES,
} from '../supabase/functions/_shared/googleBackupFieldManifest.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

const expectedManifest = {
  reservations: [
    'id', 'reservation_date', 'branch', 'room', 'customer_name', 'start_at',
    'duration_minutes', 'end_at', 'warning_offset_minutes', 'tags', 'notes_text',
    'created_at', 'updated_at', 'google_event_id', 'owner_key',
    'regular_phone_last4', 'regular_id',
  ],
  work_events: [
    'id', 'reservation_id', 'event_type', 'scheduled_at', 'status',
    'tags_snapshot', 'memo_snapshot', 'created_at', 'updated_at',
  ],
  scheduler_work_logs: [
    'id', 'owner_key', 'week_start_date', 'date', 'start_time', 'end_time',
    'duration_minutes', 'branch', 'room', 'synced_at', 'created_at', 'updated_at',
  ],
  saju_profiles: [
    'id', 'local_key', 'name', 'birth_date', 'birth_time', 'gender', 'is_lunar',
    'is_leap_month', 'timezone', 'created_at', 'updated_at', 'user_id',
  ],
  saju_natal_snapshots: [
    'id', 'profile_id', 'year_stem', 'year_branch', 'month_stem', 'month_branch',
    'day_stem', 'day_branch', 'hour_stem', 'hour_branch', 'day_master', 'natal_data',
    'created_at', 'updated_at',
  ],
  saju_daily_snapshots: [
    'id', 'profile_id', 'target_date', 'daily_stem', 'daily_branch', 'computed_data',
    'created_at', 'updated_at',
  ],
  saju_fortune_reports: [
    'id', 'profile_id', 'daily_snapshot_id', 'report_date', 'report_version',
    'model_name', 'headline', 'summary', 'report_content', 'generated_at',
    'created_at', 'updated_at',
  ],
  push_subscriptions: [
    'id', 'device_id', 'endpoint', 'endpoint_hash', 'subscription', 'user_agent',
    'platform', 'notification_types', 'active', 'last_seen_at', 'last_test_sent_at',
    'last_error_at', 'last_error_message', 'created_at', 'updated_at',
    'notifications_enabled', 'work_time_enabled', 'work_time_start_hour',
    'work_time_end_hour', 'work_time_selected_date', 'owner_key',
  ],
}

test('Google backup manifest preserves the current eight-table export scope', () => {
  assert.deepEqual(GOOGLE_BACKUP_TABLES, Object.keys(expectedManifest))
  assert.deepEqual(GOOGLE_BACKUP_FIELD_MANIFEST, expectedManifest)
  assert.equal(GOOGLE_BACKUP_TABLES.includes('push_subscriptions'), true)
  assert.equal(GOOGLE_BACKUP_TABLES.includes('google_calendar_tokens'), false)
  assert.equal(GOOGLE_BACKUP_TABLES.includes('google_oauth_states'), false)
  assert.equal(GOOGLE_BACKUP_TABLES.includes('lead_sheet_backups'), false)
})

test('Google backup materializer selects only the explicit manifest fields', () => {
  const source = read('supabase/functions/_shared/googleBackup.ts')

  assert.match(source, /getGoogleBackupSelectFields\(tableName\)/)
  assert.doesNotMatch(source, /\.select\(\s*['"`]\*['"`]\s*\)/)
  for (const [tableName, fields] of Object.entries(expectedManifest)) {
    assert.equal(getGoogleBackupSelectFields(tableName), fields.join(','))
  }
  assert.throws(
    () => getGoogleBackupSelectFields('future_sensitive_table'),
    /Missing Google backup field manifest/,
  )
})
