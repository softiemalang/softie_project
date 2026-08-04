import { buildDiscrepancyArtifact } from './materialize-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs'
import { checkDiscrepancyArtifact } from './check-ziwei-tianfu-placement-discrepancy-analysis-v0.mjs'
const mutations = [
  ['source-first PDF hash', x => { x.sourceWitness.pdfSha256 = '0'.repeat(64) }],
  ['render hash', x => { x.sourceWitness.render.sha256 = '0'.repeat(64) }],
  ['transposed table', x => { x.reviewerA.transcription.pages[0].table.cells.reverse() }],
  ['glyph discrepancy hidden', x => { x.abComparison.rows[1].classification = 'exact' }],
  ['partial relation', x => { x.direct.relationResults[0].testedRowCount = 11 }],
  ['arbitrary permutation', x => { x.direct.relationResults[0].definition = 'arbitrary permutation' }],
  ['row exception', x => { x.direct.relationResults[0].firstFailure = null }],
  ['single exact fit', x => { x.direct.exactFitIds = x.direct.exactFitIds.slice(0, 1) }],
  ['prediction overwrite', x => { x.integrated.rows[0].production.branch = x.integrated.rows[0].prediction.predictedBranch }],
  ['forced reconcile', x => { x.integrated.originalBaseline.matchCount = 150 }],
  ['truth lineage', x => { x.boundaries.truthLineageDeclared = true }],
  ['status promotion', x => { x.boundaries.readiness = 'ready' }],
  ['existing artifact mutation', x => { x.immutableExistingBytes[0].sha256 = '0'.repeat(64) }],
  ['nondeterministic ID', x => { x.direct.rows[0].rowId = 'random' }],
]
const base = await buildDiscrepancyArtifact(); const findings = []
for (const [name, mutate] of mutations) { const candidate = structuredClone(base); mutate(candidate); if (!(await checkDiscrepancyArtifact(candidate)).length) findings.push(name) }
console.log(JSON.stringify({ schemaVersion: 'ziwei-tianfu-placement-discrepancy-analysis-negative-v0', tested: mutations.length, findings }, null, 2)); if (findings.length) process.exitCode = 1
