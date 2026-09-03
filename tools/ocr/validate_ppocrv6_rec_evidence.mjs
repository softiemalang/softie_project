#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import {
  CHI_KNOW_PO_CORPUS_ID,
  FROZEN_GOLD_CORPUS_ID,
  HISTORICAL_OCR_PACKET_SCHEMA,
  OCRProvider,
  PP_OCRV6_REC_WORKER_SPECS,
  checkHistoricalOcrComponent,
  canonicalHistoricalOcrJson,
  evaluateHistoricalOcrComponentPromotion,
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (!value.startsWith('--')) return pairs
  pairs.push([value.slice(2), values[index + 1]])
  return pairs
}, []))

const required = key => {
  if (!args[key]) throw new Error(`missing_argument:${key}`)
  return args[key]
}

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

const clone = value => structuredClone(value)

const variantSpec = variant => {
  const spec = PP_OCRV6_REC_WORKER_SPECS.find(item => item.modelVariant === variant)
  if (!spec) throw new Error(`unknown_recognition_variant:${variant}`)
  return clone(spec)
}

const corporaFor = validation => [
  {
    corpusId: CHI_KNOW_PO_CORPUS_ID,
    role: 'chi_know_po_independent_validation',
    required: true,
    frozen: true,
    availability: 'not_supplied',
    manifestPath: null,
    manifestSha256: null,
    caseCount: null,
    evidenceRefs: [],
    localOnly: true,
  },
  {
    corpusId: FROZEN_GOLD_CORPUS_ID,
    role: 'existing_frozen_gold_independent_validation',
    required: true,
    frozen: true,
    availability: 'supplied',
    manifestPath: 'external-frozen-gold/historical-ocr-recognition-gold-v1/result-2026-09-02.json',
    manifestSha256: validation.expected.manifestSha256,
    caseCount: validation.expected.caseCount,
    evidenceRefs: [
      'external-frozen-gold/historical-ocr-recognition-gold-v1/result-2026-09-02.json',
      'tools/ocr/ppocrv6_rec_adapter.py',
    ],
    localOnly: true,
  },
]

const closeEnough = (left, right) => typeof left === 'number' && typeof right === 'number' && Math.abs(left - right) <= 1e-3

const recomputeRunEvidence = (run, variant) => {
  const errors = []
  const lines = Array.isArray(run.lineResults) ? run.lineResults : []
  const runs = lines.flatMap(line => Array.isArray(line.runs) ? line.runs.map(item => ({ ...item, caseId: line.caseId, lineId: line.lineId })) : [])
  const add = code => { if (!errors.includes(code)) errors.push(code) }
  if (lines.length !== 4) add('line_count_not_four')
  if (runs.length !== 8) add('run_count_not_eight')
  const exactMatchRuns = runs.filter(item => item.exactMatch === true).length
  const totalEditDistance = runs.reduce((sum, item) => sum + Number(item.editDistance || 0), 0)
  const totalGoldCharacters = runs.reduce((sum, item) => sum + Number(item.goldCharacterCount || 0), 0)
  const confidenceRuns = runs.filter(item => item.confidencePresent === true)
  const latencies = runs.map(item => item.latencyMs)
  const computedOutputSha256 = historicalOcrContentSha256({
    variant,
    adapterParametersSha256: run.candidate?.adapterParametersSha256,
    runs: runs.map(item => ({
      caseId: item.caseId,
      lineId: item.lineId,
      repeat: item.repeat,
      predictionTextSha256: item.predictionTextSha256,
      predictionTextLength: item.predictionTextLength,
    })),
  })
  const computedInputSha256 = historicalOcrContentSha256({
    goldSetSha256: run.conditions?.sourceGoldSetSha256,
    lines: lines.map(line => ({
      caseId: line.caseId,
      lineId: line.lineId,
      bbox: line.bbox,
      sourceCropPixelSha256: line.sourceCropPixelSha256,
      sourceCropDimensions: line.sourceCropDimensions,
      orientation: line.orientation,
    })),
    adapterParametersSha256: run.candidate?.adapterParametersSha256,
  })
  if (run.validation?.outputSha256 !== computedOutputSha256) add('output_hash_not_recomputed')
  if (run.validation?.inputSha256 !== computedInputSha256) add('input_hash_not_recomputed')
  if (run.validation?.reproducibility?.outputSha256s?.[0] !== computedOutputSha256 || run.validation?.reproducibility?.outputSha256s?.[1] !== computedOutputSha256) add('reproducibility_hash_not_recomputed')
  if (run.aggregate?.runsAttempted !== runs.length) add('aggregate_run_count_mismatch')
  if (run.aggregate?.exactMatchRuns !== exactMatchRuns) add('aggregate_exact_count_mismatch')
  if (!closeEnough(run.aggregate?.exactMatchRate, exactMatchRuns / runs.length)) add('aggregate_exact_rate_mismatch')
  if (!closeEnough(run.aggregate?.characterErrorRate, totalEditDistance / totalGoldCharacters)) add('aggregate_cer_mismatch')
  if (!closeEnough(run.aggregate?.wordErrorRate, (runs.length - exactMatchRuns) / runs.length)) add('aggregate_wer_mismatch')
  if (run.aggregate?.confidencePresentRuns !== confidenceRuns.length) add('aggregate_confidence_count_mismatch')
  if (confidenceRuns.length > 0) {
    const confidences = confidenceRuns.map(item => item.confidence)
    if (!closeEnough(run.aggregate?.confidenceMean, confidences.reduce((sum, value) => sum + value, 0) / confidences.length)) add('aggregate_confidence_mean_mismatch')
    if (!closeEnough(run.aggregate?.confidenceMin, Math.min(...confidences))) add('aggregate_confidence_min_mismatch')
    if (!closeEnough(run.aggregate?.confidenceMax, Math.max(...confidences))) add('aggregate_confidence_max_mismatch')
  }
  if (run.aggregate?.repeatTextStableLines !== lines.filter(line => line.repeatTextStable === true).length) add('aggregate_text_stability_mismatch')
  if (run.aggregate?.repeatConfidenceStableLines !== lines.filter(line => line.repeatConfidenceStable === true).length) add('aggregate_confidence_stability_mismatch')
  if (latencies.length > 0) {
    const meanLatency = latencies.reduce((sum, value) => sum + value, 0) / latencies.length
    if (!closeEnough(run.aggregate?.latencyMeanMs, meanLatency)) add('aggregate_latency_mean_mismatch')
    if (!closeEnough(run.aggregate?.latencyMinMs, Math.min(...latencies))) add('aggregate_latency_min_mismatch')
    if (!closeEnough(run.aggregate?.latencyMaxMs, Math.max(...latencies))) add('aggregate_latency_max_mismatch')
  }
  return { pass: errors.length === 0, errors, recomputed: { exactMatchRuns, totalEditDistance, totalGoldCharacters, computedInputSha256, computedOutputSha256 } }
}

const validateVariant = async path => {
  const run = await readJson(path)
  const variant = run.candidate?.model?.modelId?.includes('_medium_') ? 'medium' : 'small'
  const worker = variantSpec(variant)
  if (run.schema !== 'historical-ocr-ppocrv6-rec-run-v1') throw new Error(`run_schema_invalid:${path}`)
  if (run.candidate?.workerId !== worker.workerId) throw new Error(`worker_id_mismatch:${path}`)
  if (run.validation?.component !== 'rec' || run.validation?.workerId !== worker.workerId) throw new Error(`validation_identity_invalid:${path}`)
  if (run.routeDecision?.BLOCK_OCR_ROUTE !== true || run.routeDecision?.OCRProvider?.enabled !== false) throw new Error(`route_boundary_invalid:${path}`)
  if (run.routeDecision?.operationalActivation !== false) throw new Error(`activation_boundary_invalid:${path}`)
  const runConsistency = recomputeRunEvidence(run, variant)
  if (!runConsistency.pass) throw new Error(`run_consistency_failed:${path}:${runConsistency.errors.join(',')}`)

  const acceptance = run.acceptanceCriteria?.rec
  if (!acceptance) throw new Error(`acceptance_missing:${path}`)
  const corpora = corporaFor(run.validation)
  const componentEvidence = {
    component: 'rec',
    workerId: worker.workerId,
    verificationMode: 'independent_per_component',
    acceptance,
    // A failed frozen-gold sub-gate is not reported as component VERIFIED;
    // a missing CHI-KNOW-PO validation also keeps the overall component gate
    // UNKNOWN/BLOCKED instead of allowing a partial promotion.
    status: 'UNKNOWN',
    outcome: 'UNKNOWN',
    validations: [clone(run.validation)],
    unknowns: ['CHI-KNOW-PO_validation_deferred'],
    conflicts: [],
  }
  const promotion = evaluateHistoricalOcrComponentPromotion({
    component: 'rec',
    evidence: componentEvidence,
    worker,
    corpora,
    acceptance,
  })
  const validatorErrors = checkHistoricalOcrComponent(componentEvidence, {
    component: 'rec',
    worker,
    corpora,
    acceptance,
  })
  return {
    variant,
    worker,
    sourceRun: path,
    runConsistency,
    qwenBaseline: clone(run.suite?.qwen),
    frozenGoldValidation: {
      validationId: run.validation.validationId,
      status: run.validation.status,
      exactMatchRuns: run.aggregate.exactMatchRuns,
      exactMatchRate: run.aggregate.exactMatchRate,
      characterErrorRate: run.aggregate.characterErrorRate,
      wordErrorRate: run.aggregate.wordErrorRate,
      confidencePresentRuns: run.aggregate.confidencePresentRuns,
      confidencePresentRate: run.aggregate.confidencePresentRate,
      confidenceMean: run.aggregate.confidenceMean,
      confidenceMin: run.aggregate.confidenceMin,
      confidenceMax: run.aggregate.confidenceMax,
      repeatTextStableLines: run.aggregate.repeatTextStableLines,
      repeatConfidenceStableLines: run.aggregate.repeatConfidenceStableLines,
      latencyMeanMs: run.aggregate.latencyMeanMs,
      latencyMinMs: run.aggregate.latencyMinMs,
      latencyMaxMs: run.aggregate.latencyMaxMs,
      wallTimeMs: run.aggregate.wallTimeMs,
      cpuSeconds: run.aggregate.cpuSeconds,
      loadTimeMs: run.aggregate.loadTimeMs,
      peakRssMiB: run.aggregate.peakRssMiB,
      swap: clone(run.aggregate.swap),
    },
    chiKnowPo: {
      status: 'UNKNOWN',
      decision: 'deferred_until_recognition_result_review',
      reason: 'User boundary defers CHI-KNOW-PO expansion until both recognition variants have been measured.',
    },
    contractPromotion: promotion,
    componentValidator: {
      pass: validatorErrors.length === 0,
      errors: validatorErrors,
    },
    activation: {
      enabled: false,
      active: false,
      productionActivation: false,
      decision: 'separate_activation_decision_required',
    },
  }
}

const main = async () => {
  const small = await validateVariant(required('small'))
  const medium = await validateVariant(required('medium'))
  const result = {
    schema: 'historical-ocr-ppocrv6-rec-contract-evidence-v1',
    status: 'closed_record',
    component: 'rec',
    sourceAdapter: 'tools/ocr/ppocrv6_rec_adapter.py',
    routeBoundary: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider,
      semanticCorrection: false,
      search: false,
      historicalSourceJudgment: false,
      silentFallback: false,
    },
    deferredWork: {
      det: 'not_started_after_recognition_floor_failure',
      chiKnowPoExpansion: 'not_started_after_recognition_floor_failure',
      activation: 'separate_activation_decision_required',
    },
    deterministicPacket: {
      schema: HISTORICAL_OCR_PACKET_SCHEMA,
      implementation: 'src/ocr/historicalOcrTeam.js',
      packetHash: 'recursive_key_sorted_canonical_json_plus_lf_sha256',
      preservation: 'caller-provided OCR_REQUIRED handoff and promoted geometry/table-grid remain API inputs and are not changed by this recognition-only evidence run',
    },
    qwenBaseline: {
      ...small.qwenBaseline,
      source: small.qwenBaseline?.recordPath,
    },
    variants: { small, medium },
    retention: {
      rawPredictionText: false,
      rawModelOutput: false,
      rawPixels: false,
      qwenRawPredictionTextReconstructed: false,
    },
  }
  result.contentSha256 = historicalOcrContentSha256(result)
  await writeFile(required('output'), canonicalHistoricalOcrJson(result), 'utf8')
  console.log(JSON.stringify({
    status: 'written',
    output: required('output'),
    variants: Object.fromEntries([small, medium].map(item => [item.variant, {
      frozenGoldValidation: item.frozenGoldValidation.status,
      contractPromotion: item.contractPromotion.status,
      componentValidatorPass: item.componentValidator.pass,
      reasonCodes: item.contractPromotion.reasonCodes,
    }])),
    contentSha256: result.contentSha256,
  }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
