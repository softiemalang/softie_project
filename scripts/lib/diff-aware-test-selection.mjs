import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'

import { discoverAllTestFiles, SOURCE_LOCAL_TEST_FILES } from './test-suite-discovery.mjs'

const GRAPH_ROOTS = Object.freeze(['src/', 'scripts/', 'tools/', 'test/'])
const GRAPH_EXTENSIONS = Object.freeze(new Set(['.js', '.mjs', '.cjs']))
const TEST_PREFIX = 'test/'
const TEST_FILE_PATTERN = /^test\/.+\.test\.js$/
const SOURCE_LOCAL_TEST_FILE_SET = new Set(SOURCE_LOCAL_TEST_FILES)
const SOURCE_TEST_FILE_PATTERN = /^src\/.+\.test\.js$/
const SOURCE_TEXT_EXTENSIONS = Object.freeze(new Set(['.jsx', '.css']))

const FULL_REGRESSION_FILES = Object.freeze(new Set([
  '.dependency-cruiser.cjs',
  '.gitignore',
  'AGENTS.md',
  'DESIGN.md',
  'GOOGLE_INTEGRATION.md',
  'index.html',
  'knip.jsonc',
  'npm-shrinkwrap.json',
  'opencode.json',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'skills-lock.json',
  'vercel.json',
  'vite.config.js',
  'yarn.lock',
]))

const FULL_REGRESSION_PREFIXES = Object.freeze([
  '.agents/',
  '.codex/',
  '.env',
  '.github/',
  'artifacts/',
  'docs/',
  'public/',
  'references/',
  'schemas/',
  'supabase/',
  'test/fixtures/',
  'test/helpers/',
  'test/de405-artifacts/README',
])

const TEST_RUNNER_FILES = Object.freeze(new Set([
  'scripts/run-default-tests.mjs',
  'scripts/run-diff-aware-tests.mjs',
  'scripts/run-source-local-tests.mjs',
  'scripts/lib/diff-aware-test-selection.mjs',
  'scripts/lib/test-suite-discovery.mjs',
]))

const toPosix = value => value.split('\\').join('/')

export function normalizeRepoPath(value) {
  return toPosix(String(value)).replace(/^\.\//, '')
}

function isTestModulePath(path) {
  return TEST_FILE_PATTERN.test(path) || SOURCE_TEST_FILE_PATTERN.test(path)
}

function isGraphRootPath(path) {
  return GRAPH_ROOTS.some(prefix => path.startsWith(prefix))
}

function isGraphSourcePath(path) {
  return isGraphRootPath(path) && GRAPH_EXTENSIONS.has(extname(path))
}

function statusCode(status = 'M') {
  return String(status)[0] || 'M'
}

function fullReason(path, code, detail) {
  return { path, code, detail }
}

export function classifyChangedFile(change) {
  const path = normalizeRepoPath(typeof change === 'string' ? change : change.path)
  const code = statusCode(typeof change === 'string' ? 'M' : change.status)

  if (['D', 'R', 'C', 'T', 'U', 'X', 'B'].includes(code)) {
    return {
      kind: 'full',
      reason: fullReason(path, 'non_stable_path_identity', `git status ${code} changes the path identity`),
    }
  }

  if (FULL_REGRESSION_FILES.has(path)) {
    return { kind: 'full', reason: fullReason(path, 'repository_configuration', 'repository or package configuration changed') }
  }

  if (TEST_RUNNER_FILES.has(path)) {
    return { kind: 'full', reason: fullReason(path, 'test_infrastructure', 'test discovery or execution infrastructure changed') }
  }

  if (FULL_REGRESSION_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return { kind: 'full', reason: fullReason(path, 'shared_or_external_input', 'shared, generated, fixture, or external-input surface changed') }
  }

  if (path.startsWith(TEST_PREFIX)) {
    if (isTestModulePath(path)) return { kind: 'test', path }
    return { kind: 'full', reason: fullReason(path, 'test_support', 'a non-test file under test/ is shared test support') }
  }

  if (SOURCE_LOCAL_TEST_FILE_SET.has(path)) {
    return { kind: 'test', path }
  }

  if (path.startsWith('src/') && path.endsWith('.test.js')) {
    return { kind: 'full', reason: fullReason(path, 'undiscovered_test_surface', 'a test file is outside the repository test discovery root') }
  }

  if (isGraphRootPath(path)) {
    if (SOURCE_TEXT_EXTENSIONS.has(extname(path))) {
      return { kind: 'full', reason: fullReason(path, 'source_text_boundary', 'the current suite validates this source-text surface outside the module graph') }
    }
    if (!isGraphSourcePath(path)) {
      return { kind: 'full', reason: fullReason(path, 'unsupported_graph_source', 'the changed source type is outside the verified JavaScript graph') }
    }
    return { kind: 'module', path }
  }

  return { kind: 'full', reason: fullReason(path, 'outside_graph_scope', 'the impact is not represented by the local module graph') }
}

function parseNameStatus(output) {
  const tokens = output.split('\0')
  const files = []
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++]
    if (!status) continue
    const code = statusCode(status)
    const path = tokens[index++]
    if (!path) continue
    if (code === 'R' || code === 'C') {
      const nextPath = tokens[index++]
      files.push({ path: nextPath || path, previousPath: path, status })
    } else {
      files.push({ path, status })
    }
  }
  return files
}

export function collectChangedFiles({ cwd = process.cwd(), base = 'HEAD' } = {}) {
  try {
    const diff = execFileSync(
      'git',
      ['diff', '--name-status', '-z', '--find-renames=50%', base, '--'],
      { cwd, encoding: 'utf8' },
    )
    const untrackedOutput = execFileSync(
      'git',
      ['ls-files', '--others', '--exclude-standard', '-z'],
      { cwd, encoding: 'utf8' },
    )
    const files = parseNameStatus(diff)
    const known = new Set(files.map(file => normalizeRepoPath(file.path)))
    for (const path of untrackedOutput.split('\0').filter(Boolean)) {
      const normalized = normalizeRepoPath(path)
      if (!known.has(normalized)) files.push({ path: normalized, status: 'A' })
    }
    return { baselineAvailable: true, files, base }
  } catch (error) {
    return {
      baselineAvailable: false,
      files: [],
      base,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function normalizedModuleSource(source, rootDirectory) {
  const raw = toPosix(String(source))
  if (raw.startsWith('/')) return normalizeRepoPath(relative(rootDirectory, raw))
  return normalizeRepoPath(raw)
}

export function buildReverseDependencyIndex(modules, { rootDirectory = process.cwd() } = {}) {
  const normalizedModules = modules.map(module => ({
    ...module,
    source: normalizedModuleSource(module.source, rootDirectory),
  }))
  const modulePaths = new Set(normalizedModules.map(module => module.source))
  const reverseDependencies = new Map(normalizedModules.map(module => [module.source, new Set()]))
  const unresolved = []

  for (const module of normalizedModules) {
    for (const dependency of module.dependencies || []) {
      if (dependency.couldNotResolve) {
        unresolved.push({
          source: module.source,
          module: dependency.module,
        })
        continue
      }
      if (!dependency.resolved) continue
      const resolved = normalizedModuleSource(dependency.resolved, rootDirectory)
      if (modulePaths.has(resolved)) reverseDependencies.get(resolved).add(module.source)
    }
  }

  return {
    modules: normalizedModules,
    modulePaths,
    reverseDependencies,
    unresolved,
  }
}

export function findTransitiveDependents(seeds, reverseDependencies) {
  const reached = new Set(seeds)
  const queue = [...seeds]
  while (queue.length > 0) {
    const current = queue.shift()
    for (const dependent of reverseDependencies.get(current) || []) {
      if (reached.has(dependent)) continue
      reached.add(dependent)
      queue.push(dependent)
    }
  }
  return reached
}

function isSharedRuntimeModule(path) {
  return path.startsWith('scripts/lib/')
}

function normalizeTestPath(path) {
  const normalized = normalizeRepoPath(path)
  return normalized.startsWith(TEST_PREFIX) || SOURCE_TEST_FILE_PATTERN.test(normalized)
    ? normalized
    : `${TEST_PREFIX}${normalized}`
}

function relativeTestFile(path) {
  const normalized = normalizeTestPath(path)
  return normalized.startsWith(TEST_PREFIX) ? normalized.slice(TEST_PREFIX.length) : normalized
}

function testPathSet(allTestFiles, standaloneTestFiles = []) {
  return new Set([
    ...allTestFiles.map(normalizeTestPath),
    ...standaloneTestFiles.map(normalizeTestPath),
  ])
}

const PATH_LITERAL_PATTERN = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g

function unescapePath(value) {
  return value.replace(/\\(['"`\\])/g, '$1')
}

function localReferenceCandidates(testPath, literal, rootDirectory) {
  if (!literal || literal.includes('${')) return []
  const isRelative = literal.startsWith('.')
  const isRootRelative = /^(?:src|scripts|tools|test)\//.test(literal)
  if (!isRelative && !isRootRelative) return []

  const testAbsolutePath = resolve(rootDirectory, normalizeTestPath(testPath))
  const absolutePath = isRelative
    ? resolve(dirname(testAbsolutePath), literal)
    : resolve(rootDirectory, literal)
  const relativePath = normalizeRepoPath(relative(rootDirectory, absolutePath))
  const candidates = [relativePath]
  if (!extname(relativePath)) {
    for (const extension of GRAPH_EXTENSIONS) candidates.push(`${relativePath}${extension}`)
    for (const extension of GRAPH_EXTENSIONS) candidates.push(join(relativePath, `index${extension}`))
  }
  return candidates.map(normalizeRepoPath)
}

export async function buildStaticTestReferenceIndex(allTestFiles, { rootDirectory = process.cwd() } = {}) {
  const references = new Map()
  const errors = []
  for (const testFile of allTestFiles) {
    const normalizedTestFile = normalizeTestPath(testFile)
    let source
    try {
      source = await readFile(resolve(rootDirectory, normalizedTestFile), 'utf8')
    } catch (error) {
      errors.push({ testFile: normalizedTestFile, error: error instanceof Error ? error.message : String(error) })
      continue
    }
    for (const match of source.matchAll(PATH_LITERAL_PATTERN)) {
      const literal = unescapePath(match[1] ?? match[2] ?? match[3] ?? '')
      for (const candidate of localReferenceCandidates(normalizedTestFile, literal, rootDirectory)) {
        if (!references.has(candidate)) references.set(candidate, new Set())
        references.get(candidate).add(normalizedTestFile)
      }
    }
  }
  return { references, errors }
}

export async function buildDependencyGraph({ rootDirectory = process.cwd() } = {}) {
  const require = createRequire(import.meta.url)
  const config = require(resolve(rootDirectory, '.dependency-cruiser.cjs'))
  const { cruise } = await import('dependency-cruiser')
  const result = await cruise(
    GRAPH_ROOTS.map(root => resolve(rootDirectory, root.slice(0, -1))),
    config.options,
  )
  if (result.exitCode !== 0 || !result.output?.modules) {
    throw new Error(`dependency graph construction failed with exit code ${result.exitCode}`)
  }
  const graph = buildReverseDependencyIndex(result.output.modules, { rootDirectory })
  if (graph.unresolved.length > 0) {
    throw new Error(`dependency graph contains ${graph.unresolved.length} unresolved local dependencies`)
  }
  return graph
}

function fullSelection(allTestFiles, reasons, changedFiles) {
  return {
    mode: 'full',
    files: allTestFiles,
    changedFiles,
    impactedModules: [],
    reasons,
  }
}

export async function selectAffectedTests({
  changedFiles,
  allTestFiles,
  fullTestFiles,
  dependencyGraph,
  staticTestReferenceIndex,
  standaloneTestFiles = [],
  rootDirectory = process.cwd(),
} = {}) {
  const files = allTestFiles || await discoverAllTestFiles()
  const selectableTestFiles = [...files, ...standaloneTestFiles]
  const regressionFiles = fullTestFiles || files
  const changes = (changedFiles || []).map(change => typeof change === 'string' ? { path: change, status: 'M' } : change)
  if (changes.length === 0) {
    return {
      mode: 'no_changes',
      files: [],
      changedFiles: [],
      impactedModules: [],
      reasons: [],
    }
  }

  let graph
  try {
    graph = dependencyGraph?.reverseDependencies
      ? dependencyGraph
      : buildReverseDependencyIndex(dependencyGraph?.modules || [], { rootDirectory })
  } catch (error) {
    return fullSelection(regressionFiles, [fullReason(null, 'dependency_graph_unavailable', error instanceof Error ? error.message : String(error))], changes)
  }
  if (!graph.modulePaths || graph.unresolved?.length > 0) {
    return fullSelection(regressionFiles, [fullReason(null, 'dependency_graph_unresolved', 'the local dependency graph is not complete')], changes)
  }

  const reasons = []
  const seeds = []
  const changedTestPaths = new Set()
  for (const change of changes) {
    const classified = classifyChangedFile(change)
    if (classified.kind === 'full') {
      reasons.push(classified.reason)
    } else if (classified.kind === 'test') {
      changedTestPaths.add(classified.path)
    } else if (classified.kind === 'module') {
      if (!graph.modulePaths.has(classified.path)) {
        reasons.push(fullReason(classified.path, 'changed_module_not_in_graph', 'the changed module was not present in the current graph'))
      } else if (isSharedRuntimeModule(classified.path)) {
        reasons.push(fullReason(classified.path, 'shared_runtime_module', 'shared test infrastructure is treated as a full-regression boundary'))
      } else {
        seeds.push(classified.path)
      }
    }
  }
  if (reasons.length > 0) return fullSelection(regressionFiles, reasons, changes)

  const discoveredTestPaths = testPathSet(files, standaloneTestFiles)
  const impactedModules = findTransitiveDependents([...seeds, ...changedTestPaths], graph.reverseDependencies)
  const selected = new Set()
  for (const path of impactedModules) {
    if (discoveredTestPaths.has(path)) selected.add(relativeTestFile(path))
  }
  for (const path of changedTestPaths) {
    if (discoveredTestPaths.has(path)) selected.add(relativeTestFile(path))
  }

  const staticReferences = staticTestReferenceIndex || await buildStaticTestReferenceIndex(selectableTestFiles, { rootDirectory })
  if (staticReferences.errors.length > 0) {
    return fullSelection(regressionFiles, [fullReason(null, 'test_reference_index_unavailable', 'a test file could not be read while checking source-text references')], changes)
  }
  for (const seed of seeds) {
    for (const testPath of staticReferences.references.get(seed) || []) {
      if (discoveredTestPaths.has(testPath)) selected.add(relativeTestFile(testPath))
    }
  }

  const uncoveredSeeds = seeds.filter(seed => {
    const hasGraphTest = [...impactedModules].some(path => path === seed || (isTestModulePath(path) && selected.has(relativeTestFile(path))))
    const hasStaticTest = (staticReferences.references.get(seed) || []).size > 0
    return !hasGraphTest && !hasStaticTest
  })
  if (uncoveredSeeds.length > 0) {
    return fullSelection(
      regressionFiles,
      uncoveredSeeds.map(seed => fullReason(seed, 'no_safe_test_frontier', 'no test is reachable through the current graph or static source references')),
      changes,
    )
  }

  return {
    mode: 'affected',
    files: [...selected].sort((a, b) => a.localeCompare(b)),
    changedFiles: changes,
    impactedModules: [...impactedModules].sort((a, b) => a.localeCompare(b)),
    reasons: [],
  }
}
