import test from 'node:test'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
test('source divergence audit and DE405 full-corpus equivalence bridge pass', () => {
  const divergence = execFileSync(process.execPath, ['scripts/check-de405-cspice-source-divergence.mjs'], { cwd: root, encoding: 'utf8' })
  const equivalence = execFileSync(process.execPath, ['scripts/check-de405-cspice-source-equivalence.mjs'], { cwd: root, encoding: 'utf8' })
  if (!divergence.includes('"divergenceCount": 7')) throw new Error('expected seven source divergences')
  if (!equivalence.includes('official_source_de405_runtime_equivalent_ready_for_remote_dispatch')) throw new Error('expected equivalent bridge classification')
})
