/**
 * validationMetadata.js
 *
 * [핵심 원칙]
 * 검증 메타데이터는 명식/후보 계산 결과를 절대 변경하지 않으며,
 * 오직 계산 신뢰도 및 검증 상태의 보조 메타데이터로만 제공됩니다.
 */

export function attachValidationMetadata(result, validationContext = {}) {
  if (!result || typeof result !== 'object') {
    return result
  }

  const {
    lunarValidation = null,
    solarTermValidation = null,
    boundarySensitivity = null,
  } = validationContext

  const metadataSnapshot = {
    attachedAt: validationContext.attachedAt || 'deterministic_validation_timestamp',
    principleNote: '검증 메타데이터는 계산 결과를 절대 변경하지 않으며 보조 신뢰 지표로 제공됩니다.',
    lunarConversion: lunarValidation ? {
      scope: lunarValidation.scope || 'external_reference_dataset',
      status: lunarValidation.status || 'pending_validation',
      sourceNote: lunarValidation.sourceNote || 'KASI comparison pending',
      isDirectionalValidated: Boolean(lunarValidation.isDirectionalValidated),
    } : null,
    solarTermAccuracy: solarTermValidation ? {
      method: solarTermValidation.method || 'meeus-noaa-apparent-v1',
      thresholdMinutes: solarTermValidation.thresholdMinutes || 20,
      estimatedErrorMarginMinutes: solarTermValidation.estimatedErrorMarginMinutes || null,
      maxErrorObservedMinutes: solarTermValidation.maxErrorObservedMinutes || null,
      byTermErrorSummary: solarTermValidation.byTermErrorSummary || {},
    } : null,
    boundarySensitivity: boundarySensitivity ? {
      boundarySensitive: Boolean(boundarySensitivity.boundarySensitive),
      reasons: Array.isArray(boundarySensitivity.reasons) ? boundarySensitivity.reasons : [],
      notes: boundarySensitivity.notes || null,
    } : null,
  }

  // Attach strictly as read-only supplementary metadata without altering calculation output
  if (result.raw) {
    result.raw.validationMetadata = metadataSnapshot

    if (result.raw.saju?.raw?.boundaryContext && metadataSnapshot.solarTermAccuracy) {
      result.raw.saju.raw.boundaryContext.validationSnapshot = {
        thresholdMinutes: metadataSnapshot.solarTermAccuracy.thresholdMinutes,
        estimatedErrorMarginMinutes: metadataSnapshot.solarTermAccuracy.estimatedErrorMarginMinutes,
        reasons: metadataSnapshot.boundarySensitivity?.reasons || [],
      }
    }
  }

  return result
}
