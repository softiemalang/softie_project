#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateAstrologyInterpretationConformance } from '../src/astrology/astrologyInterpretationConformance.js'
const path = resolve(process.argv[2] || 'artifacts/astrology-interpretation-conformance-v1/complete.json'); const bytes = await readFile(path); const evidence = JSON.parse(bytes); const root = resolve(process.env.ASTROLOGY_CONFORMANCE_ROOT || '.')
const read = async p => JSON.parse(await readFile(resolve(root, p), 'utf8')); const handoff = await read(evidence.input.handoffPath); const protocolEvidence = await read(evidence.input.protocolPath); const graph = (await read(evidence.input.graphPath)).graph
const result = evaluateAstrologyInterpretationConformance({ handoff, protocol: protocolEvidence.protocol, graph, candidate: evidence.candidate }); const negativeOk = evidence.negativeEvidence.every(item => item.expectedVerdict === 'non_conformant' && item.observedVerdict === 'non_conformant' && item.observedViolationCodes.length > 0)
if (evidence.schemaVersion !== 'astrology-interpretation-conformance-evidence-v1' || !result.pass || evidence.conformance.conformanceContentSha256 !== result.conformanceContentSha256 || !negativeOk) { console.error(JSON.stringify({ result, negativeOk }, null, 2)); process.exitCode = 1 } else console.log(JSON.stringify({ pass: true, verdict: result.verdict, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), conformanceContentSha256: result.conformanceContentSha256, violations: result.violations.length, negativeEvidenceCases: evidence.negativeEvidence.length }, null, 2))
