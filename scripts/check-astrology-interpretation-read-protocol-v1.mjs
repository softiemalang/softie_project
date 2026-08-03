#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateAstrologyInterpretationReadProtocol } from '../src/astrology/astrologyInterpretationReadProtocol.js'
import { componentSpec } from '../src/astrology/astrologyInterpretationHandoff.js'
const evidencePath = resolve(process.argv[2] || 'artifacts/astrology-interpretation-read-protocol-v1/complete.json'); const evidenceBytes = await readFile(evidencePath); const evidence = JSON.parse(evidenceBytes); const root = resolve(process.env.ASTROLOGY_READ_PROTOCOL_ROOT || '.')
const manifestBytes = await readFile(resolve(root, evidence.input?.freezeManifestPath || 'artifacts/astrology-interpretation-base-v1/freeze-manifest.json')); const freezeManifest = JSON.parse(manifestBytes); const handoffPath = resolve(root, evidence.input?.handoffPath || 'artifacts/astrology-interpretation-handoff-v1/complete.json'); const handoffEvidenceBytes = await readFile(handoffPath); const handoffEvidence = JSON.parse(handoffEvidenceBytes)
const components = {}; const artifactBytes = {}; for (const [role, spec] of Object.entries(componentSpec)) { const path = resolve(root, handoffEvidence.inputArtifacts[role]); artifactBytes[role] = await readFile(path); components[role] = JSON.parse(artifactBytes[role].toString('utf8')) }
const result = evaluateAstrologyInterpretationReadProtocol({ freezeManifest, freezeManifestBytes: manifestBytes, handoffEvidence, handoffEvidenceBytes, components, artifactBytes })
const required = Object.fromEntries((evidence.negativeEvidence || []).map(item => [item.caseId, item.expectedReasonCodes]))
for (const item of evidence.negativeEvidence || []) if (!item.expectedReasonCodes.every(code => item.observedReasonCodes.includes(code))) result.reasonCodes.push(`negative_evidence_invalid:${item.caseId}`)
if (evidence.schemaVersion !== 'astrology-interpretation-read-protocol-evidence-v1') result.reasonCodes.push('protocol_evidence_schema_mismatch')
if (!result.pass || evidence.protocol?.protocolContentSha256 !== result.protocolContentSha256) { console.error(JSON.stringify(result, null, 2)); process.exitCode = 1 } else console.log(JSON.stringify({ pass: true, artifactByteSha256: createHash('sha256').update(evidenceBytes).digest('hex'), protocolContentSha256: result.protocolContentSha256, protocolStatus: result.protocolStatus, claimCounts: result.claimCounts, decisions: result.decisions, negativeEvidenceCases: Object.keys(required).length }, null, 2))
