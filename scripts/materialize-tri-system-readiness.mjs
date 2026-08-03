import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const inventoryPath = resolve(root, 'artifacts/tri-system-readiness-v1/inventory.json')
const bytes = await readFile(inventoryPath)
const inventory = JSON.parse(bytes)
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (inventory.head !== head) {
  console.error(JSON.stringify({ pass: false, reason: 'head_mismatch', inventoryHead: inventory.head, head }, null, 2))
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
    head,
    artifactByteSha256: createHash('sha256').update(bytes).digest('hex'),
    systemOrder: inventory.systems.map(system => system.id),
    evidenceCount: inventory.evidence.length,
    gapCount: inventory.gaps.length,
  }, null, 2))
}
