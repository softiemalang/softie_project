import { readFile } from 'node:fs/promises'
import { buildAcceptanceArtifact } from './materialize-ziwei-five-element-bureau-clean-rule-seed-acceptance-v0.mjs'
import { checkAcceptanceArtifact } from './check-ziwei-five-element-bureau-clean-rule-seed-acceptance-v0.mjs'

const fixture = JSON.parse(await readFile('test/fixtures/ziwei/ziwei-five-element-bureau-clean-rule-seed-acceptance-v0-negative-v0.json', 'utf8'))
const setPath = (object, path, value) => { const keys = path.split('.'); const last = keys.pop(); let cursor = object; for (const key of keys) cursor = cursor[key]; cursor[last] = value }
const results = []
for (const item of fixture.cases) {
  const { artifact } = await buildAcceptanceArtifact(); const candidate = structuredClone(artifact)
  if (item.swapFirstTwo) [candidate.comparison.rows[0], candidate.comparison.rows[1]] = [candidate.comparison.rows[1], candidate.comparison.rows[0]]
  if (item.truncate) candidate.comparison.rows = candidate.comparison.rows.slice(0, item.truncate)
  if (item.semanticDiscrepancy) candidate.discrepancies.items[0].classification = 'rule-semantic discrepancy'
  if (item.path) setPath(candidate, item.path, item.value)
  const failures = await checkAcceptanceArtifact(candidate); results.push({ id: item.id, detected: failures.includes(item.finding), failures })
}
const undetected = results.filter(result => !result.detected)
console.log(JSON.stringify({ pass: undetected.length === 0, cases: results.length, undetected }, null, 2))
if (undetected.length) process.exitCode = 1
