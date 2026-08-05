import { buildArtifact } from './materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs'
import { checkArtifact } from './check-ziwei-twelve-major-star-placement-evidence-v0.mjs'

const mutations = [
  ['required PDF hash', x => { x.source.editions.mingNanyang.actualSha256 = '0'.repeat(64) }],
  ['required page count', x => { x.source.screening.nanbeishanren.pagesScreened = 218 }],
  ['required normalized rule', x => { x.normalizedRuleTable[0].offset = 0 }],
  ['required sourceRef', x => { x.occurrences[0].source.sourceRefs = [] }],
  ['required production ref', x => { x.occurrences[0].production.codeRefs = [] }],
  ['row identity', x => { x.occurrences[0].rowId = 'tampered' }],
  ['occurrence branch', x => { x.occurrences[0].production.branch = x.occurrences[0].production.branch === '子' ? '丑' : '子' }],
  ['rotation coverage', x => { x.comparison.byStar.find(row => row.starId === 'taiyin').normalizedMatchCount = 299 }],
  ['candidate axis', x => { x.transformationSearch.axes.rotations = [0] }],
  ['semantic boundary', x => { x.promotionBoundary.semanticIdentity = 'proven' }],
  ['input byte identity', x => { x.artifactIdentity.inputs[0].byteSha256 = '1'.repeat(64) }],
  ['generation base identity', x => { x.artifactIdentity.generation.baseHead = '0'.repeat(40) }],
  ['self-referential included commit', x => { x.artifactIdentity.generation.includedCommit = x.artifactIdentity.generation.baseHead }],
  ['artifact identity', x => { x.artifactIdentity.artifactPayloadSha256 = '0'.repeat(64) }],
]

const base = await buildArtifact(); const findings = []
for (const [name, mutate] of mutations) { const copy = structuredClone(base); mutate(copy); if (!(await checkArtifact(copy)).length) findings.push(name) }
console.log(JSON.stringify({ schemaVersion: `${base.schemaVersion}-negative-v0`, tested: mutations.length, findings }, null, 2)); if (findings.length) process.exitCode = 1
