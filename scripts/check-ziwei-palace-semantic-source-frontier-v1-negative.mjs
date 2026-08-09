import { buildArtifact } from './materialize-ziwei-palace-semantic-source-frontier-v1.mjs'
import { checkBundle } from './check-ziwei-palace-semantic-source-frontier-v1.mjs'

const base = await buildArtifact()
const mutations = [
  ['palace semantic promotion', value => { value.claims.find(item => item.id === 'palace_semantic_identity').status = 'verified' }],
  ['title authority promotion', value => { value.claims.find(item => item.id === 'scan_witness_identity').semanticLimit = 'authoritative' }],
  ['observation deletion', value => { value.sourceObservations = value.sourceObservations.filter(item => item.id !== 'nanbei-p7-twelve-cell-diagram') }],
  ['OCR/render boundary', value => { value.sourceObservations[0].visualReview.renderStorage = 'stored_canonical_ocr' }],
  ['readiness promotion', value => { value.boundaries.readiness = 'ready' }],
  ['production mutation', value => { value.boundaries.productionRuleModified = true }],
  ['frontier shortcut', value => { value.frontierAssessment.stillBlocked = [] }],
]
const findings = []
for (const [name, mutate] of mutations) { const candidate = structuredClone(base); mutate(candidate); if (checkBundle(candidate, base).length === 0) findings.push(name) }
console.log(JSON.stringify({ schema: base.schemaVersion, findings }, null, 2)); if (findings.length) process.exitCode = 1
