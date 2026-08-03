import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'

const root = resolve(new URL('..', import.meta.url).pathname)
const inventoryPath = resolve(root, 'artifacts/tri-system-readiness-v1/inventory.json')
const bytes = await readFile(inventoryPath)
const inventory = JSON.parse(bytes)
const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const identityErrors = checkArtifactIdentity(inventory, { root, artifactId: 'tri-system-readiness-v1', materializerPath: 'scripts/materialize-tri-system-readiness.mjs', materializerVersion: '1.1.0' })
if (identityErrors.length) {
  console.error(JSON.stringify({ pass: false, reason: 'identity_contract_failure', errors: identityErrors, generationBaseHead: inventory.artifactIdentity?.generation?.baseHead, currentHead: head }, null, 2))
  process.exitCode = 1
} else {
  if (process.argv.includes('--emit-inventory')) {
    process.stdout.write(bytes)
    process.exit(0)
  }
  console.log(JSON.stringify({
    pass: true,
    schemaVersion: inventory.schemaVersion,
    inventoryVersion: inventory.inventoryVersion,
    generationBaseHead: inventory.artifactIdentity.generation.baseHead,
    currentHead: head,
    artifactByteSha256: createHash('sha256').update(bytes).digest('hex'),
    systemOrder: inventory.systems.map(system => system.id),
    evidenceCount: inventory.evidence.length,
    gapCount: inventory.gaps.length,
  }, null, 2))
}
