import { buildPilotArtifact } from './materialize-ziwei-tianfu-star-placement-clean-rule-seed-pilot-v0.mjs'
import { checkPilotArtifact } from './check-ziwei-tianfu-star-placement-clean-rule-seed-pilot-v0.mjs'
const mutations = [
  ['pdf hash', x => { x.sourceWitness.pdfSha256 = '0'.repeat(64) }], ['page locator', x => { x.sourceWitness.rulePageRange.pdfPages = [14] }], ['ocr promotion', x => { x.transcription.ocrStatus = 'canonical' }], ['direction silent change', x => { x.normalizedRule.procedure.direction = 'forward' }], ['domain omission', x => { x.comparison.domains.integrated.rows.pop() }], ['enum mutation', x => { x.normalizedRule.mapping.traditionalToEngine.天府 = 'wrong' }], ['mismatch concealment', x => { x.comparison.mismatchCount = 0 }], ['other star', x => { x.normalizedRule.output.traditionalName = '紫微' }], ['readiness promotion', x => { x.boundaries.readiness = 'ready' }], ['nondeterministic id', x => { x.comparison.domains.integrated.rows[0].rowId = 'random' }], ['existing artifact mutation', x => { x.immutableExistingBytes[0].sha256 = '0'.repeat(64) }],
]
const findings = []
const base = await buildPilotArtifact()
for (const [name, mutate] of mutations) { const candidate = structuredClone(base); mutate(candidate); const errors = await checkPilotArtifact(candidate); if (!errors.length) findings.push(name) }
console.log(JSON.stringify({ schemaVersion: 'ziwei-tianfu-star-placement-clean-rule-seed-pilot-negative-v0', tested: mutations.length, findings }, null, 2)); if (findings.length) process.exitCode = 1
