#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { assessVerifiedAstrologyReadiness, assertActivationBoundary, canonicalSha256, READINESS_REASON_CODES } from '../src/astrology/verifiedAstrologyReadiness.js'
const path = 'artifacts/astrology-verified-readiness-v1.json'
const parsed = JSON.parse(await readFile(path, 'utf8'))
const failures = []
for (const item of parsed.cases || []) {
  if (!assertActivationBoundary(item.assessment)) failures.push(`${item.id}:activation_boundary`)
  if (item.expectedReason && !item.assessment.reasonCodes.includes(item.expectedReason)) failures.push(`${item.id}:missing_expected_reason`)
  for (const reason of item.assessment.reasonCodes) if (!READINESS_REASON_CODES.includes(reason)) failures.push(`${item.id}:unregistered:${reason}`)
}
const materialized = { schemaVersion: parsed.schemaVersion, contract: parsed.contract, cases: parsed.cases }
if (canonicalSha256(materialized) !== parsed.evidenceSha256) failures.push('evidence_sha256_mismatch')
if (parsed.byteIdentity !== true) failures.push('byte_identity_not_verified')
if (failures.length) { console.error(JSON.stringify({ pass: false, failures }, null, 2)); process.exitCode = 1 } else console.log(JSON.stringify({ pass: true, cases: parsed.cases.length, evidenceSha256: parsed.evidenceSha256, activation: 'blocked' }, null, 2))
