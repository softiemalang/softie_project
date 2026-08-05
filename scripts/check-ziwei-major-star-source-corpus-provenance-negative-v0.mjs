import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArtifact } from './materialize-ziwei-major-star-source-corpus-provenance-v0.mjs'
import { checkArtifact } from './check-ziwei-major-star-source-corpus-provenance-v0.mjs'
const cases = [
  ['page status', a => { a.pageInventory[0].screeningStatus = 'not_screened'; }],
  ['locator', a => { a.pageInventory.find(page => page.page === 11).candidateLocator = 'forged'; }],
  ['exclusion reason', a => { a.pageInventory.find(page => page.page === 18).exclusionReason = null; }],
  ['requested page scope', a => { a.source.requestedCorpusPageCount = 219; }],
  ['source row', a => { a.evidenceIndex.sourceRows[0].pages = [99]; }],
  ['direct source link', a => { a.inventory.find(star => star.starId === 'ziwei').sourcePages = []; }],
  ['formula', a => { a.comparison.tianfu.transform = 'identity'; }],
  ['dependency', a => { a.dependencyGraph.edges[0].from = 'fake'; }],
  ['transform count', a => { a.comparison.tianfu.transformed = '149/150'; }],
  ['readiness mutation', a => { a.decisionPacket.productionChoice = 'replace'; }]
]
for (const [name, mutate] of cases) test(`negative detects ${name}`, async () => { const candidate = structuredClone(await buildArtifact()); mutate(candidate); assert.notDeepEqual(await checkArtifact(candidate), []) })
