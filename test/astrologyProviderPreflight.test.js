import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('.')
const output = resolve('artifacts/astrology-provider-runtime-preflight-v1')
test('provider/runtime decision matrix is machine-valid', () => { execFileSync(process.execPath, ['scripts/check-astrology-provider-runtime-decision-matrix.mjs'], { cwd: root, stdio: 'pipe' }) })
test('local preflight is deterministic, fail-closed, and activation-blocked', async () => {
  execFileSync(process.execPath, ['scripts/preflight-astrology-provider-runtime.mjs'], { cwd: root, stdio: 'pipe' })
  const snapshot = async () => Object.fromEntries(await Promise.all((await readdir(output)).sort().map(async name => [name, (await readFile(resolve(output, name))).toString('hex')])))
  const first = await snapshot()
  const manifest = JSON.parse(await readFile(resolve(output, 'manifest.json')))
  execFileSync(process.execPath, ['scripts/preflight-astrology-provider-runtime.mjs'], { cwd: root, stdio: 'pipe' })
  assert.deepEqual(await snapshot(), first)
  const integrity = JSON.parse(await readFile(resolve(output, 'integrity.json')))
  assert.equal(manifest.providerBundleCanonicalSha256, '3be2f6d607f716979d56c3279fb74f0c38ac8c797c92874ce13fd89a83f8e320')
  assert.equal(integrity.providerBundleCanonicalSha256, manifest.providerBundleCanonicalSha256)
  assert.equal(manifest.readiness.payloadCanonicalSha256.length, 64)
  assert.deepEqual(manifest.readiness.counts, { total: 30, ready: 2, blocked: 28, expectedReasonPresent: 28, expectedReasonMissing: 2 })
  assert.equal(manifest.ready.readiness, 'ready')
  assert.deepEqual(manifest.ready.activation, { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'activation_requires_user_approval' })
  for (const name of ['staleProvider', 'futureEffective', 'tampered', 'kernelMismatch', 'runnerMismatch', 'coverageMismatch']) {
    const evidence = JSON.parse(await readFile(resolve(output, `${name}.json`)))
    assert.equal(evidence.assessment.readiness, 'blocked')
  }
})
test('provider bundle hash is independent of evidence order', async () => {
  const ready = JSON.parse(await readFile(resolve(output, 'ready.json')))
  const { providerBundleCanonicalSha256 } = await import('../scripts/astrology-provider-runtime-contract.mjs')
  const bundle = { schemaVersion: 'astrology-provider-evidence-bundle-v1', bundleVersion: '2025.06.01', evidence: ['a', 'b'].map(identity => ({ identity, value: 1 })) }
  const reordered = { ...bundle, evidence: [...bundle.evidence].reverse() }
  assert.equal(providerBundleCanonicalSha256(bundle), providerBundleCanonicalSha256(reordered))
})
