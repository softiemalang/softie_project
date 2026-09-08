#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

import {
  discoverAllTestFiles,
  discoverDefaultTestFiles,
  SOURCE_LOCAL_TEST_FILES,
} from './lib/test-suite-discovery.mjs'
import {
  buildDependencyGraph,
  collectChangedFiles,
  selectAffectedTests,
} from './lib/diff-aware-test-selection.mjs'

const args = process.argv.slice(2)
let base = 'HEAD'
let listOnly = false
let forceFull = false

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index]
  if (argument === '--list') {
    listOnly = true
  } else if (argument === '--full') {
    forceFull = true
  } else if (argument === '--base') {
    base = args[++index]
    if (!base) throw new Error('--base requires a git revision')
  } else if (argument.startsWith('--base=')) {
    base = argument.slice('--base='.length)
    if (!base) throw new Error('--base requires a git revision')
  } else {
    throw new Error(`unknown option: ${argument}`)
  }
}

const allTestFiles = await discoverAllTestFiles()
const repositoryTestFiles = [...allTestFiles, ...SOURCE_LOCAL_TEST_FILES]
const defaultTestFiles = await discoverDefaultTestFiles()
const changed = collectChangedFiles({ base })
let selection

if (forceFull) {
  selection = {
    mode: 'full',
    files: defaultTestFiles,
    changedFiles: changed.files,
    impactedModules: [],
    reasons: [{ path: null, code: 'explicit_full', detail: 'full default regression was requested' }],
  }
} else if (!changed.baselineAvailable) {
  selection = {
    mode: 'full',
    files: defaultTestFiles,
    changedFiles: changed.files,
    impactedModules: [],
    reasons: [{ path: null, code: 'git_baseline_unavailable', detail: changed.error || 'git baseline could not be read' }],
  }
} else if (changed.files.length === 0) {
  selection = {
    mode: 'no_changes',
    files: [],
    changedFiles: [],
    impactedModules: [],
    reasons: [],
  }
} else {
  let dependencyGraph
  try {
    dependencyGraph = await buildDependencyGraph()
  } catch (error) {
    selection = {
      mode: 'full',
      files: defaultTestFiles,
      changedFiles: changed.files,
      impactedModules: [],
      reasons: [{ path: null, code: 'dependency_graph_unavailable', detail: error instanceof Error ? error.message : String(error) }],
    }
  }
  if (!selection) {
    selection = await selectAffectedTests({
      changedFiles: changed.files,
      allTestFiles,
      fullTestFiles: defaultTestFiles,
      standaloneTestFiles: SOURCE_LOCAL_TEST_FILES,
      dependencyGraph,
    })
  }
}

const selectedLabel = selection.mode === 'full'
  ? `${selection.files.length}/${defaultTestFiles.length} default tests (full regression)`
  : `${selection.files.length}/${repositoryTestFiles.length} repository tests`
console.error(`[diff-aware] mode=${selection.mode} base=${base} changed=${selection.changedFiles.length} selected=${selectedLabel}`)
for (const reason of selection.reasons) {
  const path = reason.path ? ` path=${reason.path}` : ''
  console.error(`[diff-aware] full-regression reason=${reason.code}${path} detail=${reason.detail}`)
}

if (listOnly) {
  process.stdout.write(selection.files.map(file => file.startsWith('test/') || file.startsWith('src/') ? file : `test/${file}`).join('\n'))
  if (selection.files.length > 0) process.stdout.write('\n')
  process.exit(0)
}

if (selection.files.length === 0) {
  process.exit(0)
}

const run = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', ...selection.files.map(file => file.startsWith('test/') || file.startsWith('src/') ? file : `test/${file}`)],
  { stdio: 'inherit' },
)
process.exitCode = run.status ?? 1
