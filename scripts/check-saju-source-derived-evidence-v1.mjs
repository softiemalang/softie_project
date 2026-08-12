import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  checkArtifactIdentity,
  stableArtifactContentEqual,
} from '../src/artifactIdentity.js'
import {
  ASSET_PATH,
  ARTIFACT_DIR,
  COMPLETE_PATH,
  MANIFEST_PATH,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
  buildManifest,
  canonicalJson,
} from './materialize-saju-source-derived-evidence-v1.mjs'
import {
  SAJU_LEGACY_ROOT_ASSET_PATH,
  SAJU_SOURCE_DERIVED_ASSET_IDENTITY,
  SAJU_SOURCE_DERIVED_ASSET_PATH,
  canonicalSajuSourceDerivedAssetPath,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const parse = path => JSON.parse(readFileSync(path, 'utf8'))
const sameJson = (left, right) => canonicalJson(left) === canonicalJson(right)

async function readJson(root, path) {
  const bytes = await readFile(resolve(root, path))
  return { bytes, value: JSON.parse(bytes) }
}

function add(failures, condition, id, detail) {
  if (condition) failures.push({ id, detail })
}

async function checkIntegrity(root, path, failures) {
  try {
    const input = await readJson(root, path)
    const integrity = await readJson(root, `${path}.integrity.json`)
    add(failures, integrity.value?.schemaVersion !== `${SCHEMA}-integrity-v1`, `integrity_schema:${path}`, integrity.value?.schemaVersion)
    add(failures, integrity.value?.path !== path, `integrity_path:${path}`, integrity.value?.path)
    add(failures, integrity.value?.byteLength !== input.bytes.length, `integrity_length:${path}`, integrity.value?.byteLength)
    add(failures, integrity.value?.byteSha256 !== sha256(input.bytes), `integrity_hash:${path}`, integrity.value?.byteSha256)
  } catch (error) {
    failures.push({ id: `integrity_read:${path}`, detail: error.message })
  }
}

export async function checkArtifact({ root = ROOT, candidate, manifest } = {}) {
  const failures = []
  let diskComplete
  let diskManifest
  let expectedManifest
  let expected
  try {
    diskComplete = await readJson(root, COMPLETE_PATH)
    diskManifest = await readJson(root, MANIFEST_PATH)
    expectedManifest = await buildManifest({ root })
    expected = await buildArtifact({ root, manifest: expectedManifest })
  } catch (error) {
    return { pass: false, failures: [{ id: 'build', detail: error.message }] }
  }

  const actualCandidate = candidate || diskComplete.value
  const actualManifest = manifest || diskManifest.value
  await checkIntegrity(root, MANIFEST_PATH, failures)
  await checkIntegrity(root, COMPLETE_PATH, failures)

  add(failures, !existsSync(resolve(root, ASSET_PATH)), 'canonical_asset_missing', ASSET_PATH)
  add(failures, existsSync(resolve(root, SAJU_LEGACY_ROOT_ASSET_PATH)), 'legacy_root_asset_present', SAJU_LEGACY_ROOT_ASSET_PATH)
  add(failures, actualCandidate?.schemaVersion !== SCHEMA, 'schema_version', actualCandidate?.schemaVersion)
  add(failures, actualCandidate?.version !== VERSION, 'version', actualCandidate?.version)
  add(failures, actualCandidate?.sourceDerivedAsset?.path !== SAJU_SOURCE_DERIVED_ASSET_PATH, 'canonical_asset_path', actualCandidate?.sourceDerivedAsset?.path)
  add(failures, actualCandidate?.sourceDerivedAsset?.sha256 !== SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256, 'canonical_asset_hash', actualCandidate?.sourceDerivedAsset?.sha256)
  add(failures, actualCandidate?.provenance?.sourcePdfPage !== 2, 'source_page', actualCandidate?.provenance?.sourcePdfPage)
  add(failures, actualCandidate?.provenance?.rerenderByteIdentity !== true, 'rerender_byte_identity', actualCandidate?.provenance?.rerenderByteIdentity)
  add(failures, actualCandidate?.migration?.legacyRootPath !== SAJU_LEGACY_ROOT_ASSET_PATH, 'legacy_mapping', actualCandidate?.migration)
  add(failures, actualCandidate?.migration?.activeDependencyRule !== 'filesystem reads resolve the canonical asset path; the legacy root path is not an active dependency.', 'active_dependency_rule', actualCandidate?.migration?.activeDependencyRule)
  add(failures, actualCandidate?.scope?.sourcePdfCopied !== false || actualCandidate?.scope?.sourcePdfModified !== false, 'source_pdf_mutation', actualCandidate?.scope)
  add(failures, actualCandidate?.readinessBoundary?.availableForInterpretation !== false || actualCandidate?.readinessBoundary?.productionActivation !== 'blocked', 'readiness_promotion', actualCandidate?.readinessBoundary)
  add(failures, !sameJson(diskManifest.value, actualManifest), 'manifest_disk_content', 'candidate manifest differs from disk manifest')
  add(failures, !sameJson(diskManifest.value, expectedManifest), 'manifest_materialized_content', 'manifest differs from deterministic source/asset provenance')
  add(failures, !stableArtifactContentEqual(actualCandidate, expected), 'complete_materialized_content', 'complete differs from deterministic successor materialization')

  failures.push(...checkArtifactIdentity(actualCandidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
  }))

  return {
    pass: failures.length === 0,
    failures,
    path: COMPLETE_PATH,
    assetPath: ASSET_PATH,
    assetSha256: SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256,
    legacyRootRemoved: !existsSync(resolve(root, SAJU_LEGACY_ROOT_ASSET_PATH)),
    canonicalAssetPath: canonicalSajuSourceDerivedAssetPath(root),
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const completePath = resolve(process.argv[2] || COMPLETE_PATH)
  const candidate = parse(completePath)
  const result = await checkArtifact({ candidate })
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (!result.pass) process.exitCode = 1
}

void ARTIFACT_DIR
