#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { canonicalSha256, providerBundleCanonicalSha256 } from '../src/astrology/localVerifiedOrchestration.js'

const path = process.argv[2] || 'artifacts/astrology-local-verified-orchestration-v1/evidence.json'
const evidence = JSON.parse(await readFile(path, 'utf8'))
const fail = message => { throw new Error(`local orchestration evidence invalid: ${message}`) }
if (evidence.schemaVersion !== 'astrology-local-orchestration-evidence-v1') fail('schema')
if (!/^[a-f0-9]{64}$/.test(evidence.payloadCanonicalSha256 || '')) fail('payload hash shape')
const payload = { ...evidence }; delete payload.payloadCanonicalSha256
if (canonicalSha256(payload) !== evidence.payloadCanonicalSha256) fail('payload hash')
const complete = evidence.cases.complete
if (!complete || !['completed', 'blocked'].includes(complete.status)) fail('complete case')
if (complete.activation?.availableForInterpretation !== false || complete.activation?.integrationStatus !== 'not_connected' || complete.activation?.serviceEligibility !== 'blocked') fail('activation boundary')
for (const [name, item] of Object.entries(evidence.cases)) {
  if (item.status === 'blocked' && (!Array.isArray(item.blockedReasons) || item.blockedReasons.length === 0)) fail(`${name} missing blocked reason`)
  if (item.activation && item.activation.reason !== 'activation_requires_user_approval') fail(`${name} activation reason`)
}
console.log(JSON.stringify({ pass: true, path, cases: Object.keys(evidence.cases).length, completeStatus: complete.status, providerBundleCanonicalSha256: evidence.providerBundleCanonicalSha256 }, null, 2))
