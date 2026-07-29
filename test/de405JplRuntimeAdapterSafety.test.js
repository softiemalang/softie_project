import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve('.')
const adapter = join(root, 'tools/de405-jpl-reader/run.mjs')
const officialBinary = join(root, 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405')

test('adapter fails when binary path does not exist', () => {
  const result = spawnSync(process.execPath, [adapter, '--binary', '/non/existent/path/binary'], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.ok(result.stderr.includes('FATAL: JPL binary not found'))
})

test('adapter fails when binary SHA-256 does not match expected', () => {
  const badHash = '0000000000000000000000000000000000000000000000000000000000000000'
  const result = spawnSync(process.execPath, [adapter, '--binary', officialBinary, '--expected-binary-sha256', badHash], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.ok(result.stderr.includes('FATAL: JPL binary SHA-256 mismatch'))
})

test('adapter adds runtimeAdapter metadata proving requested binary was opened', () => {
  const result = spawnSync(process.execPath, [adapter, '--metadata', '--binary', officialBinary], { encoding: 'utf8' })
  assert.equal(result.status, 0)
  const meta = JSON.parse(result.stdout)
  assert.ok(meta.runtimeAdapter)
  assert.equal(meta.runtimeAdapter.openedEphemerisPath, resolve(officialBinary))
  assert.equal(meta.runtimeAdapter.type, 'jpleph-path-adapter')
})

test('adapter handles spaces in binary path', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'jpl-test-space dir-'))
  const spaceBinary = join(tempDir, 'spaced binary.405')
  try {
    const fs = await import('node:fs/promises')
    await fs.copyFile(officialBinary, spaceBinary)

    const result = spawnSync(process.execPath, [adapter, '--metadata', '--binary', spaceBinary], { encoding: 'utf8' })
    assert.equal(result.status, 0)
    const meta = JSON.parse(result.stdout)
    assert.equal(meta.runtimeAdapter.openedEphemerisPath, resolve(spaceBinary))
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test('adapter runs concurrently without collision (same binary)', async () => {
  const run1 = new Promise((resolve) => {
    const child = spawn(process.execPath, [adapter, '--probe', '--binary', officialBinary])
    child.on('close', (code) => resolve(code))
  })
  
  const run2 = new Promise((resolve) => {
    const child = spawn(process.execPath, [adapter, '--probe', '--binary', officialBinary])
    child.on('close', (code) => resolve(code))
  })

  const [code1, code2] = await Promise.all([run1, run2])
  assert.equal(code1, 0)
  assert.equal(code2, 0)
})

test('adapter runs concurrently without collision (different binaries)', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'jpl-test-diff-bin-'))
  const binary2 = join(tempDir, 'binary2.405')
  try {
    const fs = await import('node:fs/promises')
    await fs.copyFile(officialBinary, binary2)

    const run1 = new Promise((resolve) => {
      const child = spawn(process.execPath, [adapter, '--probe', '--binary', officialBinary])
      child.on('close', (code) => resolve(code))
    })
    
    const run2 = new Promise((resolve) => {
      const child = spawn(process.execPath, [adapter, '--probe', '--binary', binary2])
      child.on('close', (code) => resolve(code))
    })

    const [code1, code2] = await Promise.all([run1, run2])
    assert.equal(code1, 0)
    assert.equal(code2, 0)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test('adapter protects existing JPLEPH file in working tree', async () => {
  const fs = await import('node:fs/promises')
  const workingTreeJpleph = join(root, 'JPLEPH')
  let existingContent = null
  let createdByTest = false
  
  try {
    existingContent = await fs.readFile(workingTreeJpleph, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(workingTreeJpleph, 'dummy content')
      createdByTest = true
      existingContent = 'dummy content'
    }
  }

  try {
    const result = spawnSync(process.execPath, [adapter, '--probe', '--binary', officialBinary], { encoding: 'utf8' })
    assert.equal(result.status, 0)
    
    const postContent = await fs.readFile(workingTreeJpleph, 'utf8')
    assert.equal(postContent, existingContent)
  } finally {
    if (createdByTest) {
      await fs.rm(workingTreeJpleph, { force: true })
    }
  }
})
