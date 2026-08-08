import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildPilotArtifact, canonicalJson, SCHEMA, BASIS_HEAD, MATERIALIZER_VERSION, SOURCE_PDF_SHA256, SOURCE_PDF_ACCESS } from './materialize-ziwei-ziwei-star-placement-clean-rule-seed-pilot-v0.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function checkPilotArtifact(candidate, root = process.cwd()) {
  const expected = await buildPilotArtifact(); const errors = []
  if (candidate.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate.basisHead !== BASIS_HEAD) errors.push('basis_head')
  if (candidate.sourceWitness?.pdfSha256 !== SOURCE_PDF_SHA256 || candidate.sourceWitness?.pdfPageCount !== 219 || candidate.sourceWitness?.pdfEncrypted !== false) errors.push('pdf_identity')
  if (candidate.sourceWitness?.rulePageRange?.pdfPages?.join(',') !== '11,12' || candidate.sourceWitness?.rulePageRange?.printedPages?.join(',') !== '三十一,三十三') errors.push('source_locator')
  if (candidate.transcription?.ocrStatus !== 'exploration_only_not_canonical' || candidate.transcription?.modernCommentaryIngested !== false || candidate.transcription?.uncertainty?.length < 2) errors.push('transcription_boundary')
  if (candidate.normalizedRule?.sourceTranscriptionId !== candidate.transcription?.transcriptionId || candidate.normalizedRule?.arithmetic?.remainder !== 'quotient * bureauNumber - lunarDay') errors.push('normalization_boundary')
  if (candidate.comparison?.inputCount !== 150 || candidate.comparison?.expectedInputCount !== 150 || candidate.comparison?.rows?.length !== 150 || candidate.comparison?.mismatchCount !== 0) errors.push('exhaustive_comparison')
  const ids = candidate.comparison?.rows?.map(row => row.rowId) ?? []; if (new Set(ids).size !== 150 || ids.some((id, index) => id !== expected.comparison.rows[index].rowId)) errors.push('row_id_or_order')
  if (candidate.comparison?.rows?.some(row => row.sourceDerived?.traditionalName !== '紫微' || row.productionEngine?.starId !== 'ziwei' || row.divergence !== null)) errors.push('star_boundary_or_mismatch_hidden')
  if (candidate.independence?.sourceEvaluatorImportsProduction !== false || candidate.independence?.sourceEvaluatorCopiesProduction !== false) errors.push('independence')
  if (candidate.boundaries?.stableClaimCount !== 0 || candidate.boundaries?.readiness !== 'not_safe_to_start' || candidate.boundaries?.grounding !== 'blocked' || candidate.boundaries?.activation !== 'experimental' || candidate.boundaries?.otherStarsIncluded !== false) errors.push('promotion_or_scope')
  const rebuilt = await buildPilotArtifact()
  // observedHead is a current checkout observation, not immutable artifact content.
  // Compare the stable payload while preserving and validating the stored generation.baseHead/payload hash.
  const comparable = value => { const copy = structuredClone(value); delete copy.observedHead; delete copy.artifactIdentity; return copy }
  if (canonicalJson(comparable(candidate)) !== canonicalJson(comparable(rebuilt))) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: MATERIALIZER_VERSION }))
  const pdf = await readFile(SOURCE_PDF_ACCESS); if (hash(pdf) !== SOURCE_PDF_SHA256) errors.push('pdf_reverification')
  return errors
}
if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate=JSON.parse(await readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`),'utf8')); const errors=await checkPilotArtifact(candidate); if (errors.length) { console.error(JSON.stringify({errors},null,2)); process.exitCode=1 } else console.log(JSON.stringify({valid:true,pdfReverified:true,inputCount:150},null,2)) }
