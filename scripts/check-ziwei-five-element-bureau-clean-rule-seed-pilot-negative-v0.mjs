import { readFile } from 'node:fs/promises'
import { buildPilotArtifact } from './materialize-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs'
import { checkPilotArtifact } from './check-ziwei-five-element-bureau-clean-rule-seed-pilot-v0.mjs'
const setPath = (object, path, value) => { const parts = path.split('.'); const key = parts.pop(); let target = object; for (const part of parts) target = target[part]; target[key] = value }
const fixture = JSON.parse(await readFile('test/fixtures/ziwei/five-element-bureau-clean-rule-seed-pilot-negative-v0.json', 'utf8')); const findings = []
for (const item of fixture.cases) { const artifact = structuredClone(await buildPilotArtifact()); if (item.truncate) artifact.comparison.rows = artifact.comparison.rows.slice(0, item.truncate); else if (item.swapFirstTwo) [artifact.comparison.rows[0], artifact.comparison.rows[1]] = [artifact.comparison.rows[1], artifact.comparison.rows[0]]; else setPath(artifact, item.path, item.value); const errors = await checkPilotArtifact(artifact); if (!errors.includes(item.finding)) findings.push({ id: item.id, expected: item.finding, errors }) }
console.log(JSON.stringify({ pass: findings.length === 0, findings }, null, 2)); if (findings.length) process.exitCode = 1
