import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  HISTORICAL_TEST_FILES,
  SAJU_HISTORICAL_TEST_FILES,
  SOURCE_TEST_FILES,
  ZIWEI_P0_HISTORICAL_TEST_FILES,
  discoverAllTestFiles,
  discoverArtifactTestFiles,
  discoverDefaultTestFiles,
  discoverHistoricalTestFiles,
  discoverSourceTestFiles,
  discoverTestSuites,
} from '../scripts/lib/test-suite-discovery.mjs'

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

test('source discovery includes the explicit source-bound test set', async () => {
  const sourceFiles = await discoverSourceTestFiles()
  assert.deepEqual(sourceFiles, SOURCE_TEST_FILES.slice().sort((a, b) => a.localeCompare(b)))
  assert.equal(sourceFiles.includes('sajuFiveClassicsClaimProvenanceClosure.test.js'), true)
})

test('repository suites are sorted, disjoint, and complete', async () => {
  const suites = await discoverTestSuites()
  const { default: defaultFiles, source: sourceFiles, historical: historicalFiles, artifact: artifactFiles } = suites
  const allFiles = await discoverAllTestFiles()
  const repositoryFiles = (await readdir('test', { recursive: true }))
    .filter(file => file.endsWith('.test.js'))
  assert.deepEqual(defaultFiles, defaultFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(sourceFiles, sourceFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(historicalFiles, historicalFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(artifactFiles, artifactFiles.slice().sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(suites.all, allFiles)
  assert.deepEqual(await discoverSourceTestFiles(), sourceFiles)
  assert.deepEqual(await discoverHistoricalTestFiles(), historicalFiles)
  assert.deepEqual(historicalFiles, HISTORICAL_TEST_FILES.slice().sort((a, b) => a.localeCompare(b)))
  assert.ok(SAJU_HISTORICAL_TEST_FILES.every(file => historicalFiles.includes(file)))
  assert.ok(SAJU_HISTORICAL_TEST_FILES.every(file => !defaultFiles.includes(file)))
  assert.deepEqual(sourceFiles, SOURCE_TEST_FILES.slice().sort((a, b) => a.localeCompare(b)))
  assert.equal(sourceFiles.includes('sajuFiveClassicsSourceIdentityFrontier.test.js'), true)
  assert.equal(sourceFiles.includes('sajuLocalSourceCorpusObservation.test.js'), true)
  assert.equal(historicalFiles.includes('sajuFiveClassicsSourceIdentityFrontierHistorical.test.js'), true)
  assert.equal(defaultFiles.includes('sajuFiveClassicsSourceIdentityFrontier.test.js'), false)
  assert.equal(defaultFiles.includes('sajuLocalSourceCorpusObservation.test.js'), false)
  assert.equal(defaultFiles.includes('sajuFiveClassicsSourceIdentityFrontierHistorical.test.js'), false)
  assert.equal(defaultFiles.includes('sajuFiveClassicsClaimProvenanceClosure.test.js'), false)
  assert.equal(defaultFiles.includes('sajuFiveClassicsClaimProvenanceClosureHistorical.test.js'), false)
  assert.equal(historicalFiles.includes('sajuFiveClassicsClaimProvenanceClosureHistorical.test.js'), true)
  assert.equal(defaultFiles.includes('pdfSourceResolver.test.js'), true)
  assert.equal(new Set(allFiles).size, allFiles.length)
  assert.deepEqual(allFiles, [...defaultFiles, ...sourceFiles, ...historicalFiles, ...artifactFiles].sort((a, b) => a.localeCompare(b)))
  assert.deepEqual(suites.entries, allFiles.map(file => ({
    file,
    profile: sourceFiles.includes(file)
      ? 'source'
      : historicalFiles.includes(file)
        ? 'historical'
        : artifactFiles.includes(file)
          ? 'artifact'
          : 'default',
  })))
  assert.deepEqual(allFiles, repositoryFiles.map(file => `test/${file}`).sort((a, b) => a.localeCompare(b)).map(file => file.replace(/^test\//, '')))
})

test('repository default discovery excludes reserved historical and artifact paths', async () => {
  const files = await discoverDefaultTestFiles()
  assert.equal(files.some(file => file.startsWith('de405-artifacts/')), false)
  assert.equal(files.some(file => SOURCE_TEST_FILES.includes(file)), false)
  assert.equal(files.some(file => ZIWEI_P0_HISTORICAL_TEST_FILES.includes(file)), false)
  assert.equal(files.some(file => HISTORICAL_TEST_FILES.includes(file)), false)
})

test('DE405 inventory excludes OS metadata and keeps summary counts synchronized with artifact entries', async () => {
  const inventory = JSON.parse(await readFile('docs/de405-artifact-inventory.json', 'utf8'))
  assert.equal(inventory.artifacts.some(artifact => artifact.path.endsWith('.DS_Store')), false)
  const fileCount = inventory.artifacts.length
  const generatedCount = inventory.artifacts.filter(artifact => artifact.storageClass === 'generated').length
  const pendingCount = inventory.artifacts.filter(artifact => artifact.storageClass === 'pending').length
  assert.equal(inventory.summary.fileCount, fileCount)
  assert.equal(inventory.summary.byStorageClass.generated.fileCount, generatedCount)
  assert.equal(inventory.summary.byStorageClass.pending.fileCount, pendingCount)
  assert.equal(generatedCount + pendingCount, fileCount)
})
