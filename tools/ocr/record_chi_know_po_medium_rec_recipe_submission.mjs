#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'
import {
  validateChiKnowPoMediumRecRecipeSubmission,
} from '../../src/ocr/chiKnowPoMediumRecRecipeSubmission.js'

const output = path.resolve('artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/hf-job-submission-receipt.json')
const runnerSha256 = 'b92978758f4f91f5547dc48b78f4a37998a914baff4fd33dd31b87d0b6856129'
const receipt = {
  schema: 'chi-know-po-ppocrv6-medium-rec-hf-recipe-submission-v1',
  status: 'SUBMISSION_BLOCKED',
  submitted: false,
  jobId: null,
  observedAt: '2026-09-03',
  account: {
    username: 'softieproject',
    authenticated: true,
    proAccount: false,
    evidence: 'hf_whoami',
  },
  request: {
    operation: 'uv',
    flavor: 't4-small',
    timeout: '2h',
    python: '3.11',
    scriptTransport: 'inline_bundle',
    runnerSha256,
    localFilesystemPathArgument: false,
    secretsBinding: 'HF_TOKEN placeholder supplied through encrypted secret binding',
  },
  response: {
    httpStatus: 402,
    message: 'API request failed: 402 Payment Required',
    toolErrorCode: 'INVALID_ARGUMENT',
    jobsAfterSubmission: 0,
    evidence: 'mcp__codex_apps__hugging_face_hf_jobs operation=uv followed by operation=ps',
  },
  source: {
    datasetId: 'calfa-ai/chiknowpo',
    revision: 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87',
    partition: 'train',
    innerTrainDocumentIds: ['A-1', 'A-4', 'S-2', 'S-4', 'S-6', 'S-7', 'T-1'],
    innerDevDocumentIds: ['A-3', 'S-3', 'T-3'],
    heldOutInput: false,
    frozenGoldInput: false,
    detectionTouched: false,
  },
  checkpointEvidenceAvailable: false,
  decision: 'RECIPE_NOT_PROVEN',
  baseRetainedExplicitly: true,
  nextFineTuningGate: 'NOT_OPEN',
  boundaries: {
    BLOCK_OCR_ROUTE: true,
    OCRProvider: { enabled: false },
    activation: false,
    detectionTouched: false,
    frozenDomainGoldAccessed: false,
    heldOutAccessed: false,
    search: false,
    historicalSourceJudgment: false,
    semanticCorrection: false,
    silentFallback: false,
  },
  evidenceRefs: [
    'tools/ocr/ppocrv6_medium_rec_recipe_runner.py',
    'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/hf-disposable-recipe-job-spec.json',
  ],
}
receipt.contentSha256 = historicalOcrContentSha256({ ...receipt, contentSha256: null })
const validation = validateChiKnowPoMediumRecRecipeSubmission(receipt)
if (!validation.pass) throw new Error(`submission_receipt_invalid:${validation.errors.join(',')}`)
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ output, status: receipt.status, decision: receipt.decision, contentSha256: receipt.contentSha256 }, null, 2))
