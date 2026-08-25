export function buildScheduledBackupOutcome({ backupData, backupResult }) {
  const metadata = backupData?.finalJson?.metadata
  const skippedTables = metadata?.skipped_tables

  if (!Array.isArray(skippedTables)) {
    throw new Error('Scheduled backup result is missing skipped_tables')
  }

  if (!backupResult || typeof backupResult.skipped !== 'boolean') {
    throw new Error('Scheduled backup result is missing upload status')
  }

  if (typeof backupData?.fileName !== 'string' || backupData.fileName === '') {
    throw new Error('Scheduled backup result is missing file name')
  }

  const partial = skippedTables.length > 0

  return {
    httpStatus: partial ? 500 : 200,
    body: {
      success: !partial,
      partial,
      skipped: backupResult.skipped,
      fileId: backupResult.fileId,
      fileName: backupData.fileName,
      skippedTables,
      metadata,
    },
  }
}
