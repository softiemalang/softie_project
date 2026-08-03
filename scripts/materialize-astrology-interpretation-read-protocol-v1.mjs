#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateAstrologyInterpretationReadProtocol, astrologyInterpretationReadProtocolContentSha256 } from '../src/astrology/astrologyInterpretationReadProtocol.js'
import { astrologyInterpretationHandoffContentSha256, componentSpec } from '../src/astrology/astrologyInterpretationHandoff.js'

const root = resolve(process.env.ASTROLOGY_READ_PROTOCOL_ROOT || '.')
const manifestPath = resolve(root, process.env.ASTROLOGY_FREEZE_MANIFEST || 'artifacts/astrology-interpretation-base-v1/freeze-manifest.json')
const handoffPath = resolve(root, process.env.ASTROLOGY_HANDOFF_INPUT || 'artifacts/astrology-interpretation-handoff-v1/complete.json')
const manifestBytes = await readFile(manifestPath); const freezeManifest = JSON.parse(manifestBytes)
const handoffEvidenceBytes = await readFile(handoffPath); const handoffEvidence = JSON.parse(handoffEvidenceBytes)
const components = {}; const artifactBytes = {}
for (const [role, spec] of Object.entries(componentSpec)) {
  const path = resolve(root, handoffEvidence.inputArtifacts?.[role] || handoffEvidence.bundle.components[role].artifact.path)
  artifactBytes[role] = await readFile(path); components[role] = JSON.parse(artifactBytes[role].toString('utf8'))
}
const protocol = evaluateAstrologyInterpretationReadProtocol({ freezeManifest, freezeManifestBytes: manifestBytes, handoffEvidence, handoffEvidenceBytes, components, artifactBytes })
const requiredCases = {
  freezeMismatch: ['freeze_manifest_content_hash_mismatch'], handoffSchemaVersionMismatch: ['handoff_schema_or_version_mismatch'],
  contentHashTampered: ['handoff_content_hash_mismatch'], artifactHashTampered: ['component_artifact_hash_mismatch'], crossHashTampered: ['cross_hash_link_invalid'],
  claimCountTampered: ['claim_inventory_invalid', 'claim_epistemic_statistics_invalid'], sourceRefsTampered: ['claim_source_refs_missing_or_unresolvable'],
  claimDeleted: ['claim_inventory_invalid'], claimMerged: ['claim_inventory_invalid'], claimRanked: ['access_policy_violation'], claimRewritten: ['claim_inventory_invalid'],
  interpretationInjected: ['access_policy_violation'], psychologyInjected: ['access_policy_violation'], meaningWeightInjected: ['access_policy_violation'], promptInjected: ['access_policy_violation'], relationMeaningInjected: ['relation_semantics_transformed'], activationPromoted: ['user_delivery_or_production_promoted'],
  productionPromoted: ['user_delivery_or_production_promoted'], simulationContamination: ['calculation_contamination'], placidusContamination: ['calculation_contamination'],
  frozenSpeedContamination: ['calculation_contamination'], legacyPrepContamination: ['calculation_contamination'], unverifiedProviderContamination: ['calculation_contamination'],
}
const mutate = (caseId, fn) => {
  const candidate = { freezeManifest: structuredClone(freezeManifest), freezeManifestBytes: manifestBytes, handoffEvidence: structuredClone(handoffEvidence), handoffEvidenceBytes, components: structuredClone(components), artifactBytes: structuredClone(artifactBytes) }
  fn(candidate)
  return { caseId, expectedReasonCodes: requiredCases[caseId], observedReasonCodes: evaluateAstrologyInterpretationReadProtocol(candidate).reasonCodes }
}
const negativeEvidence = [
  mutate('freezeMismatch', c => { c.freezeManifest.manifestContentSha256 = '0'.repeat(64) }),
  mutate('handoffSchemaVersionMismatch', c => { c.handoffEvidence.bundle.handoffVersion = '9.9.9'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('contentHashTampered', c => { c.handoffEvidence.bundle.bundleContentSha256 = '0'.repeat(64) }),
  mutate('artifactHashTampered', c => { c.artifactBytes.packet = Buffer.from('tampered') }),
  mutate('crossHashTampered', c => { c.handoffEvidence.bundle.crossHashLinks.graphFromContext = '0'.repeat(64); c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('claimCountTampered', c => { c.handoffEvidence.bundle.statistics.claims.total = 52; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('sourceRefsTampered', c => { c.components.context.context.provenance.sourceRefs = []; }),
  mutate('claimDeleted', c => { c.components.graph.graph.nodes.pop() }),
  mutate('claimMerged', c => { c.components.graph.graph.nodes[1].nodeId = c.components.graph.graph.nodes[0].nodeId }),
  mutate('claimRanked', c => { c.handoffEvidence.bundle.ranking = [1]; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('claimRewritten', c => { c.components.graph.graph.nodes[0].value = { rewritten: true } }),
  mutate('interpretationInjected', c => { c.handoffEvidence.bundle.theme = 'injected'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('psychologyInjected', c => { c.handoffEvidence.bundle.psychology = 'injected'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('meaningWeightInjected', c => { c.handoffEvidence.bundle.meaningWeight = 1; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('promptInjected', c => { c.handoffEvidence.bundle.prompt = 'injected'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('relationMeaningInjected', c => { c.components.graph.graph.edges[0].evidence.basis = 'psychological support'; }),
  mutate('activationPromoted', c => { c.handoffEvidence.bundle.eligibility.userDelivery = 'eligible_for_user_delivery'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  mutate('productionPromoted', c => { c.handoffEvidence.bundle.eligibility.production = 'production_activation_ready'; c.handoffEvidence.bundle.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(c.handoffEvidence.bundle) }),
  ...['simulationContamination', 'placidusContamination', 'frozenSpeedContamination', 'legacyPrepContamination'].map(caseId => mutate(caseId, c => { c.components.graph.graph[caseId.replace('Contamination', '').replace('frozenSpeed', 'frozenSpeed')] = true })),
  mutate('unverifiedProviderContamination', c => { c.components.graph.graph.provider = 'unverified-provider' }),
]
const output = { schemaVersion: 'astrology-interpretation-read-protocol-evidence-v1', input: { freezeManifestPath: 'artifacts/astrology-interpretation-base-v1/freeze-manifest.json', handoffPath: 'artifacts/astrology-interpretation-handoff-v1/complete.json' }, protocol, negativeEvidence }
const outputDir = resolve(root, process.env.ASTROLOGY_READ_PROTOCOL_OUTPUT_DIR || 'artifacts/astrology-interpretation-read-protocol-v1'); await mkdir(outputDir, { recursive: true })
const outputBytes = Buffer.from(`${JSON.stringify(output, null, 2)}\n`); await writeFile(resolve(outputDir, 'complete.json'), outputBytes)
console.log(JSON.stringify({ output: resolve(outputDir, 'complete.json'), artifactByteSha256: createHash('sha256').update(outputBytes).digest('hex'), protocolContentSha256: protocol.protocolContentSha256, protocolStatus: protocol.protocolStatus, reasonCodes: protocol.reasonCodes }, null, 2))
