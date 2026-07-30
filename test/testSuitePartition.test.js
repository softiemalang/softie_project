import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverArtifactTestFiles, discoverDefaultTestFiles } from '../scripts/lib/test-suite-discovery.mjs'

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'de405-test-discovery-'))
  await mkdir(join(root, 'nested'), { recursive: true })
  await mkdir(join(root, 'de405-artifacts'), { recursive: true })
  await writeFile(join(root, 'z.test.js'), '')
  await writeFile(join(root, 'nested', 'a.test.js'), '')
  await writeFile(join(root, 'nested', 'helper.js'), '')
  await writeFile(join(root, 'de405-artifacts', 'artifact.test.js'), '')
  return root
}

test('default discovery recursively includes ordinary tests and excludes artifact tests', async () => {
  const root = await fixture()
  assert.deepEqual(await discoverDefaultTestFiles({ rootDirectory: root }), ['nested/a.test.js', 'z.test.js'])
})

test('artifact discovery includes only artifact tests', async () => {
  const root = await fixture()
  assert.deepEqual(await discoverArtifactTestFiles({ rootDirectory: root }), ['de405-artifacts/artifact.test.js'])
})

test('repository suites are sorted, disjoint, and complete', async () => {
  const defaultFiles = await discoverDefaultTestFiles()
  const artifactFiles = await discoverArtifactTestFiles()
  const allFiles = [...defaultFiles, ...artifactFiles]
  const repositoryFiles = (await readdir('test', { recursive: true }))
    .filter(file => file.endsWith('.test.js'))
  assert.deepEqual(defaultFiles, defaultFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(artifactFiles, artifactFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.equal(new Set(allFiles).size, allFiles.length)
  assert.deepEqual(allFiles.slice().sort((a, b) => a.localeCompare(b)), repositoryFiles.map(file => `test/${file}`).sort((a, b) => a.localeCompare(b)).map(file => file.replace(/^test\//, '')))
})

test('repository default discovery excludes every artifact path', async () => {
  const files = await discoverDefaultTestFiles()
  assert.equal(files.some(file => file.startsWith('de405-artifacts/')), false)
})

test('DE405 inventory excludes OS metadata and preserves the 10 generated plus 3 pending contract', async () => {
  const inventory = JSON.parse(await readFile('docs/de405-artifact-inventory.json', 'utf8'))
  assert.equal(inventory.artifacts.some(artifact => artifact.path.endsWith('.DS_Store')), false)
  assert.equal(inventory.summary.fileCount, 13)
  assert.equal(inventory.summary.byStorageClass.generated.fileCount, 10)
  assert.equal(inventory.summary.byStorageClass.pending.fileCount, 3)
})
