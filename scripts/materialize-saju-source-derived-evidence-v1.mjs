import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import {
  SAJU_LEGACY_ROOT_ASSET_PATH,
  SAJU_SOURCE_DERIVED_ASSET_IDENTITY,
  SAJU_SOURCE_DERIVED_ASSET_PATH,
  SAJU_SOURCE_DERIVED_EVIDENCE_SCHEMA,
  SAJU_SOURCE_DERIVED_EVIDENCE_VERSION,
  SAJU_SOURCE_ID,
  SAJU_SOURCE_PDF_IDENTITY,
  SAJU_SOURCE_PDF_PATH,
  SAJU_SOURCE_RENDER_SPEC,
  canonicalSajuSourceDerivedAssetPath,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const SCHEMA = SAJU_SOURCE_DERIVED_EVIDENCE_SCHEMA
export const VERSION = SAJU_SOURCE_DERIVED_EVIDENCE_VERSION
export const MATERIALIZER_VERSION = VERSION
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const ASSET_PATH = SAJU_SOURCE_DERIVED_ASSET_PATH
export const MANIFEST_PATH = `${ARTIFACT_DIR}/asset-manifest.json`
export const COMPLETE_PATH = `${ARTIFACT_DIR}/complete.json`
export const ROOT = resolve(new URL('../', import.meta.url).pathname)

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = `${result.stdout || ''}\n${result.stderr || ''}`.trim()
    throw new Error(`${command} failed with status ${result.status}: ${detail}`)
  }
  return result
}

function installedPdftoppmVersion() {
  const result = run('pdftoppm', ['-v'])
  const match = `${result.stdout || ''}\n${result.stderr || ''}`.match(/pdftoppm version\s+([^\s]+)/)
  if (!match) throw new Error('pdftoppm version could not be identified')
  return match[1]
}

function pdfPageCount(path) {
  const result = run('pdfinfo', [path])
  const match = result.stdout.match(/^Pages:\s+(\d+)$/m)
  if (!match) throw new Error(`PDF page count unavailable: ${path}`)
  return Number(match[1])
}

async function inspectSourcePdf() {
  const bytes = await readFile(SAJU_SOURCE_PDF_PATH)
  const fileStat = await stat(SAJU_SOURCE_PDF_PATH)
  const actual = {
    path: SAJU_SOURCE_PDF_PATH,
    fileName: SAJU_SOURCE_PDF_IDENTITY.fileName,
    byteLength: fileStat.size,
    sha256: sha256(bytes),
    pageCount: pdfPageCount(SAJU_SOURCE_PDF_PATH),
  }
  if (actual.byteLength !== SAJU_SOURCE_PDF_IDENTITY.byteLength) throw new Error(`source PDF byte length drift: ${actual.byteLength}`)
  if (actual.sha256 !== SAJU_SOURCE_PDF_IDENTITY.sha256) throw new Error(`source PDF byte hash drift: ${actual.sha256}`)
  if (actual.pageCount !== SAJU_SOURCE_PDF_IDENTITY.pageCount) throw new Error(`source PDF page count drift: ${actual.pageCount}`)
  return { ...SAJU_SOURCE_PDF_IDENTITY, actual }
}

async function verifyRenderedAsset() {
  const version = installedPdftoppmVersion()
  if (version !== SAJU_SOURCE_RENDER_SPEC.rendererVersion) {
    throw new Error(`Poppler version drift: expected ${SAJU_SOURCE_RENDER_SPEC.rendererVersion}, got ${version}`)
  }
  const directory = await mkdtemp(join(tmpdir(), 'saju-source-derived-evidence-'))
  const outputPrefix = join(directory, 'ziping-zhenquan-pdf-page-002-rendered-evidence')
  const outputPath = `${outputPrefix}.jpg`
  try {
    run('pdftoppm', [
      '-f', '2',
      '-l', '2',
      '-scale-to', '1400',
      '-jpeg',
      '-singlefile',
      SAJU_SOURCE_PDF_PATH,
      outputPrefix,
    ], { stdio: ['ignore', 'ignore', 'ignore'] })
    const bytes = await readFile(outputPath)
    return {
      rendererVersion: version,
      renderedByteLength: bytes.length,
      renderedSha256: sha256(bytes),
      byteIdentical: bytes.length === SAJU_SOURCE_DERIVED_ASSET_IDENTITY.byteLength
        && sha256(bytes) === SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256,
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

async function inspectCanonicalAsset(root) {
  const path = canonicalSajuSourceDerivedAssetPath(root)
  const bytes = await readFile(path)
  const fileStat = await stat(path)
  const actual = { path: ASSET_PATH, byteLength: fileStat.size, sha256: sha256(bytes) }
  if (actual.byteLength !== SAJU_SOURCE_DERIVED_ASSET_IDENTITY.byteLength) throw new Error(`derived asset byte length drift: ${actual.byteLength}`)
  if (actual.sha256 !== SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256) throw new Error(`derived asset byte hash drift: ${actual.sha256}`)
  return { ...SAJU_SOURCE_DERIVED_ASSET_IDENTITY, actual }
}

export async function buildManifest({ root = ROOT } = {}) {
  const sourcePdf = await inspectSourcePdf()
  const asset = await inspectCanonicalAsset(root)
  const renderVerification = await verifyRenderedAsset()
  if (!renderVerification.byteIdentical) throw new Error(`re-rendered page 2 is not byte-identical: ${renderVerification.renderedSha256}`)
  return {
    schemaVersion: `${SCHEMA}-asset-manifest-v1`,
    version: VERSION,
    asset: {
      ...asset,
      repositoryPath: ASSET_PATH,
      storage: 'canonical_repository_source_derived_asset',
      sourceIsDerivative: true,
    },
    source: {
      sourceId: SAJU_SOURCE_ID,
      work: '子平真诠',
      attribution: '沈孝瞻原著（local PDF metadata/title surface; edition identity remains unresolved）',
      pdf: sourcePdf,
      sourcePdfStoredInRepository: false,
      authorityStatus: 'local_file_bytes_verified_but_edition_identity_and_independent_authority_unresolved',
    },
    derivation: {
      relation: 'rendered_derivative_of_source_pdf_page',
      pdfPage: 2,
      render: {
        ...SAJU_SOURCE_RENDER_SPEC,
        command: [...SAJU_SOURCE_RENDER_SPEC.command],
        verification: renderVerification,
      },
      pixelDimensions: {
        width: SAJU_SOURCE_DERIVED_ASSET_IDENTITY.pixelWidth,
        height: SAJU_SOURCE_DERIVED_ASSET_IDENTITY.pixelHeight,
      },
    },
    migration: {
      legacyRootPath: SAJU_LEGACY_ROOT_ASSET_PATH,
      legacyRootPathStatus: 'removed_from_worktree_after_byte_preserving_migration',
      legacyByteSha256: SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256,
      canonicalPath: ASSET_PATH,
      canonicalByteSha256: SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256,
      historicalArtifacts: 'pre-migration artifacts and audit documents retain the old root path as historical evidence; they are not rewritten by this successor.',
      activeDependencyRule: 'filesystem reads resolve the canonical asset path; the legacy root path is not an active dependency.',
    },
    boundaries: {
      sourcePdfCopied: false,
      sourcePdfModified: false,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      readinessChanged: false,
      productionChanged: false,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      rightsDecision: 'not_adjudicated; derived asset is retained for internal provenance and evidence review only',
    },
  }
}

export async function buildArtifact({ root = ROOT, manifest } = {}) {
  const assetManifest = manifest || await buildManifest({ root })
  const manifestBytes = Buffer.from(canonicalJson(assetManifest))
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const artifact = {
    schemaVersion: SCHEMA,
    version: VERSION,
    verdictToken: 'complete_saju_source_derived_evidence_asset_migrated_uncommitted',
    basis: {
      branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
      currentHead,
      originMainHead: git(root, ['rev-parse', 'origin/main']),
      sourcePdf: SAJU_SOURCE_PDF_PATH,
      sourcePdfSha256: SAJU_SOURCE_PDF_IDENTITY.sha256,
      historicalArtifactsReadOnly: true,
    },
    assetManifest: {
      path: MANIFEST_PATH,
      byteLength: manifestBytes.length,
      sha256: sha256(manifestBytes),
    },
    sourceDerivedAsset: assetManifest.asset,
    provenance: {
      sourceId: SAJU_SOURCE_ID,
      sourceWork: '子平真诠',
      sourcePdfPage: 2,
      sourcePdfToAsset: 'source PDF page 2 rendered with the pinned Poppler command; no image re-encoding or content edit was performed',
      renderCommand: SAJU_SOURCE_RENDER_SPEC.commandTemplate,
      rendererVersion: SAJU_SOURCE_RENDER_SPEC.rendererVersion,
      rerenderByteIdentity: assetManifest.derivation.render.verification.byteIdentical,
    },
    migration: assetManifest.migration,
    scope: {
      calculationModified: false,
      sourcePdfCopied: false,
      sourcePdfModified: false,
      semanticAuthorityPromoted: false,
      readinessChanged: false,
      productionChanged: false,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      commitPerformed: false,
      pushPerformed: false,
      deploymentPerformed: false,
      remoteDatabaseChanged: false,
    },
    historicalContract: {
      predecessorArtifactsRewritten: false,
      predecessorArtifactPathsRemainHistorical: true,
      legacyRootByteIdentityPreserved: true,
      oldPathIsHistoricalOnly: true,
    },
    readinessBoundary: {
      status: 'blocked_unchanged',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      stableClaimCount: 0,
      note: 'Asset provenance normalization does not establish classical source authority or change Saju readiness.',
    },
    materializer: MATERIALIZER_PATH,
    checker: `scripts/check-${SCHEMA}.mjs`,
    negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: currentHead,
    inputs: [
      'src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js',
      MATERIALIZER_PATH,
      ASSET_PATH,
    ],
  }))
}

async function writeJsonWithIntegrity(path, value) {
  const bytes = Buffer.from(canonicalJson(value))
  await writeFile(path, bytes)
  await writeFile(`${path}.integrity.json`, canonicalJson({
    schemaVersion: `${SCHEMA}-integrity-v1`,
    path: path.replace(`${ROOT}/`, ''),
    byteLength: bytes.length,
    byteSha256: sha256(bytes),
    byteScope: 'UTF-8 JSON bytes including final LF',
  }))
  return { path, byteLength: bytes.length, sha256: sha256(bytes) }
}

export async function materialize({ root = ROOT, completePath = resolve(root, COMPLETE_PATH) } = {}) {
  const directory = dirname(completePath)
  const manifestPath = resolve(root, MANIFEST_PATH)
  const manifest = await buildManifest({ root })
  await mkdir(join(directory, 'assets'), { recursive: true })
  await writeJsonWithIntegrity(manifestPath, manifest)
  const artifact = await buildArtifact({ root, manifest })
  await mkdir(directory, { recursive: true })
  const complete = await writeJsonWithIntegrity(completePath, artifact)
  return { artifact, manifest, outputs: { manifest: manifestPath, complete: completePath }, hashes: { manifest, complete } }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materialize()
  process.stdout.write(JSON.stringify({
    schema: SCHEMA,
    assetPath: result.manifest.asset.repositoryPath,
    assetSha256: result.manifest.asset.sha256,
    sourcePdfSha256: result.manifest.source.pdf.sha256,
    rerenderByteIdentical: result.manifest.derivation.render.verification.byteIdentical,
    completePath: COMPLETE_PATH,
  }, null, 2) + '\n')
}
