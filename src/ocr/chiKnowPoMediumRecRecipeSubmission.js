import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_MEDIUM_REC_RECIPE_SUBMISSION_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-hf-recipe-submission-v1'

const HASH = /^[a-f0-9]{64}$/i
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const add = (errors, code) => { if (!errors.includes(code)) errors.push(code) }

export function checkChiKnowPoMediumRecRecipeSubmission(receipt) {
  const errors = []
  if (!isObject(receipt)) return ['submission_receipt_not_object']
  if (receipt.schema !== CHI_KNOW_PO_MEDIUM_REC_RECIPE_SUBMISSION_SCHEMA) add(errors, 'submission_schema_mismatch')
  if (receipt.status !== 'SUBMISSION_BLOCKED' || receipt.submitted !== false || receipt.jobId !== null) add(errors, 'submission_state_invalid')
  if (receipt.request?.operation !== 'uv' || receipt.request?.flavor !== 't4-small' || receipt.request?.timeout !== '2h' || receipt.request?.python !== '3.11' || receipt.request?.scriptTransport !== 'inline_bundle' || receipt.request?.localFilesystemPathArgument !== false || !isHash(receipt.request?.runnerSha256)) add(errors, 'submission_request_invalid')
  if (receipt.response?.httpStatus !== 402 || receipt.response?.message !== 'API request failed: 402 Payment Required' || receipt.response?.toolErrorCode !== 'INVALID_ARGUMENT' || receipt.response?.jobsAfterSubmission !== 0) add(errors, 'submission_response_invalid')
  if (receipt.account?.authenticated !== true || receipt.account?.proAccount !== false || receipt.account?.username !== 'softieproject') add(errors, 'submission_account_evidence_invalid')
  if (receipt.checkpointEvidenceAvailable !== false || receipt.decision !== 'RECIPE_NOT_PROVEN' || receipt.baseRetainedExplicitly !== true || receipt.nextFineTuningGate !== 'NOT_OPEN') add(errors, 'submission_no_result_state_invalid')
  if (receipt.source?.datasetId !== 'calfa-ai/chiknowpo' || receipt.source?.partition !== 'train' || receipt.source?.heldOutInput !== false || receipt.source?.frozenGoldInput !== false || receipt.source?.detectionTouched !== false) add(errors, 'submission_source_boundary_invalid')
  if (receipt.boundaries?.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, 'submission_BLOCK_OCR_ROUTE_changed')
  if (canonicalHistoricalOcrJson(receipt.boundaries?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'submission_OCRProvider_changed')
  for (const key of ['activation', 'detectionTouched', 'frozenDomainGoldAccessed', 'heldOutAccessed', 'search', 'historicalSourceJudgment', 'semanticCorrection', 'silentFallback']) {
    if (receipt.boundaries?.[key] !== false) add(errors, `submission_boundary_${key}_changed`)
  }
  if (!isHash(receipt.contentSha256) || receipt.contentSha256 !== historicalOcrContentSha256({ ...receipt, contentSha256: null })) add(errors, 'submission_content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

export function validateChiKnowPoMediumRecRecipeSubmission(receipt) {
  const errors = checkChiKnowPoMediumRecRecipeSubmission(receipt)
  return {
    pass: errors.length === 0,
    errors,
    decision: receipt?.decision || 'RECIPE_NOT_PROVEN',
    baseRetainedExplicitly: receipt?.baseRetainedExplicitly === true,
  }
}
