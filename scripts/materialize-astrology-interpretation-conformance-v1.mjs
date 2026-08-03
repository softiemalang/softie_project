#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateAstrologyInterpretationConformance, astrologyInterpretationCandidateContentSha256, CONFORMANCE_CANDIDATE_SCHEMA, CONFORMANCE_CANDIDATE_VERSION } from '../src/astrology/astrologyInterpretationConformance.js'

const root = resolve(process.env.ASTROLOGY_CONFORMANCE_ROOT || '.')
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const handoff = await readJson(process.env.ASTROLOGY_CONFORMANCE_HANDOFF || 'artifacts/astrology-interpretation-handoff-v1/complete.json')
const protocolEvidence = await readJson(process.env.ASTROLOGY_CONFORMANCE_PROTOCOL || 'artifacts/astrology-interpretation-read-protocol-v1/complete.json')
const graphEvidence = await readJson(handoff.inputArtifacts.graph)
const graph = graphEvidence.graph
const trace = protocolEvidence.protocol.claimSourceTrace
const pathKey = path => path.replace(/^\/+/, '').replaceAll('/', '.')
const candidate = { schemaVersion: CONFORMANCE_CANDIDATE_SCHEMA, candidateVersion: CONFORMANCE_CANDIDATE_VERSION, candidateStatus: 'machine_readable_sample', input: { handoffSchemaVersion: handoff.bundle.schemaVersion, handoffVersion: handoff.bundle.handoffVersion, handoffContentSha256: handoff.bundle.bundleContentSha256, protocolSchemaVersion: protocolEvidence.protocol.schemaVersion, protocolVersion: protocolEvidence.protocol.protocolVersion, protocolContentSha256: protocolEvidence.protocol.protocolContentSha256 }, coverage: { declaration: 'all_upstream_claims', omittedClaimPaths: [] }, claims: trace.map(item => { const node = graph.nodes.find(candidateNode => pathKey(candidateNode.claimPath) === item.claimPath); return ({ claimPath: item.claimPath, claimType: node.claimType, value: node.value, epistemic: item.epistemic, sourceRefs: item.sourceRefs }) }), assertions: [{ kind: 'status_reference', status: 'local_research_only' }, { kind: 'epistemic_boundary', epistemicClass: 'observed_or_calculated' }, { kind: 'epistemic_boundary', epistemicClass: 'deterministically_derived' }, { kind: 'structural_relation_reference', relation: graph.relationVocabulary[0], semanticUse: 'structural_co_occurrence_only', claimRefs: graph.edges.slice(0, 1).flatMap(edge => [graph.nodes.find(node => node.nodeId === edge.from)?.claimPath, graph.nodes.find(node => node.nodeId === edge.to)?.claimPath]).map(pathKey).filter(Boolean) }], activation: { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'interpretation_packet_not_activated' }, deliveryStatus: 'blocked' }
candidate.candidateContentSha256 = astrologyInterpretationCandidateContentSha256(candidate)
const protocol = protocolEvidence.protocol
const result = evaluateAstrologyInterpretationConformance({ handoff, protocol, graph, candidate })
const mutate = (caseId, fn, recompute = true) => { const copy = structuredClone(candidate); fn(copy); if (recompute) copy.candidateContentSha256 = astrologyInterpretationCandidateContentSha256(copy); const observed = evaluateAstrologyInterpretationConformance({ handoff, protocol, graph, candidate: copy }); return { caseId, expectedVerdict: 'non_conformant', observedVerdict: observed.verdict, observedViolationCodes: observed.violations.map(item => item.code), candidateContentSha256: copy.candidateContentSha256 } }
const negativeEvidence = [
  mutate('bundleSchemaVersionMismatch', c => { c.input.handoffSchemaVersion = 'wrong-bundle' }),
  mutate('bundleProtocolHashMismatch', c => { c.input.protocolContentSha256 = '0'.repeat(64) }),
  mutate('candidateSchemaVersionMismatch', c => { c.candidateVersion = '9.9.9' }),
  mutate('candidateContentHashMismatch', c => { c.candidateContentSha256 = '0'.repeat(64) }, false),
  mutate('claimCreated', c => { c.claims.push({ claimPath: 'new.claim', claimType: 'new', value: 1, epistemic: 'observed_or_calculated', sourceRefs: ['new.source'] }) }),
  mutate('claimDeleted', c => { c.claims.pop() }),
  mutate('claimMerged', c => { c.claims[1].claimPath = c.claims[0].claimPath }),
  mutate('claimMutated', c => { c.claims[0].value = 'rewritten' }),
  mutate('sourceRefsDisconnected', c => { c.claims[0].sourceRefs = [] }),
  mutate('epistemicMixed', c => { c.assertions.push({ kind: 'epistemic_boundary', epistemicClass: 'observed_or_calculated', claimRefs: [c.claims.find(item => item.epistemic === 'deterministically_derived').claimPath] }) }),
  mutate('graphRelationMeaning', c => { c.assertions[3].semanticUse = 'support' }),
  mutate('strengthAsMeaningWeight', c => { c.assertions.push({ kind: 'claim_reference', interpretation: 'orb_as_life_importance' }) }),
  mutate('dominanceBeforeExperience', c => { c.assertions.push({ kind: 'claim_reference', decision: 'winner_before_experience' }) }),
  mutate('unsupportedPsychology', c => { c.assertions.push({ kind: 'claim_reference', assertionType: 'psychology' }) }),
  mutate('activationPromoted', c => { c.deliveryStatus = 'eligible_for_user_delivery' }),
  mutate('simulationContamination', c => { c.simulation = true }),
  mutate('promptLlmApiTrace', c => { c.prompt = 'not used' }),
]
const evidence = { schemaVersion: 'astrology-interpretation-conformance-evidence-v1', conformance: result, candidate, negativeEvidence, input: { handoffPath: 'artifacts/astrology-interpretation-handoff-v1/complete.json', protocolPath: 'artifacts/astrology-interpretation-read-protocol-v1/complete.json', graphPath: handoff.inputArtifacts.graph } }
const outputDir = resolve(root, process.env.ASTROLOGY_CONFORMANCE_OUTPUT_DIR || 'artifacts/astrology-interpretation-conformance-v1'); await mkdir(outputDir, { recursive: true }); const bytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`); await writeFile(resolve(outputDir, 'complete.json'), bytes)
console.log(JSON.stringify({ output: resolve(outputDir, 'complete.json'), artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), conformanceContentSha256: result.conformanceContentSha256, verdict: result.verdict, negativeEvidenceCases: negativeEvidence.length }, null, 2))
