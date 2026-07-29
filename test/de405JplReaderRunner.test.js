import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const fakeRunner = resolve('test/helpers/fake-de405-jpl-reader.mjs')

test('fake runner responds to --version with JSON metadata', () => {
  const run = spawnSync(process.execPath, [fakeRunner, '--version'], { encoding: 'utf8' })
  assert.equal(run.status, 0)
  const meta = JSON.parse(run.stdout)
  assert.equal(meta.runnerVersion, 'de405-jpl-canonical-v2-runner')
  assert.equal(meta.jplReaderVersion, 'testeph.f')
})

test('fake runner responds to --metadata with contract constants', () => {
  const run = spawnSync(process.execPath, [fakeRunner, '--metadata'], { encoding: 'utf8' })
  assert.equal(run.status, 0)
  const meta = JSON.parse(run.stdout)
  assert.equal(meta.KSIZE, 2036)
  assert.equal(meta.NRECL, 4)
  assert.equal(meta.KM, true)
  assert.equal(meta.observerId, 399)
})

test('fake runner responds to --probe with 10 target states', () => {
  const run = spawnSync(process.execPath, [fakeRunner, '--probe'], { encoding: 'utf8' })
  assert.equal(run.status, 0)
  const probe = JSON.parse(run.stdout)
  assert.equal(probe.length, 10)
  assert.equal(probe[0].targetId, 1)
  assert.equal(probe[9].targetId, 301)
})
