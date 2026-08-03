import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const PROVIDER_BUNDLE_SCHEMA = 'astrology-provider-evidence-bundle-v1'
export const PREFLIGHT_SCHEMA = 'verified-astrology-activation-preflight-v1'
export const ACTIVATION_BOUNDARY = Object.freeze({
  availableForInterpretation: false,
  integrationStatus: 'not_connected',
  serviceEligibility: 'blocked',
  reason: 'activation_requires_user_approval',
})

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalJson = value => `${JSON.stringify(ordered(value))}\n`
export const sha256 = value => createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex')

export function providerBundleCanonicalSha256(bundle) {
  const copy = structuredClone(bundle)
  delete copy.bundleSha256
  delete copy.providerBundleCanonicalSha256
  if (Array.isArray(copy.evidence)) copy.evidence.sort((left, right) => left.identity.localeCompare(right.identity))
  return sha256(copy)
}

function status(status, reasons, details = {}) {
  return { status, reasons: [...new Set(reasons)], ...details }
}

function checkEvidence(evidence, instant) {
  const reasons = []
  if (!evidence || typeof evidence !== 'object' || !evidence.identity || !/^[a-f0-9]{64}$/.test(evidence.source?.sha256 || '')) reasons.push('provider_unverified')
  if (evidence?.verificationStatus !== 'verified') reasons.push('provider_unverified')
  if (!evidence?.effectiveAt || !evidence?.expiryAt) reasons.push('provider_range_missing')
  if (evidence?.effectiveAt > instant) reasons.push('provider_future_effective')
  if (evidence?.expiryAt <= instant) reasons.push('provider_stale')
  return reasons
}

export function createPreflight({ input, providerBundle, kernelProbe, runnerProbe, documentIdentity, assessmentTime = '2025-06-01T00:00:00.000Z' }) {
  const instant = input?.civilTime?.utc || assessmentTime
  const bundleReasons = providerBundle?.schemaVersion !== PROVIDER_BUNDLE_SCHEMA ? ['provider_unverified'] : []
  const expectedBundleHash = providerBundle ? providerBundleCanonicalSha256(providerBundle) : null
  if (providerBundle?.providerBundleCanonicalSha256 !== expectedBundleHash) bundleReasons.push('provider_unverified')
  const providerStatuses = Object.fromEntries((providerBundle?.evidence || []).map(evidence => [evidence.identity, status(checkEvidence(evidence, instant).length ? 'blocked' : 'ready', checkEvidence(evidence, instant), { sourceRefs: [evidence.identity] })]))
  const provider = Object.values(providerStatuses).some(item => item.status === 'blocked') || bundleReasons.length
    ? status('blocked', [...bundleReasons, ...Object.values(providerStatuses).flatMap(item => item.reasons)])
    : status('ready', [])
  const readinessInput = {
    assessmentTime,
    input: { ...input, dut1: providerBundle?.evidence?.find(e => e.identity === 'iers-dut1') },
    timeScale: {
      leapSecond: providerBundle?.evidence?.find(e => e.identity === 'iers-leap-seconds'),
      ttMinusUtc: providerBundle?.evidence?.find(e => e.identity === 'tai-utc'),
      tdbMinusTt: providerBundle?.evidence?.find(e => e.identity === 'tdb-minus-tt'),
    },
    ephemeris: { bsp: kernelProbe?.bsp, requestedEt: instant, evaluatorSelection: kernelProbe?.evaluatorSelection },
    runtime: { runner: runnerProbe },
    documents: documentIdentity,
    contamination: { connectedConsumers: [] },
  }
  return {
    schemaVersion: PREFLIGHT_SCHEMA,
    mode: 'local-preflight-only',
    input: { ...input, synthetic: true },
    provider: { ...provider, providerBundleCanonicalSha256: providerBundle ? expectedBundleHash : null, evidence: providerStatuses },
    readiness: readinessInput,
    kernel: kernelProbe || null,
    runner: runnerProbe || null,
    documents: documentIdentity || null,
    assessment: null,
    activation: ACTIVATION_BOUNDARY,
  }
}

export async function writeCanonical(path, value) {
  await writeFile(resolve(path), canonicalJson(value))
}

export async function readJson(path) { return JSON.parse(await readFile(resolve(path), 'utf8')) }
