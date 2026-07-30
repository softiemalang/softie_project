import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { isAbsolute, join, normalize, resolve } from 'node:path'

export const DEFAULT_INVENTORY_PATH = 'docs/de405-artifact-inventory.json'
export const DEFAULT_ARTIFACT_ROOT = 'artifacts'

export function parseCliOptions(args = []) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--artifact-root' || arg === '--inventory') {
      const value = args[index + 1]
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`)
      options[arg.slice(2).replaceAll('-', '')] = value
      index += 1
    } else if (arg === '--json') {
      options.json = true
    }
  }
  return options
}

export function resolveArtifactRoot({ cliRoot, env = process.env, cwd = process.cwd() } = {}) {
  const selected = cliRoot || env.DE405_ARTIFACT_ROOT || DEFAULT_ARTIFACT_ROOT
  return resolve(cwd, selected)
}

export function resolveInventoryPath({ cliPath, env = process.env, cwd = process.cwd() } = {}) {
  const selected = cliPath || env.DE405_ARTIFACT_INVENTORY || DEFAULT_INVENTORY_PATH
  return resolve(cwd, selected)
}

export function artifactRelativePath(inventoryArtifactPath, inventory) {
  const inventoryRoot = normalize(inventory.artifactRoot || DEFAULT_ARTIFACT_ROOT)
  const normalized = normalize(inventoryArtifactPath)
  return normalized === inventoryRoot || normalized.startsWith(`${inventoryRoot}/`)
    ? normalized.slice(inventoryRoot.length + 1)
    : normalized
}

export function resolveArtifactPath({ artifactPath, inventory, artifactRoot }) {
  const relative = artifactRelativePath(artifactPath, inventory)
  return isAbsolute(relative) ? resolve(relative) : join(artifactRoot, relative)
}

async function fileStatus(path, expected) {
  try {
    const info = await stat(path)
    if (!info.isFile()) return { status: 'not_a_file', path }
    const result = { status: 'present', path, sizeBytes: info.size }
    if (expected?.sizeBytes !== undefined && info.size !== expected.sizeBytes) result.status = 'size_mismatch'
    if (expected?.sha256 && result.status === 'present') {
      const hash = createHash('sha256')
      const content = await readFile(path)
      result.sha256 = hash.update(content).digest('hex')
      if (result.sha256 !== expected.sha256) result.status = 'sha256_mismatch'
    }
    return result
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing', path }
    throw error
  }
}

export async function inspectArtifactReadiness({ inventoryPath, artifactRoot, cwd = process.cwd() } = {}) {
  const resolvedInventoryPath = inventoryPath || resolveInventoryPath({ cwd })
  const resolvedArtifactRoot = artifactRoot || resolveArtifactRoot({ cwd })
  const inventory = JSON.parse(await readFile(resolvedInventoryPath, 'utf8'))
  const artifacts = inventory.artifacts || []
  const generated = artifacts.filter(artifact => artifact.storageClass === 'generated' && artifact.producer?.type !== 'system')
  const pending = artifacts.filter(artifact => artifact.storageClass === 'pending')
  const statuses = []
  for (const artifact of [...generated, ...pending]) {
    const path = resolveArtifactPath({ artifactPath: artifact.path, inventory, artifactRoot: resolvedArtifactRoot })
    statuses.push({ ...artifact, check: await fileStatus(path, artifact) })
  }
  const missingGenerated = statuses.filter(item => item.storageClass === 'generated' && item.check.status !== 'present')
  const missingPending = statuses.filter(item => item.storageClass === 'pending' && item.check.status !== 'present')
  const status = missingGenerated.length > 0
    ? 'blocked_missing_de405_artifacts'
    : missingPending.length > 0
      ? 'blocked_pending_de405_artifact_contract'
      : 'ready'
  return {
    status,
    artifactRoot: resolvedArtifactRoot,
    inventoryPath: resolvedInventoryPath,
    requiredGeneratedCount: generated.length,
    presentGeneratedCount: generated.filter(item => statuses.find(statusItem => statusItem.path === item.path)?.check.status === 'present').length,
    missingGeneratedCount: missingGenerated.length,
    pendingCount: pending.length,
    missing: missingGenerated.map(item => item.path).sort(),
    pending: missingPending.map(item => item.path).sort(),
    mismatches: statuses.filter(item => item.check.status.endsWith('mismatch') || item.check.status === 'not_a_file').map(item => ({ path: item.path, status: item.check.status })).sort((a, b) => a.path.localeCompare(b.path)),
    files: statuses
  }
}

export function formatReadiness(result) {
  return [
    `artifact root: ${result.artifactRoot}`,
    `required generated count: ${result.requiredGeneratedCount}`,
    `present generated count: ${result.presentGeneratedCount}`,
    `missing generated count: ${result.missingGeneratedCount}`,
    `pending count: ${result.pendingCount}`,
    `ready status: ${result.status}`,
    ...(result.missing.length ? ['missing artifacts:', ...result.missing.map(path => `  - ${path}`)] : []),
    ...(result.mismatches.length ? ['artifact mismatches:', ...result.mismatches.map(item => `  - ${item.path}: ${item.status}`)] : []),
    ...(result.pending.length ? ['pending artifacts requiring contract:', ...result.pending.map(path => `  - ${path}`)] : [])
  ].join('\n')
}
