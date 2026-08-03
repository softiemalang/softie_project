#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { assessVerifiedAstrologyReadiness, assertActivationBoundary, canonicalSha256, READINESS_REASON_CODES } from '../src/astrology/verifiedAstrologyReadiness.js'
const path = 'artifacts/astrology-verified-readiness-v1.json'
const parsed = JSON.parse(await readFile(path, 'utf8'))
const integrityPath = 'artifacts/astrology-verified-readiness-v1.integrity.json'
const integrity = JSON.parse(await readFile(integrityPath, 'utf8'))
const raw = await readFile(path)
const failures = []
for (const item of parsed.cases || []) {
  if (!assertActivationBoundary(item.assessment)) failures.push(`${item.id}:activation_boundary`)
  if (item.expectedReason && !item.assessment.reasonCodes.includes(item.expectedReason)) failures.push(`${item.id}:missing_expected_reason`)
  for (const reason of item.assessment.reasonCodes) if (!READINESS_REASON_CODES.includes(reason)) failures.push(`${item.id}:unregistered:${reason}`)
}
const materialized = { schemaVersion: parsed.schemaVersion, contract: parsed.contract, cases: parsed.cases }
if ('evidenceSha256' in parsed) failures.push('ambiguous_evidence_sha256_present')
if (canonicalSha256(materialized) !== parsed.payloadCanonicalSha256) failures.push('payload_canonical_sha256_mismatch')
if (canonicalSha256(parsed) !== integrity.documentCanonicalSha256) failures.push('document_canonical_sha256_mismatch')
if (createHash('sha256').update(raw).digest('hex') !== integrity.fileBytesSha256) failures.push('file_bytes_sha256_mismatch')
const counts = {
  total: parsed.cases.length,
  ready: parsed.cases.filter(item => item.assessment.readiness === 'ready').length,
  blocked: parsed.cases.filter(item => item.assessment.readiness === 'blocked').length,
  expectedReasonPresent: parsed.cases.filter(item => item.expectedReason).length,
  expectedReasonMissing: parsed.cases.filter(item => !item.expectedReason).length,
  positiveBoundaryCaseIds: parsed.cases.filter(item => item.assessment.readiness === 'ready').map(item => item.id),
  negativeCaseIds: parsed.cases.filter(item => item.assessment.readiness === 'blocked').map(item => item.id),
}
if (JSON.stringify(counts) !== JSON.stringify(integrity.counts)) failures.push('case_inventory_mismatch')
if (counts.total !== 30 || counts.ready !== 2 || counts.blocked !== 28 || counts.expectedReasonPresent !== 28 || counts.expectedReasonMissing !== 2) failures.push('case_inventory_expected_30_2_28_mismatch')
if (!counts.positiveBoundaryCaseIds.includes('all-valid-calculation-ready') || !counts.positiveBoundaryCaseIds.includes('coverage-boundary-in')) failures.push('positive_boundary_case_missing')
if (parsed.byteIdentity !== true) failures.push('byte_identity_not_verified')
if (failures.length) { console.error(JSON.stringify({ pass: false, failures }, null, 2)); process.exitCode = 1 } else console.log(JSON.stringify({ pass: true, payloadCanonicalSha256: parsed.payloadCanonicalSha256, documentCanonicalSha256: integrity.documentCanonicalSha256, fileBytesSha256: integrity.fileBytesSha256, counts, activation: parsed.serviceActivation }, null, 2))
