import assert from 'node:assert/strict'
import test from 'node:test'

import { buildScheduledBackupOutcome } from '../supabase/functions/_shared/scheduledBackupResult.js'

const completeBackupData = {
  fileName: '2026-08-25.json',
  finalJson: {
    metadata: {
      row_counts: { reservations: 1 },
      skipped_tables: [],
    },
  },
}

test('scheduled backup reports complete success only when every table was gathered', () => {
  const outcome = buildScheduledBackupOutcome({
    backupData: completeBackupData,
    backupResult: { skipped: false, fileId: 'drive-file-1' },
  })

  assert.equal(outcome.httpStatus, 200)
  assert.equal(outcome.body.success, true)
  assert.equal(outcome.body.partial, false)
  assert.deepEqual(outcome.body.skippedTables, [])
  assert.equal(outcome.body.fileName, '2026-08-25.json')
})

test('scheduled backup exposes partial table failures instead of claiming success', () => {
  const skippedTables = ['saju_fortune_reports (permission denied)']
  const outcome = buildScheduledBackupOutcome({
    backupData: {
      ...completeBackupData,
      finalJson: {
        ...completeBackupData.finalJson,
        metadata: { ...completeBackupData.finalJson.metadata, skipped_tables: skippedTables },
      },
    },
    backupResult: { skipped: true, fileId: 'drive-file-1' },
  })

  assert.equal(outcome.httpStatus, 500)
  assert.equal(outcome.body.success, false)
  assert.equal(outcome.body.partial, true)
  assert.equal(outcome.body.skipped, true)
  assert.deepEqual(outcome.body.skippedTables, skippedTables)
})

test('scheduled backup fails closed when its result metadata is malformed', () => {
  assert.throws(
    () => buildScheduledBackupOutcome({
      backupData: { ...completeBackupData, finalJson: { metadata: {} } },
      backupResult: { skipped: false },
    }),
    /missing skipped_tables/,
  )
  assert.throws(
    () => buildScheduledBackupOutcome({
      backupData: completeBackupData,
      backupResult: {},
    }),
    /missing upload status/,
  )
})
