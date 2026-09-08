import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  buildReverseDependencyIndex,
  classifyChangedFile,
  findTransitiveDependents,
  selectAffectedTests,
} from '../scripts/lib/diff-aware-test-selection.mjs'

function graph(modules) {
  return buildReverseDependencyIndex(modules)
}

const noStaticReferences = { references: new Map(), errors: [] }

test('reverse dependency closure selects the actual transitive test without filename pairing', async () => {
  const dependencyGraph = graph([
    { source: 'src/leaf.js', dependencies: [] },
    { source: 'src/feature.js', dependencies: [{ resolved: 'src/leaf.js' }] },
    { source: 'test/feature-contract.test.js', dependencies: [{ resolved: 'src/feature.js' }] },
    { source: 'test/unrelated.test.js', dependencies: [] },
  ])

  const selection = await selectAffectedTests({
    changedFiles: [{ path: 'src/leaf.js', status: 'M' }],
    allTestFiles: ['feature-contract.test.js', 'unrelated.test.js'],
    dependencyGraph,
    staticTestReferenceIndex: noStaticReferences,
  })

  assert.equal(selection.mode, 'affected')
  assert.deepEqual(selection.files, ['feature-contract.test.js'])
  assert.deepEqual([...findTransitiveDependents(['src/leaf.js'], dependencyGraph.reverseDependencies)].sort(), [
    'src/feature.js',
    'src/leaf.js',
    'test/feature-contract.test.js',
  ])
})

test('a changed test is selected directly and a shared test helper promotes full regression', async () => {
  const dependencyGraph = graph([
    { source: 'test/changed.test.js', dependencies: [] },
    { source: 'test/helpers/assertions.js', dependencies: [] },
  ])
  const direct = await selectAffectedTests({
    changedFiles: [{ path: 'test/changed.test.js', status: 'M' }],
    allTestFiles: ['changed.test.js'],
    dependencyGraph,
    staticTestReferenceIndex: noStaticReferences,
  })
  assert.equal(direct.mode, 'affected')
  assert.deepEqual(direct.files, ['changed.test.js'])

  const helper = await selectAffectedTests({
    changedFiles: [{ path: 'test/helpers/assertions.js', status: 'M' }],
    allTestFiles: ['changed.test.js'],
    dependencyGraph,
    staticTestReferenceIndex: noStaticReferences,
  })
  assert.equal(helper.mode, 'full')
  assert.equal(helper.reasons[0].code, 'shared_or_external_input')
})

test('source-local tests are explicit direct frontiers without entering the default profile', async () => {
  const sourceTest = 'src/scheduler/googleOAuthTokens.test.js'
  assert.equal(classifyChangedFile({ path: sourceTest, status: 'M' }).kind, 'test')

  const selection = await selectAffectedTests({
    changedFiles: [{ path: 'src/scheduler/googleOAuthTokens.js', status: 'M' }],
    allTestFiles: [],
    standaloneTestFiles: [sourceTest],
    dependencyGraph: graph([
      { source: 'src/scheduler/googleOAuthTokens.js', dependencies: [] },
      { source: sourceTest, dependencies: [{ resolved: 'src/scheduler/googleOAuthTokens.js' }] },
    ]),
    staticTestReferenceIndex: noStaticReferences,
  })

  assert.equal(selection.mode, 'affected')
  assert.deepEqual(selection.files, [sourceTest])
})

test('configuration, unsupported source text, and shared test infrastructure promote full regression', async () => {
  assert.equal(classifyChangedFile({ path: 'package.json', status: 'M' }).kind, 'full')
  assert.equal(classifyChangedFile({ path: 'src/styles.css', status: 'M' }).kind, 'full')

  const dependencyGraph = graph([
    { source: 'src/shared.js', dependencies: [] },
    { source: 'src/first.js', dependencies: [{ resolved: 'src/shared.js' }] },
    { source: 'src/second.js', dependencies: [{ resolved: 'src/shared.js' }] },
    { source: 'test/first.test.js', dependencies: [{ resolved: 'src/first.js' }] },
    { source: 'test/second.test.js', dependencies: [{ resolved: 'src/second.js' }] },
  ])
  const selection = await selectAffectedTests({
    changedFiles: [{ path: 'src/shared.js', status: 'M' }],
    allTestFiles: ['first.test.js', 'second.test.js'],
    dependencyGraph,
    staticTestReferenceIndex: noStaticReferences,
  })
  assert.equal(selection.mode, 'affected')
  assert.deepEqual(selection.files, ['first.test.js', 'second.test.js'])

  const infrastructure = await selectAffectedTests({
    changedFiles: [{ path: 'scripts/lib/shared.js', status: 'M' }],
    allTestFiles: ['first.test.js', 'second.test.js'],
    dependencyGraph: graph([
      { source: 'scripts/lib/shared.js', dependencies: [] },
      { source: 'test/first.test.js', dependencies: [{ resolved: 'scripts/lib/shared.js' }] },
      { source: 'test/second.test.js', dependencies: [{ resolved: 'scripts/lib/shared.js' }] },
    ]),
    staticTestReferenceIndex: noStaticReferences,
  })
  assert.equal(infrastructure.mode, 'full')
  assert.equal(infrastructure.reasons[0].code, 'shared_runtime_module')
})

test('a statically read source file is part of the affected frontier', async () => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'softie-diff-aware-selection-'))
  try {
    await mkdir(join(rootDirectory, 'test'), { recursive: true })
    await mkdir(join(rootDirectory, 'src'), { recursive: true })
    await writeFile(
      join(rootDirectory, 'test', 'text-contract.test.js'),
      "import { readFileSync } from 'node:fs'\nconst source = readFileSync(new URL('../src/Widget.js', import.meta.url), 'utf8')\n",
    )
    await writeFile(join(rootDirectory, 'src', 'Widget.js'), 'export const widget = true\n')

    const dependencyGraph = graph([
      { source: 'src/Widget.js', dependencies: [] },
      { source: 'test/text-contract.test.js', dependencies: [] },
    ])
    const selection = await selectAffectedTests({
      changedFiles: [{ path: 'src/Widget.js', status: 'M' }],
      allTestFiles: ['text-contract.test.js'],
      dependencyGraph,
      rootDirectory,
    })

    assert.equal(selection.mode, 'affected')
    assert.deepEqual(selection.files, ['text-contract.test.js'])
  } finally {
    await rm(rootDirectory, { recursive: true, force: true })
  }
})
