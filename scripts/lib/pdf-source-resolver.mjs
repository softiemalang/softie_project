import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile as readFileAsync } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'

const SHA256 = /^[0-9a-f]{64}$/

export const PDF_SOURCE_REGISTRY = Object.freeze({
  nanbei_quanbao_219p: Object.freeze({
    sourceId: 'nanbei_quanbao_219p',
    expectedSha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
    envVar: 'PDF_SOURCE_NANBEI_PATH',
    filename: 'nanbei_quanbao_219p.pdf',
    pageCount: 219,
    historicalMetadataPath: '/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf',
  }),
  nanyangtang_quanbao_528p: Object.freeze({
    sourceId: 'nanyangtang_quanbao_528p',
    expectedSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    envVar: 'PDF_SOURCE_NANYANGTANG_PATH',
    filename: 'nanyangtang_quanbao_528p.pdf',
    pageCount: 528,
    historicalMetadataPath: '/Users/softie/Downloads/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
  }),
})

export class PdfSourceResolutionError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'PdfSourceResolutionError'
    this.code = code
    Object.assign(this, details)
  }
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function registryEntry(sourceId) {
  const entry = PDF_SOURCE_REGISTRY[sourceId]
  if (!entry) throw new PdfSourceResolutionError('UNKNOWN_SOURCE_ID', `unknown PDF source id: ${sourceId}`, { sourceId })
  return entry
}

function invalidInput(sourceId, message, details = {}) {
  throw new PdfSourceResolutionError('INVALID_SOURCE_INPUT', message, { sourceId, ...details })
}

function normalizePath(sourceId, candidatePath) {
  if (typeof candidatePath !== 'string' || candidatePath.trim() === '') {
    invalidInput(sourceId, `PDF source path must be a non-empty string: ${candidatePath}`)
  }
  return resolve(candidatePath)
}

function readCliPath(argv) {
  if (!Array.isArray(argv)) return undefined
  const index = argv.indexOf('--pdf-path')
  if (index !== -1) return argv[index + 1] ?? ''
  const inline = argv.find(value => typeof value === 'string' && value.startsWith('--pdf-path='))
  return inline?.slice('--pdf-path='.length)
}

function configuredCandidates(source, options) {
  const config = options.config ?? {}
  const explicit = options.compatibilityCandidates ?? config.compatibilityCandidates?.[source.sourceId]
  if (explicit !== undefined && !Array.isArray(explicit)) {
    invalidInput(source.sourceId, 'compatibilityCandidates must be an array', { compatibilityCandidates: explicit })
  }
  return explicit ?? []
}

function selectCandidates(source, options) {
  const env = options.env ?? process.env
  const config = options.config ?? {}
  const cliPath = readCliPath(options.argv ?? process.argv.slice(2))
  const apiPath = options.explicitPath ?? options.path

  if (apiPath !== undefined || cliPath !== undefined) {
    return { kind: 'explicit', paths: [apiPath ?? cliPath] }
  }

  const configuredPath = config.sourcePaths?.[source.sourceId]
    ?? config.paths?.[source.sourceId]
    ?? env[source.envVar]
  const configuredDir = config.sourceDir ?? env.PDF_SOURCE_DIR
  if (configuredPath !== undefined) return { kind: 'configured', paths: [configuredPath] }
  if (configuredDir !== undefined) return { kind: 'configured', paths: [join(configuredDir, source.filename)] }

  return { kind: 'compatibility', paths: configuredCandidates(source, options) }
}

function readCandidateSync(sourceId, candidatePath, expectedSha256) {
  const path = normalizePath(sourceId, candidatePath)
  let bytes
  try {
    bytes = readFileSync(path)
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      throw new PdfSourceResolutionError('MISSING_SOURCE_FILE', `PDF source file is missing: ${path}`, { sourceId, candidatePath: path, cause: error })
    }
    throw new PdfSourceResolutionError('SOURCE_READ_FAILURE', `PDF source file could not be read: ${path}`, { sourceId, candidatePath: path, cause: error })
  }
  const actualSha256 = sha256(bytes)
  if (actualSha256 !== expectedSha256) {
    throw new PdfSourceResolutionError('SHA256_MISMATCH', `PDF source SHA-256 mismatch for ${path}: expected ${expectedSha256}, got ${actualSha256}`, { sourceId, candidatePath: path, expectedSha256, actualSha256 })
  }
  return path
}

async function readCandidate(sourceId, candidatePath, expectedSha256) {
  const path = normalizePath(sourceId, candidatePath)
  let bytes
  try {
    bytes = await readFileAsync(path)
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      throw new PdfSourceResolutionError('MISSING_SOURCE_FILE', `PDF source file is missing: ${path}`, { sourceId, candidatePath: path, cause: error })
    }
    throw new PdfSourceResolutionError('SOURCE_READ_FAILURE', `PDF source file could not be read: ${path}`, { sourceId, candidatePath: path, cause: error })
  }
  const actualSha256 = sha256(bytes)
  if (actualSha256 !== expectedSha256) {
    throw new PdfSourceResolutionError('SHA256_MISMATCH', `PDF source SHA-256 mismatch for ${path}: expected ${expectedSha256}, got ${actualSha256}`, { sourceId, candidatePath: path, expectedSha256, actualSha256 })
  }
  return path
}

export function resolvePdfSourcePathSync(sourceId, options = {}) {
  const source = registryEntry(sourceId)
  const selection = selectCandidates(source, options)
  if (selection.paths.length === 0) {
    throw new PdfSourceResolutionError('MISSING_SOURCE_FILE', `no explicit PDF source configured for ${sourceId}`, { sourceId, resolutionKind: selection.kind })
  }
  const failures = []
  for (const candidatePath of selection.paths) {
    try {
      return readCandidateSync(sourceId, candidatePath, source.expectedSha256)
    } catch (error) {
      failures.push(error)
      if (selection.kind !== 'compatibility' || error.code === 'SHA256_MISMATCH' || error.code === 'SOURCE_READ_FAILURE' || error.code === 'INVALID_SOURCE_INPUT') throw error
    }
  }
  const last = failures.at(-1)
  throw new PdfSourceResolutionError(last?.code ?? 'MISSING_SOURCE_FILE', `configured PDF compatibility candidates did not resolve ${sourceId}`, { sourceId, resolutionKind: selection.kind, failures })
}

export async function resolvePdfSourcePath(sourceId, options = {}) {
  const source = registryEntry(sourceId)
  const selection = selectCandidates(source, options)
  if (selection.paths.length === 0) {
    throw new PdfSourceResolutionError('MISSING_SOURCE_FILE', `no explicit PDF source configured for ${sourceId}`, { sourceId, resolutionKind: selection.kind })
  }
  const failures = []
  for (const candidatePath of selection.paths) {
    try {
      return await readCandidate(sourceId, candidatePath, source.expectedSha256)
    } catch (error) {
      failures.push(error)
      if (selection.kind !== 'compatibility' || error.code === 'SHA256_MISMATCH' || error.code === 'SOURCE_READ_FAILURE' || error.code === 'INVALID_SOURCE_INPUT') throw error
    }
  }
  const last = failures.at(-1)
  throw new PdfSourceResolutionError(last?.code ?? 'MISSING_SOURCE_FILE', `configured PDF compatibility candidates did not resolve ${sourceId}`, { sourceId, resolutionKind: selection.kind, failures })
}

export function getPdfSourceMetadata(sourceId) {
  const source = registryEntry(sourceId)
  return { ...source }
}

export function isPortablePdfSourcePath(value) {
  return typeof value === 'string' && isAbsolute(value)
}
