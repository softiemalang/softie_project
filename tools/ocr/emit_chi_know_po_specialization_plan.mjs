#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildChiKnowPoSpecializationPlan,
  checkChiKnowPoSpecializationPlan,
} from '../../src/ocr/chiKnowPoSpecialization.js'
import { canonicalHistoricalOcrJson } from '../../src/ocr/historicalOcrTeam.js'

const outputDir = resolve(process.cwd(), 'artifacts/historical-ocr-chi-know-po-specialization')
const outputPath = resolve(outputDir, 'plan.json')
const plan = buildChiKnowPoSpecializationPlan()
const errors = checkChiKnowPoSpecializationPlan(plan)
if (errors.length > 0) throw new Error(`plan_invalid:${errors.join(',')}`)
mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, canonicalHistoricalOcrJson(plan), 'utf8')
console.log(JSON.stringify({
  outputPath: 'artifacts/historical-ocr-chi-know-po-specialization/plan.json',
  status: plan.status,
  corpusBytesAvailable: plan.corpus.bytesAvailable,
  splitMaterialized: plan.corpus.splitMaterialized,
  fineTuning: plan.fineTuningGate.status,
  activation: plan.activationGate.status,
  BLOCK_OCR_ROUTE: plan.routeBoundary.BLOCK_OCR_ROUTE,
  OCRProviderEnabled: plan.routeBoundary.OCRProvider.enabled,
}, null, 2))
