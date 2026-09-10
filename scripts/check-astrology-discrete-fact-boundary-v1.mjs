#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  ACCEPTED_UNCERTAINTY_BASES,
  DISCRETE_FACT_BOUNDARY_CONTRACT_SCHEMA,
  DISCRETE_FACT_BOUNDARY_CONTRACT_VERSION,
  DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION,
  EXISTING_FACT_TOLERANCES,
  REJECTED_UNCERTAINTY_BASES,
  SIGN_BOUNDARY_THRESHOLD_DEGREES,
  SOURCE_RELATIVE_FACT_FRAME,
  TIME_SCALE_BUNDLE_CANONICAL_SHA256,
} from '../src/astrology/astrologyDiscreteFactBoundary.js'
import { ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1 } from './lib/astrology-provider-equivalence-contract.mjs'
import { MOTION_EPSILON_DEGREES_PER_DAY } from '../src/astrology/astrologyMotion.js'
import { ORB_BOUNDARY_THRESHOLD_DEGREES } from '../src/astrology/astrologyAspects.js'

const root = resolve(process.cwd())
const contractPath = resolve(process.argv[2] || 'api/provider/astrology-discrete-fact-boundary-contract-v1.json')
const fail = message => { throw new Error(`discrete FACT boundary contract invalid: ${message}`) }
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
const canonicalSha256 = value => sha256(Buffer.from(`${JSON.stringify(ordered(value))}\n`, 'utf8'))

async function json(path, label) {
  let raw
  try { raw = await readFile(path) } catch (error) { fail(`${label}: missing_or_unreadable:${error.code || error.message}`) }
  try { return { raw, value: JSON.parse(raw) } } catch (error) { fail(`${label}: invalid_json:${error.message}`) }
}

const { raw: contractRaw, value: contract } = await json(contractPath, 'contract')
if (contract.schemaVersion !== DISCRETE_FACT_BOUNDARY_CONTRACT_SCHEMA) fail('schemaVersion')
if (contract.contractVersion !== DISCRETE_FACT_BOUNDARY_CONTRACT_VERSION) fail('contractVersion')
if (contract.status !== 'implemented_internal_fail_closed') fail('status')
if (!/^[a-f0-9]{64}$/.test(contract.contractCanonicalSha256 || '')) fail('contractCanonicalSha256 shape')
const withoutHash = { ...contract }
delete withoutHash.contractCanonicalSha256
if (canonicalSha256(withoutHash) !== contract.contractCanonicalSha256) fail('contractCanonicalSha256 mismatch')
if (JSON.stringify({
  mode: contract.factFrame?.mode,
  physicalTruthGuarantee: contract.factFrame?.physicalTruthGuarantee,
  universalAbsoluteBoundRequired: contract.factFrame?.universalAbsoluteBoundRequired,
}) !== JSON.stringify(SOURCE_RELATIVE_FACT_FRAME)) fail('source-relative FACT frame')
if (contract.factFrame.statement !== 'A FACT is the deterministic output produced by the declared provider/model and Rule Core for the requested input.') fail('source-relative FACT statement')
if (!Array.isArray(contract.factFrame.requiredIdentity) || contract.factFrame.requiredIdentity.length !== 3) fail('source-relative FACT identity requirements')
if (!Array.isArray(contract.factFrame.doesNotMean) || contract.factFrame.doesNotMean.length !== 3) fail('source-relative FACT exclusions')

const bundlePath = resolve(root, contract.references?.timeScaleBundle?.path || '')
const { value: bundle } = await json(bundlePath, 'time-scale bundle')
if (bundle.schemaVersion !== 'astrology-time-scale-bundle-v1') fail('time-scale bundle schema')
if (bundle.bundleCanonicalSha256 !== contract.references.timeScaleBundle.bundleCanonicalSha256) fail('time-scale bundle canonical identity')
if (bundle.bundleCanonicalSha256 !== TIME_SCALE_BUNDLE_CANONICAL_SHA256) fail('time-scale bundle source identity')
if (bundle.redistribution?.publicReleaseAllowed !== false || bundle.redistribution?.status !== 'external_review_required') fail('redistribution boundary changed')
if (bundle.arbitraryDateProducerReadiness?.status !== 'blocked_until_bundle_and_redistribution_gate_close') fail('producer readiness boundary changed')

const equivalence = (await json(resolve(root, contract.references?.providerEquivalence?.path || ''), 'provider equivalence')).value
if (equivalence.schemaVersion !== 'astrology-provider-equivalence-fixture-v1') fail('provider equivalence schema')
const expectedTolerances = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.factEquivalence.derived
if (JSON.stringify({
  longitudeMaxAbsDegrees: contract.existingFactTolerances.longitudeMaxAbsDegrees,
  longitudeSpeedMaxAbsDegreesPerDay: contract.existingFactTolerances.longitudeSpeedMaxAbsDegreesPerDay,
  aspectDistanceMaxAbsDegrees: contract.existingFactTolerances.aspectDistanceMaxAbsDegrees,
  aspectOrbMaxAbsDegrees: contract.existingFactTolerances.aspectOrbMaxAbsDegrees,
}) !== JSON.stringify({
  longitudeMaxAbsDegrees: expectedTolerances.longitudeMaxAbsDegrees,
  longitudeSpeedMaxAbsDegreesPerDay: expectedTolerances.longitudeSpeedMaxAbsDegreesPerDay,
  aspectDistanceMaxAbsDegrees: expectedTolerances.aspectDistanceMaxAbsDegrees,
  aspectOrbMaxAbsDegrees: expectedTolerances.aspectOrbMaxAbsDegrees,
})) fail('existing tolerance reference')

if (contract.references.ruleCore.version !== DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION) fail('rule core version')
if (contract.boundaryGuards.sign.guardDegrees !== SIGN_BOUNDARY_THRESHOLD_DEGREES) fail('sign guard')
if (contract.boundaryGuards.aspect.orbGuardDegrees !== ORB_BOUNDARY_THRESHOLD_DEGREES) fail('aspect guard')
if (contract.boundaryGuards.motion.epsilonDegreesPerDay !== MOTION_EPSILON_DEGREES_PER_DAY) fail('motion epsilon')
if (contract.boundaryGuards.aspectPhase.epsilonDegreesPerDay !== MOTION_EPSILON_DEGREES_PER_DAY) fail('phase epsilon')
if (JSON.stringify(contract.uncertaintyModel.acceptedFinalObservableBases) !== JSON.stringify(ACCEPTED_UNCERTAINTY_BASES)) fail('accepted uncertainty bases')
if (JSON.stringify(contract.uncertaintyModel.rejectedAsAbsoluteBounds) !== JSON.stringify(REJECTED_UNCERTAINTY_BASES)) fail('rejected uncertainty bases')
if (contract.uncertaintyModel.componentTreatment.dut1.absoluteBoundAvailableInCurrentBundle !== false) fail('DUT1 absolute-bound statement')
if (contract.uncertaintyModel.componentTreatment.tdbMinusTt.twoPartRepresentationBudgetSeconds !== 1.770977e-6) fail('TDB representation budget')
if (contract.currentProductionAssessment.scope !== 'internal_offline_source_relative_only') fail('readiness scope')
if (contract.currentProductionAssessment.arbitraryDateDiscreteFactReadiness !== 'ready_source_relative') fail('current readiness')
if (contract.currentProductionAssessment.intervalBackedBoundaryReadiness !== 'available_fail_closed_when_interval_supplied') fail('interval-backed readiness')
if (!Array.isArray(contract.currentProductionAssessment.reasons) || contract.currentProductionAssessment.reasons.length !== 0) fail('readiness reasons')
if (contract.currentProductionAssessment.publicRedistribution !== 'separate external_review_required blocker remains unchanged') fail('public blocker separation')
if (contract.currentProductionAssessment.activation !== 'unchanged_and_blocked') fail('activation boundary')

for (const [name, rule] of Object.entries(contract.resultRules || {})) {
  if (typeof rule !== 'string' || rule.length === 0) fail(`result rule:${name}`)
}
for (const reason of contract.failClosed || []) {
  if (typeof reason !== 'string' || reason.length === 0) fail('fail-closed vocabulary')
}

console.log(JSON.stringify({
  status: 'valid',
  contractCanonicalSha256: contract.contractCanonicalSha256,
  contractFileSha256: sha256(contractRaw),
  timeScaleBundleCanonicalSha256: bundle.bundleCanonicalSha256,
  existingFactTolerances: contract.existingFactTolerances,
  factFrame: { ...SOURCE_RELATIVE_FACT_FRAME },
  acceptedFinalObservableBases: contract.uncertaintyModel.acceptedFinalObservableBases,
  rejectedAsAbsoluteBounds: contract.uncertaintyModel.rejectedAsAbsoluteBounds,
  arbitraryDateDiscreteFactReadiness: contract.currentProductionAssessment.arbitraryDateDiscreteFactReadiness,
  intervalBackedBoundaryReadiness: contract.currentProductionAssessment.intervalBackedBoundaryReadiness,
  publicRedistribution: bundle.redistribution.publicReleaseAllowed,
}, null, 2))
