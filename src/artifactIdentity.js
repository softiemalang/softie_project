import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

export const ARTIFACT_IDENTITY_CONTRACT_VERSION = 'artifact-identity-v1'

export const HISTORICAL_BASIS_VALIDITY = Object.freeze({
  HISTORICAL_VALID: 'historical_valid',
  CURRENT_COMPATIBLE: 'current_compatible',
  REPLAY_REQUIRED: 'replay_required',
  INVALID: 'invalid',
})

const VOLATILE_REPOSITORY_OBSERVATION_KEYS = new Set(['observedHead', 'currentHead', 'originMainHead', 'currentCheckoutHead'])

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
}
export const canonicalIdentityJson = (value) => `${JSON.stringify(stable(value), null, 2)}\n`

/**
 * Repository observations describe the checkout that performed a replay. They
 * are useful diagnostics, but are not frozen evidence payload. Keep them out
 * of stable-content comparisons while retaining the original fields in the
 * artifact itself.
 */
export function withoutVolatileRepositoryObservation(value) {
  if (Array.isArray(value)) return value.map(withoutVolatileRepositoryObservation)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !VOLATILE_REPOSITORY_OBSERVATION_KEYS.has(key))
    .map(([key, child]) => [key, withoutVolatileRepositoryObservation(child)]))
}

export function stableArtifactPayload(value) {
  const payload = structuredClone(value)
  delete payload.artifactIdentity
  return withoutVolatileRepositoryObservation(payload)
}

export function canonicalStableArtifactJson(value) {
  return canonicalIdentityJson(stableArtifactPayload(value))
}

export function stableArtifactContentEqual(left, right) {
  return canonicalStableArtifactJson(left) === canonicalStableArtifactJson(right)
}

function gitText(root, args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function gitSucceeds(root, args) {
  try {
    execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function inspectRepositoryBasis(root, basisHead) {
  const branch = gitText(root, ['branch', '--show-current'])
  const currentHead = gitText(root, ['rev-parse', 'HEAD'])
  const originMainHead = gitText(root, ['rev-parse', 'origin/main'])
  const validBasis = /^[0-9a-f]{40}$/.test(basisHead || '')
  const basisExists = validBasis && gitText(root, ['cat-file', '-e', `${basisHead}^{commit}`]) !== null
  const isAncestor = (ancestor, descendant) => Boolean(ancestor && descendant && gitSucceeds(root, ['merge-base', '--is-ancestor', ancestor, descendant]))
  const basisIsAncestorOfCurrent = basisExists && isAncestor(basisHead, currentHead)
  const basisIsAncestorOfOriginMain = basisExists && isAncestor(basisHead, originMainHead)
  const status = !validBasis || !basisExists
    ? 'basis_unavailable'
    : !basisIsAncestorOfCurrent || !basisIsAncestorOfOriginMain
      ? 'non_descendant_or_unrelated'
      : currentHead === basisHead && originMainHead === basisHead
        ? 'current_snapshot'
        : 'descendant_snapshot'
  return { branch, basisHead, currentHead, originMainHead, basisExists, basisIsAncestorOfCurrent, basisIsAncestorOfOriginMain, status }
}

export function checkHistoricalRepositoryBasis(root, basisHead, { expectedBranch = 'main' } = {}) {
  const snapshot = inspectRepositoryBasis(root, basisHead)
  const errors = []
  if (snapshot.branch !== expectedBranch) errors.push(`branch_mismatch:${snapshot.branch || 'unknown'}`)
  if (!snapshot.basisExists) errors.push('basis_commit_not_found')
  if (!snapshot.basisIsAncestorOfCurrent) errors.push('basis_not_ancestor_of_current_head')
  if (!snapshot.basisIsAncestorOfOriginMain) errors.push('basis_not_ancestor_of_origin_main')
  return { ...snapshot, errors }
}

export function fileByteIdentity(root, path) {
  return { path, byteSha256: sha256(readFileSync(`${root}/${path}`)) }
}

export function fileByteSha256AtGitCommit(root, commit, path) {
  return sha256(execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }))
}

function matchingDescendantCommit(root, generationBaseHead, descendantHead, path, expectedSha256) {
  if (!generationBaseHead || !descendantHead || !gitSucceeds(root, ['merge-base', '--is-ancestor', generationBaseHead, descendantHead])) return null
  const commits = gitText(root, ['rev-list', '--ancestry-path', `${generationBaseHead}..${descendantHead}`, '--', path])?.split('\n').filter(Boolean) || []
  for (const commit of commits) {
    try {
      if (fileByteSha256AtGitCommit(root, commit, path) === expectedSha256) return commit
    } catch {}
  }
  return null
}

export function inspectFileByteIdentity(root, path, expectedSha256, { generationBaseHead, descendantHead } = {}) {
  let currentSha256 = null
  let historicalSha256 = null
  try { currentSha256 = fileByteIdentity(root, path).byteSha256 } catch {}
  if (generationBaseHead) {
    try { historicalSha256 = fileByteSha256AtGitCommit(root, generationBaseHead, path) } catch {}
  }
  const currentMatches = currentSha256 === expectedSha256
  const historicalMatches = historicalSha256 === expectedSha256
  const descendantCommit = !currentMatches && !historicalMatches
    ? matchingDescendantCommit(root, generationBaseHead, descendantHead, path, expectedSha256)
    : null
  return {
    path,
    expectedSha256,
    currentSha256,
    historicalSha256,
    currentMatches,
    historicalMatches,
    descendantCommit,
    descendantMatches: Boolean(descendantCommit),
    status: currentMatches
      ? 'current_bytes_match'
      : historicalMatches
        ? 'historical_basis_bytes_match'
        : descendantCommit
          ? 'historical_descendant_bytes_match'
          : 'protected_bytes_unverified',
  }
}

export function matchesFileByteIdentity(root, path, expectedSha256, { generationBaseHead } = {}) {
  const identity = inspectFileByteIdentity(root, path, expectedSha256, { generationBaseHead })
  return identity.currentMatches || Boolean(generationBaseHead && identity.historicalMatches)
}

export function artifactPayloadWithoutIdentity(artifact) {
  const payload = structuredClone(artifact)
  delete payload.artifactIdentity
  return payload
}

export function artifactPayloadSha256(artifact) {
  return sha256(canonicalIdentityJson(artifactPayloadWithoutIdentity(artifact)))
}

export function buildArtifactIdentity({ root, artifactId, materializerPath, materializerVersion, baseHead, inputs = [], inputBytesByPath = {} }) {
  if (!/^[0-9a-f]{40}$/.test(baseHead || '')) throw new Error(`invalid generation base HEAD for ${artifactId}`)
  return {
    contractVersion: ARTIFACT_IDENTITY_CONTRACT_VERSION,
    artifactId,
    generation: {
      baseHead,
      baseHeadSource: 'git rev-parse HEAD at materialization',
      includedCommit: null,
      includedCommitSource: 'unknown_at_generation; artifact may be included by a later commit',
    },
    inputs: inputs.map((path) => ({ path, byteSha256: inputBytesByPath[path] ? sha256(inputBytesByPath[path]) : fileByteIdentity(root, path).byteSha256 })).sort((a, b) => a.path.localeCompare(b.path)),
    materializer: { path: materializerPath, version: materializerVersion },
  }
}

export function attachArtifactIdentity(payload, identity) {
  const artifact = { ...payload, artifactIdentity: { ...identity } }
  artifact.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(artifact)
  return artifact
}

export function checkArtifactIdentity(artifact, { root, artifactId, materializerPath, materializerVersion, allowCurrentHeadDifference = true, allowGenerationBaseInput = false, allowDescendantInput = false, allowVerifierInputDrift = false, verifierInputPaths = [], inputPathResolver = path => path } = {}) {
  const errors = []
  const identity = artifact?.artifactIdentity
  if (!identity || identity.contractVersion !== ARTIFACT_IDENTITY_CONTRACT_VERSION) errors.push('identity contract version mismatch')
  if (identity?.artifactId !== artifactId) errors.push('artifact identity mismatch')
  if (identity?.materializer?.path !== materializerPath || identity?.materializer?.version !== materializerVersion) errors.push('materializer identity mismatch')
  if (!/^[0-9a-f]{40}$/.test(identity?.generation?.baseHead || '')) errors.push('generation base identity missing or invalid')
  else {
    try { execFileSync('git', ['-c', 'core.fsmonitor=false', 'cat-file', '-e', `${identity.generation.baseHead}^{commit}`], { cwd: root, stdio: 'ignore' }) }
    catch { errors.push('generation base commit not found') }
  }
  if (identity?.generation?.includedCommit !== null || identity?.generation?.includedCommitSource !== 'unknown_at_generation; artifact may be included by a later commit') errors.push('included commit must remain unknown at generation')
  if (identity?.artifactPayloadSha256 !== artifactPayloadSha256(artifact)) errors.push('artifact payload identity mismatch')
  for (const input of identity?.inputs || []) {
    const inputPath = inputPathResolver(input.path)
    const inputIdentity = inspectFileByteIdentity(root, inputPath, input.byteSha256, {
      generationBaseHead: allowGenerationBaseInput ? identity?.generation?.baseHead : undefined,
      descendantHead: allowDescendantInput ? gitText(root, ['rev-parse', 'HEAD']) : undefined,
    })
    const verifierInput = input.path === materializerPath || input.path === 'src/artifactIdentity.js' || verifierInputPaths.includes(input.path)
    const matches = inputIdentity.currentMatches || Boolean(allowGenerationBaseInput && inputIdentity.historicalMatches) || Boolean(allowDescendantInput && inputIdentity.descendantMatches) || Boolean(allowVerifierInputDrift && verifierInput)
    if (!matches) errors.push(`input byte identity mismatch:${input.path}`)
  }
  if (!identity?.inputs?.length) errors.push('input provenance missing')
  return errors
}

function verificationStatus(value) {
  if (value === true || value === 'verified') return 'verified'
  if (value === false || value === 'failed' || value === 'mismatch') return 'failed'
  if (value && typeof value === 'object') {
    if (value.status === 'verified' || value.verified === true) return 'verified'
    if (value.status === 'failed' || value.status === 'mismatch' || value.verified === false || value.errors?.length) return 'failed'
  }
  return 'unknown'
}

function inspectCheckerIdentity(root, checkerIdentity) {
  if (checkerIdentity?.path && checkerIdentity?.byteSha256) {
    let current
    try { current = fileByteIdentity(root, checkerIdentity.path).byteSha256 } catch { current = null }
    return {
      status: current === checkerIdentity.byteSha256 ? 'verified' : 'failed',
      path: checkerIdentity.path,
      expectedSha256: checkerIdentity.byteSha256,
      currentSha256: current,
    }
  }
  const status = verificationStatus(checkerIdentity)
  return { status, path: checkerIdentity?.path || null, expectedSha256: checkerIdentity?.byteSha256 || null, currentSha256: null }
}

/**
 * Classify a frozen artifact against its declared historical generation basis.
 *
 * This is deliberately a provenance/compatibility classifier. It does not
 * recalculate domain truth, readiness, semantic authority, or activation.
 * `historicalReplay` is an explicit parent-verified replay result; it is not
 * inferred from ancestry or from the current checker merely returning no
 * errors.
 */
export function classifyHistoricalBasisValidity(artifact, {
  root,
  artifactId,
  materializerPath,
  materializerVersion,
  expectedBranch = 'main',
  integrity = null,
  historicalReplay = null,
  checkerIdentity = null,
  inputPathResolver = path => path,
} = {}) {
  const errors = []
  const reasons = []
  const identity = artifact?.artifactIdentity
  const basisHead = identity?.generation?.baseHead || null
  const basis = checkHistoricalRepositoryBasis(root, basisHead, { expectedBranch })
  if (basis.errors.length) {
    const basisIssues = basis.errors.map(error => `historical_basis:${error}`)
    errors.push(...basisIssues)
    reasons.push(...basisIssues)
  }

  const identityErrors = checkArtifactIdentity(artifact, {
    root,
    artifactId,
    materializerPath,
    materializerVersion,
    allowGenerationBaseInput: true,
    allowVerifierInputDrift: false,
    inputPathResolver,
  })
  const inputIdentityErrors = identityErrors.filter(error => error.startsWith('input byte identity mismatch:'))
  const structuralIdentityErrors = identityErrors.filter(error => !error.startsWith('input byte identity mismatch:'))
  const structuralIssues = structuralIdentityErrors.map(error => `artifact_identity:${error}`)
  errors.push(...structuralIssues)
  reasons.push(...structuralIssues)

  const integrityStatus = verificationStatus(integrity)
  if (integrityStatus === 'failed') {
    errors.push('integrity:failed')
    reasons.push('integrity:failed')
  }

  const inputStates = (identity?.inputs || []).map(input => {
    const inspected = inspectFileByteIdentity(root, inputPathResolver(input.path), input.byteSha256, {
      generationBaseHead: basisHead,
    })
    return {
      path: input.path,
      status: inspected.status,
      currentMatches: inspected.currentMatches,
      historicalMatches: inspected.historicalMatches,
    }
  })
  const allInputsCurrent = inputStates.length > 0 && inputStates.every(input => input.currentMatches)
  const allInputsHistoricallyTraceable = inputStates.length > 0 && inputStates.every(input => input.currentMatches || input.historicalMatches)
  const unverifiedInputs = inputStates.filter(input => !input.currentMatches && !input.historicalMatches).map(input => input.path)
  const replayStatus = verificationStatus(historicalReplay)
  const checker = inspectCheckerIdentity(root, checkerIdentity)

  const invalid = basis.errors.length > 0 || structuralIdentityErrors.length > 0 || integrityStatus === 'failed'
  let status
  if (invalid) status = HISTORICAL_BASIS_VALIDITY.INVALID
  else if (allInputsCurrent && integrityStatus === 'verified' && checker.status === 'verified') status = HISTORICAL_BASIS_VALIDITY.CURRENT_COMPATIBLE
  else if (allInputsHistoricallyTraceable && integrityStatus === 'verified' && replayStatus === 'verified') status = HISTORICAL_BASIS_VALIDITY.HISTORICAL_VALID
  else status = HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED

  if (inputIdentityErrors.length || unverifiedInputs.length) reasons.push(...new Set([
    ...inputIdentityErrors.map(error => `input_identity:${error.slice('input byte identity mismatch:'.length)}`),
    ...unverifiedInputs.map(path => `input_identity:unverified:${path}`),
  ]))
  if (integrityStatus === 'unknown') reasons.push('integrity:verification_required')
  if (checker.status !== 'verified') reasons.push(`checker_identity:${checker.status === 'failed' ? 'mismatch' : 'verification_required'}`)
  if (replayStatus !== 'verified' && status === HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED) reasons.push('historical_replay:verification_required')

  return {
    status,
    errors: [...new Set(errors)],
    reasons: [...new Set(reasons)],
    basis,
    integrityStatus,
    historicalReplayStatus: replayStatus,
    checkerIdentity: checker,
    allInputsCurrent,
    allInputsHistoricallyTraceable,
    inputStates,
    promotesCurrentArtifact: false,
    promotesReadiness: false,
    promotesSemanticAuthority: false,
    promotesActivation: false,
  }
}
