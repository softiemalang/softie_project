import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { BASIS_HEAD, INPUT, SCHEMA, VERDICT, VERSION } from './materialize-ziwei-archive-scan-source-witness-admission-v0.mjs'
import { resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export function checkArchiveScanSourceWitness(artifact, { pdfBytes = null, root = process.cwd(), integrityArtifactByteSha256 = null, historicalArtifact = null } = {}) {
  const failures = []; const witness = artifact?.digitalWitness || {}
  if (artifact?.schemaVersion !== SCHEMA || artifact?.verdictToken !== VERDICT || artifact?.basisHead !== BASIS_HEAD) failures.push('schema_or_head')
  if (witness.source !== 'original' || witness.original !== true || witness.derivative !== false || witness.format !== 'Image Container PDF') failures.push('derivative_promoted_as_original')
  if (!Number.isInteger(witness.byteSize) || !/^[0-9a-f]{64}$/.test(witness.sha256) || witness.pdfPageCount !== 219 || witness.encrypted !== false) failures.push('byte_hash_page_or_encryption_gate')
  const ranges = artifact.structuralRangeMap || []; if (!ranges.length || ranges[0].pageStart !== 1 || ranges.at(-1).pageEnd !== 219) failures.push('range_coverage_boundary')
  for (let i=0;i<ranges.length;i++) { const r=ranges[i]; if (!Number.isInteger(r.pageStart)||!Number.isInteger(r.pageEnd)||r.pageStart>r.pageEnd) failures.push(`invalid_range:${r.rangeId}`); if (i && ranges[i-1].pageEnd+1 !== r.pageStart) failures.push(`range_gap_or_overlap:${r.rangeId}`) }
  if (artifact.identityLayers?.bibliographicEditionIdentity?.status !== 'partial') failures.push('edition_metadata_inferred')
  const rights = artifact.identityLayers?.rightsAccessStatus || {}; if (rights.publicDomain === true || rights.freeRedistribution === true || rights.aiTrainingPermission === true || rights.status !== 'rights_unresolved') failures.push('archive_access_promoted_to_rights')
  for (const c of artifact.contentClassAdmission || []) { if (['classical_source_text','modern_commentary','interpretive_prose'].includes(c.contentClass) && c.status === 'admitted') failures.push(`unsafe_content_admission:${c.contentClass}`) }
  if (artifact.downstreamBoundaries?.stableClaimCount !== 0 || artifact.downstreamBoundaries?.grounding !== 'blocked' || artifact.downstreamBoundaries?.readiness !== 'not_safe_to_start' || artifact.downstreamBoundaries?.activation !== 'experimental') failures.push('downstream_promotion')
  if (artifact.seedCandidates?.some(x=>x.extracted === true)) failures.push('seed_extracted')
  const identityInputs = artifact.artifactIdentity?.inputs || []
  if (identityInputs.length !== 1 || identityInputs[0]?.path !== INPUT) failures.push('input_set_or_order')
  if (pdfBytes) { if (pdfBytes.length !== witness.byteSize) failures.push('actual_byte_size_mismatch'); if (createHash('sha256').update(pdfBytes).digest('hex') !== witness.sha256) failures.push('actual_sha256_mismatch') }
  if (integrityArtifactByteSha256 !== null) {
    const artifactBytes = canonicalArtifactBytes(artifact)
    if (integrityArtifactByteSha256 !== createHash('sha256').update(artifactBytes).digest('hex')) failures.push('sidecar_artifact_byte_mismatch')
  }
  if (historicalArtifact && artifact.artifactIdentity?.generation?.baseHead !== historicalArtifact.artifactIdentity?.generation?.baseHead) failures.push('historical_generation_base_mismatch')
  try { execFileSync('git',['-c','core.fsmonitor=false','cat-file','-e',`${artifact.basisHead}^{commit}`],{cwd:root,stdio:'ignore'}) } catch { failures.push('basis_head_missing') }
  failures.push(...checkArtifactIdentity(artifact,{root,artifactId:SCHEMA,materializerPath:'scripts/materialize-ziwei-archive-scan-source-witness-admission-v0.mjs',materializerVersion:VERSION}))
  return [...new Set(failures)]
}

const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
const canonicalArtifactBytes = artifact => Buffer.from(`${JSON.stringify(stable(artifact), null, 2)}\n`)

if (process.argv[1] === new URL(import.meta.url).pathname && process.argv[3]) process.argv[3] = resolvePdfSourcePathSync('nanbei_quanbao_219p', { explicitPath: process.argv[3], argv: [] })

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = resolve(new URL('..', import.meta.url).pathname); const path = resolve(process.argv[2] || 'artifacts/ziwei-archive-scan-source-witness-admission-v0/complete.json'); const artifact = JSON.parse(await readFile(path,'utf8')); const pdfPath = process.argv[3]; const pdfBytes = pdfPath ? await readFile(pdfPath) : null; const sidecarPath = `${path}.integrity.json`; const sidecar = JSON.parse(await readFile(sidecarPath, 'utf8')); const failures = checkArchiveScanSourceWitness(artifact,{pdfBytes,root,integrityArtifactByteSha256:sidecar.artifactByteSha256}); const bytes=await readFile(path)
  const result={pass:failures.length===0,verdictToken:artifact.verdictToken,artifactByteSha256:createHash('sha256').update(bytes).digest('hex'),pdfReverified:Boolean(pdfPath),failures}; console.log(JSON.stringify(result,null,2)); if(failures.length) process.exitCode=1
}
