#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkAstrologyInterpretationHandoff, componentSpec } from '../src/astrology/astrologyInterpretationHandoff.js'

const evidencePath = resolve(process.argv[2] || 'artifacts/astrology-interpretation-handoff-v1/complete.json')
const evidenceBytes = await readFile(evidencePath)
const evidence = JSON.parse(evidenceBytes)
const root = resolve(process.env.ASTROLOGY_HANDOFF_ROOT || '.')
const artifactBytes = {}; const components = {}
for (const [role, spec] of Object.entries(componentSpec)) {
  const path = resolve(root, evidence.inputArtifacts?.[role] || evidence.bundle?.components?.[role]?.artifact?.path || '')
  artifactBytes[role] = await readFile(path)
  components[role] = JSON.parse(artifactBytes[role].toString('utf8'))
  const actual = createHash('sha256').update(artifactBytes[role]).digest('hex')
  if (evidence.bundle.components[role].artifact.artifactByteSha256 !== actual) console.error(`component artifact hash mismatch: ${role}`)
  if (!components[role][spec.innerKey]) console.error(`component missing: ${role}`)
}
const result = checkAstrologyInterpretationHandoff(evidence.bundle, { components, artifactBytes })
if (evidence.schemaVersion !== 'astrology-interpretation-handoff-evidence-v1') result.reasonCodes.push('handoff_evidence_schema_mismatch')
const negativeRequired = { missing_component: 'component_missing_or_not_object', wrong_version: 'component_schema_or_version_mismatch', content_hash: 'bundle_content_hash_mismatch', statistics: 'statistics_invalid', provenance: 'provenance_incomplete', interpretation: 'interpretation_output_present', claim_deleted: 'component_content_hash_mismatch', forbidden_relation: 'relation_vocabulary_invalid', activation_promoted: 'activation_boundary_mismatch', user_delivery_promoted: 'promotion_boundary_invalid', production_promoted: 'promotion_boundary_invalid', simulation_contamination: 'component_content_hash_mismatch', placidus_contamination: 'component_content_hash_mismatch', frozen_speed_contamination: 'component_content_hash_mismatch', legacy_prep_contamination: 'component_content_hash_mismatch' }
for (const [caseId, reason] of Object.entries(negativeRequired)) {
  const item = evidence.negativeEvidence?.find(candidate => candidate.caseId === caseId)
  if (!item || item.expectedReasonCode !== reason || !item.observedReasonCodes?.includes(reason)) result.reasonCodes.push(`negative_evidence_invalid:${caseId}`)
}
if (!result.pass) { console.error(JSON.stringify(result, null, 2)); process.exitCode = 1 }
else console.log(JSON.stringify({ pass: true, artifactByteSha256: createHash('sha256').update(evidenceBytes).digest('hex'), bundleContentSha256: evidence.bundle.bundleContentSha256, statistics: evidence.bundle.statistics, activation: evidence.bundle.activation }, null, 2))
