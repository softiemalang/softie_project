import { buildArtifact } from './materialize-ziwei-major-star-coordinate-provenance-v0.mjs'
import { checkArtifact } from './check-ziwei-major-star-coordinate-provenance-v0.mjs'
const mutations = [
  ['raw branch', x => { x.comparison.roots.ziwei.rows[0].source = '子' }],
  ['coverage', x => { x.comparison.roots.tianfu.rotation06MatchCount = 149 }],
  ['first divergence', x => { x.dependencyGraph.firstDivergence.rowId = 'bureau-2-day-02' }],
  ['source unresolved', x => { x.inventory.find(y => y.starId === 'taiyin').sourceRuleStatus = 'direct_rule' }],
  ['semantic identity', x => { x.coordinateConvention.integrated.palaceIdentity = 'established' }],
  ['readiness', x => { x.readinessImpact.readiness = 'ready' }],
  ['production mutation', x => { x.preservedBoundaries.productionRuleModified = true }],
  ['relation candidates', x => { x.comparison.roots.tianfu.relation.candidateCount = 168 }],
]
const artifact = await buildArtifact(); const results = []
for (const [name, mutate] of mutations) { const candidate = structuredClone(artifact); mutate(candidate); const failures = await checkArtifact(candidate); results.push({ name, rejected: failures.length > 0, failures }) }
console.log(JSON.stringify({ pass: results.every(x => x.rejected), results }, null, 2)); if (!results.every(x => x.rejected)) process.exitCode = 1
