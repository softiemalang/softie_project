import { buildFieldKit } from './materialize-ziwei-palace-source-acquisition-field-kit-v0.mjs'
import { checkArtifact } from './check-ziwei-palace-source-acquisition-field-kit-v0.mjs'
const cases = [
  ['missing_target', a => { a.targetCriteria.targets.pop(); a.targetCriteria.requiredTargetCount = 4 }],
  ['weakened_acceptance', a => { a.targetCriteria.targets[0].acceptance = 'keyword related' }],
  ['ocr_only_allowed', a => { a.quickMissionCard.notEvidence = [] }],
  ['source_identity_omitted', a => { a.evidenceIntakeForm.fields = a.evidenceIntakeForm.fields.filter(x => x.id !== 'sourceIdentity') }],
  ['semantic_promotion', a => { a.sourceBasis.rotation06Boundary = 'semantic identity' }],
  ['quick_guide_drift', a => { a.sourceAcquisitionGuide.rejection = [] }],
]
const findings = []
for (const [name, mutate] of cases) { const artifact = await buildFieldKit(); mutate(artifact); if (!(await checkArtifact(artifact)).length) findings.push(name) }
console.log(JSON.stringify({ pass: findings.length === 0, findings }, null, 2)); if (findings.length) process.exitCode = 1
