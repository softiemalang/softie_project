export function assertSajuBackupOwnerBinding(profile, googleBackupUserId) {
  const profileOwnerId = profile?.user_id

  if (
    typeof profileOwnerId !== 'string' ||
    profileOwnerId.trim() === '' ||
    typeof googleBackupUserId !== 'string' ||
    googleBackupUserId.trim() === '' ||
    profileOwnerId !== googleBackupUserId
  ) {
    throw new Error('Saju profile owner does not match Google backup user')
  }
}
