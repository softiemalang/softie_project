import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const inventoryPath = resolve(root, 'artifacts/tri-system-readiness-v1/inventory.json')
const assessmentPath = resolve(root, 'docs/tri-system-readiness-assessment-v1.md')
const allowed = new Set(['verified', 'implemented_unverified', 'partial', 'experimental', 'stub_or_simulation', 'documented_only', 'absent', 'blocked'])
const fail = (errors, code) => errors.push(code)
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const assessment = await readFile(assessmentPath, 'utf8')
const errors = []
if (inventory.schemaVersion !== 'tri-system-readiness-inventory-v1') fail(errors, 'inventory_schema')
if (inventory.inventoryVersion !== '1.0.0') fail(errors, 'inventory_version')
if (!inventory.materializerPath || !existsSync(resolve(root, inventory.materializerPath))) fail(errors, 'materializer_missing')
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (inventory.head !== head) fail(errors, 'head_mismatch')
if (!assessment.includes('verdict=' + inventory.verdictToken) || !assessment.includes('head=' + inventory.head)) fail(errors, 'assessment_marker_mismatch')
if (!assessment.includes('deterministic materializer') || !assessment.includes('materialize-tri-system-readiness.mjs')) fail(errors, 'materializer_not_documented')
const evidenceIds = new Set()
for (const evidence of inventory.evidence || []) {
  if (evidenceIds.has(evidence.id)) fail(errors, 'duplicate_evidence:' + evidence.id)
  evidenceIds.add(evidence.id)
  for (const field of ['path', 'testPath', 'artifactPath', 'checkerPath']) {
    if (evidence[field] && !existsSync(resolve(root, evidence[field]))) fail(errors, 'missing_' + field + ':' + evidence.id)
  }
  if (evidence.export) {
    const source = await readFile(resolve(root, evidence.path), 'utf8')
    if (!new RegExp('export\\s+(?:const|function|class)\\s+' + evidence.export + '\\b').test(source)) fail(errors, 'export_missing:' + evidence.id)
  }
  if (evidence.artifactPath && evidence.artifactPath.endsWith('.json')) {
    try { JSON.parse(await readFile(resolve(root, evidence.artifactPath), 'utf8')) } catch { fail(errors, 'artifact_not_json:' + evidence.id) }
  }
}
for (const system of inventory.systems || []) {
  if (!allowed.has(system.overallStatus) || !allowed.has(system.activation)) fail(errors, 'system_status:' + system.id)
  for (const [layer, status] of Object.entries(system.layers || {})) if (!allowed.has(status)) fail(errors, 'layer_status:' + system.id + ':' + layer)
  for (const id of system.evidenceIds || []) if (!evidenceIds.has(id)) fail(errors, 'evidence_link:' + system.id + ':' + id)
}
for (const gap of inventory.gaps || []) if (!allowed.has(gap.status)) fail(errors, 'gap_status:' + gap.id)
if (inventory.envelopeDecision?.status !== 'blocked') fail(errors, 'envelope_not_blocked')
if (inventory.systems.some(system => system.id === 'astrology' && system.activation !== 'blocked')) fail(errors, 'astrology_activation_promoted')
const result = { pass: errors.length === 0, head, verdictToken: inventory.verdictToken, systemStatuses: Object.fromEntries(inventory.systems.map(system => [system.id, { overallStatus: system.overallStatus, activation: system.activation }])), gapCount: inventory.gaps.length, errors: [...new Set(errors)].sort() }
console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exitCode = 1
