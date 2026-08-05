import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildFieldKit, canonicalJson, SCHEMA, SEALED_PATH, VERDICT } from './materialize-ziwei-palace-source-acquisition-field-kit-v0.mjs'

export async function checkArtifact(candidate, root = resolve(new URL('..', import.meta.url).pathname)) {
  const errors = []; let expected
  try { expected = await buildFieldKit({ root, observedHead: candidate.observedHead }) } catch (e) { return [`build:${e.message}`] }
  if (candidate.namespace !== SCHEMA || candidate.schemaVersion !== SCHEMA || candidate.verdictToken !== VERDICT) errors.push('identity_or_verdict')
  if (candidate.sourceBasis?.sealedArtifact !== SEALED_PATH || candidate.sourceBasis.sealedNamespace !== 'ziwei-palace-coordinate-semantic-identity-v0' || candidate.sourceBasis.rotation06Boundary !== 'numeric transform only; never semantic identity') errors.push('sealed_basis_boundary')
  const targets = candidate.targetCriteria?.targets
  if (candidate.targetCriteria?.requiredTargetCount !== 5 || !Array.isArray(targets) || targets.length !== 5) errors.push('target_count')
  const ids = new Set((targets || []).map(x => x.id)); for (const required of ['palace_names','earthly_branches','diagram_positions','ordinal_origin','direction']) if (!ids.has(required)) errors.push(`missing_target:${required}`)
  if (candidate.targetCriteria?.sourceRefClosure !== true || (targets || []).some(x => !Array.isArray(x.sourceRefs) || !x.sourceRefs.length || !x.acceptance || /rotation-06.*semantic|confidence|ranking/i.test(`${x.connection} ${x.acceptance}`))) errors.push('target_traceability_or_criteria')
  const card = candidate.quickMissionCard; const guide = candidate.sourceAcquisitionGuide
  if (!card || !guide || JSON.stringify(card.mustPhotograph) !== JSON.stringify(['표지 또는 서명면', '서명·저자/편자 식별면', '판권/간기·판본 식별면', '목차/권책 식별면', '대상 면 전체(표/도식 경계 포함)', '대상 면 앞뒤 문맥', '페이지/엽 번호가 보이는 촬영']) || JSON.stringify(card.notEvidence) !== JSON.stringify(guide.rejection)) errors.push('quick_guide_mismatch')
  if (guide.search?.families?.some(x => x.terms.some(term => !candidate.sourceBasis.sealedArtifactByteSha256 || typeof term !== 'string')) || !guide.search?.ungroundedVariants?.some(x => x.status === 'requires_human_definition')) errors.push('search_provenance')
  const requiredFields = ['sourceIdentity','edition','location','discoveryText','diagramDirection','correspondence','captureFiles','uncertainties']; const fields = new Set((candidate.evidenceIntakeForm?.fields || []).map(x => x.id)); for (const f of requiredFields) if (!fields.has(f)) errors.push(`missing_intake_field:${f}`)
  if (candidate.evidenceIntakeForm?.forbidden?.every(x => !/OCR-only|normalized|semantic|confidence/i.test(x))) errors.push('intake_forbidden_boundary')
  const levels = (candidate.triageRubric?.levels || []).map(x => x.id); if (JSON.stringify(levels) !== JSON.stringify(['candidate','promising','review_ready','potentially_sufficient','rejected']) || !/not.*confidence|not.*채택|operational/i.test(candidate.triageRubric?.purpose || '')) errors.push('triage_boundary')
  if (!candidate.analystHandoffSchema?.required?.includes('sourceIdentity') || candidate.analystHandoffSchema.outputBoundary?.forbidden?.some(x => /source adoption|production change|readiness|activation/i.test(x)) !== true) errors.push('handoff_boundary')
  if (candidate.blockerStatement?.includes('rotation-06') !== true || candidate.preservation?.productionMutation !== false || candidate.preservation?.readinessMutation !== false || candidate.preservation?.newMaterialAccepted !== false) errors.push('preservation_boundary')
  if (canonicalJson(candidate) !== canonicalJson(expected)) errors.push('materialized_content')
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const candidate = JSON.parse(await readFile(resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`), 'utf8')); const failures = await checkArtifact(candidate); console.log(JSON.stringify({ pass: failures.length === 0, failures }, null, 2)); if (failures.length) process.exitCode = 1 }
