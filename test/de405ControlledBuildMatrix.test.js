import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
test('controlled DE405 build matrix checker passes on materialized evidence', () => {
  const output = execFileSync(process.execPath, ['scripts/check-de405-controlled-build-matrix.mjs'], { cwd: root, encoding: 'utf8' })
  assert.match(output, /"status": "pass"/)
})
test('controlled DE405 triangle evidence checker passes on persisted provenance', () => {
  const output = execFileSync(process.execPath, ['scripts/check-de405-controlled-build-triangle.mjs'], { cwd: root, encoding: 'utf8' })
  assert.match(output, /"finalClassification": "blocked_linux_arm64_control_unavailable"/)
})
