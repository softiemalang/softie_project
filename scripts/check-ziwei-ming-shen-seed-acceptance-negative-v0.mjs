import { readFile } from 'node:fs/promises'
import { buildAcceptanceArtifact } from './materialize-ziwei-ming-shen-seed-acceptance-v0.mjs'
import { checkAcceptanceArtifact } from './check-ziwei-ming-shen-seed-acceptance-v0.mjs'
const setPath = (object, path, value) => { const parts = path.split('.'); const key = parts.pop(); let target = object; for (const part of parts) target = target[part]; target[key] = value }
const fixture = JSON.parse(await readFile('test/fixtures/ziwei/ziwei-ming-shen-seed-acceptance-v0-negative-v0.json', 'utf8')); const findings = []
for (const item of fixture.cases) { const { artifact } = await buildAcceptanceArtifact(); const candidate = structuredClone(artifact); if (item.swapFirstTwo) [candidate.comparison.rows[0], candidate.comparison.rows[1]] = [candidate.comparison.rows[1], candidate.comparison.rows[0]]; else setPath(candidate, item.path, item.value); const errors = await checkAcceptanceArtifact(candidate); if (!errors.includes(item.finding)) findings.push({ id: item.id, expected: item.finding, errors }) }
console.log(JSON.stringify({ pass: findings.length === 0, findings }, null, 2)); if (findings.length) process.exitCode = 1
