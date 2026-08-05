import { buildArtifact } from './materialize-ziwei-tianfu-convention-provenance-v0.mjs'
import { checkArtifact } from './check-ziwei-tianfu-convention-provenance-v0.mjs'
const mutations = [
  ['source value', x => { x.rows[0].source.raw.tianfuBranch = '子' }],
  ['integrated value', x => { x.rows[0].integrated.raw.tianfuBranch = '子' }],
  ['git commit', x => { x.provenance.history[0].commit = '0'.repeat(40) }],
  ['git location', x => { x.provenance.currentFiles[0].symbols[1].lines = '1-1' }],
  ['direction', x => { x.model.source.neutral.directionSign = 1 }],
  ['base palace', x => { x.model.source.neutral.anchor.ordinal = 5 }],
  ['rotation', x => { x.comparison.relationResults.find(y => y.candidateId === 'rotation-06').axes.rotation = 5 }],
  ['palace identity', x => { x.rows[0].palaceIdentity.source.status = 'same' }],
  ['count', x => { x.comparison.transformCoverage.rotation06.matchedRows = 149 }],
  ['residual', x => { x.comparison.transformCoverage.rotation06.residualRows = 1 }],
  ['verdict', x => { x.comparison.classification.semanticEquivalence = 'equivalent' }],
  ['readiness', x => { x.readinessImpact.readiness = 'ready' }],
  ['linked hash', x => { x.linkage.sourceChain.artifactByteSha256 = '0'.repeat(64) }],
  ['source artifact hash', x => { x.immutableExistingBytes[0].sha256 = '0'.repeat(64) }],
]
const base = await buildArtifact(); const findings = []
for (const [name, mutate] of mutations) { const copy = structuredClone(base); mutate(copy); if (!(await checkArtifact(copy)).length) findings.push(name) }
console.log(JSON.stringify({ schemaVersion: `${base.schemaVersion}-negative-v0`, tested: mutations.length, findings }, null, 2)); if (findings.length) process.exitCode = 1
