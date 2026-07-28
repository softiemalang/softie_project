#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const defaults = { manifest: 'test/fixtures/astrology/de405/manifest.json', baseline: 'test/fixtures/astrology/de405/baseline.json', raw: 'test/fixtures/astrology/de405/raw-comparison.jsonl' }
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
export function calibrateInputs(args = defaults) { const manifest = read(args.manifest); const baseline = read(args.baseline); const present = fs.existsSync(args.raw); const result = { schemaVersion: 1, status: present ? 'ready_for_raw_recalculation' : 'blocked_by_missing_raw_cross_reference_evidence', inputs: { manifest: { path: path.resolve(args.manifest) }, baseline: { path: path.resolve(args.baseline) }, rawComparison: { path: path.resolve(args.raw), present } }, evidence: { manifestSampleCount: manifest.timestamps?.sampleCount, baselineSampleCount: baseline.sampleCount, numericPolicyMayBeWritten: false } }; if (baseline.sampleCount !== manifest.timestamps?.sampleCount) result.status = 'blocked_by_calibration_input_mismatch'; return result }
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) { const result = calibrateInputs(); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.status === 'ready_for_raw_recalculation' ? 0 : 2 }
