import { execFileSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, isAbsolute, relative, resolve } from 'node:path'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const REGISTRY_RELATIVE_PATH = 'docs/ui-system.json'
const UI_FILE_PATTERN = /\.(?:css|jsx|tsx)$/u
const COLOR_LITERAL_PATTERN = /#(?:[0-9a-f]{3,8})\b|\b(?:rgb|rgba|hsl|hsla)\(/iu
const DIMENSION_PATTERN = /\b(?:margin|padding|gap|inset|top|right|bottom|left|width|height|min-height|max-width|min-width|font-size|line-height|border-radius|box-shadow|transition-duration|animation-duration)\s*:\s*(?!var\()[^;{}]*(?:px|rem|em|vh|vw|dvh|svh|%)\b/iu
const INLINE_STYLE_PATTERN = /\bstyle\s*=\s*(?:\{\{|["'])/u

function relativePath(path) {
  const absolutePath = resolve(ROOT, path)
  const result = relative(ROOT, absolutePath)
  if (!result || result.startsWith('..') || isAbsolute(result)) {
    throw new Error(`path_outside_repository:${path}`)
  }
  return result
}

async function fileExists(relativeFile, root = ROOT) {
  try {
    await access(resolve(root, relativeFile))
    return true
  } catch {
    return false
  }
}

function addFinding(findings, code, path, detail) {
  findings.push({ code, path, detail })
}

function validateUnique(findings, items, key, label) {
  const seen = new Set()
  for (const item of items) {
    const value = item?.[key]
    if (!value) {
      addFinding(findings, `${label}_missing_${key}`, '', `${label} is missing ${key}`)
      continue
    }
    if (seen.has(value)) addFinding(findings, `${label}_duplicate_${key}`, value, `${label} has duplicate ${key}`)
    seen.add(value)
  }
}

async function loadRegistry(root = ROOT) {
  const bytes = await readFile(resolve(root, REGISTRY_RELATIVE_PATH), 'utf8')
  return JSON.parse(bytes)
}

export async function checkUiSystem(root = ROOT) {
  const findings = []
  let registry
  try {
    registry = await loadRegistry(root)
  } catch (error) {
    return { pass: false, findings: [{ code: 'registry_unreadable', path: REGISTRY_RELATIVE_PATH, detail: error.message }] }
  }

  if (registry.schemaVersion !== 'softie-ui-system-v1') {
    addFinding(findings, 'schema_version', REGISTRY_RELATIVE_PATH, 'Unexpected UI system schema version')
  }

  const authorityPaths = [
    registry.authority?.designLanguage,
    registry.authority?.runtimeTokensAndSharedCssApi,
    registry.authority?.workflow,
    registry.authority?.registry,
  ]
  for (const path of authorityPaths) {
    if (!path || !(await fileExists(path, root))) addFinding(findings, 'authority_path_missing', path || '', 'Authority path does not exist')
  }

  const cssSourcePath = registry.authority?.runtimeTokensAndSharedCssApi
  let cssSource = ''
  if (cssSourcePath && await fileExists(cssSourcePath, root)) cssSource = await readFile(resolve(root, cssSourcePath), 'utf8')

  const tokens = Array.isArray(registry.tokens) ? registry.tokens : []
  const patterns = Array.isArray(registry.patterns) ? registry.patterns : []
  const references = Array.isArray(registry.references) ? registry.references : []
  const legacy = Array.isArray(registry.legacyPreserveOnly) ? registry.legacyPreserveOnly : []

  validateUnique(findings, tokens, 'id', 'token')
  validateUnique(findings, tokens, 'cssVar', 'token')
  validateUnique(findings, patterns, 'id', 'pattern')
  validateUnique(findings, references, 'id', 'reference')

  for (const token of tokens) {
    if (!/^--[a-z0-9-]+$/u.test(token?.cssVar || '')) {
      addFinding(findings, 'token_name_invalid', token?.id || '', 'Token must point to a CSS custom property')
    } else if (!cssSource.includes(token.cssVar)) {
      addFinding(findings, 'token_not_in_runtime_source', token.cssVar, cssSourcePath || '')
    }
  }

  for (const pattern of patterns) {
    if (!pattern?.source || !(await fileExists(pattern.source, root))) {
      addFinding(findings, 'pattern_source_missing', pattern?.id || '', pattern?.source || '')
      continue
    }
    const source = await readFile(resolve(root, pattern.source), 'utf8')
    for (const selector of pattern.selectors || []) {
      if (!source.includes(selector)) addFinding(findings, 'pattern_selector_not_in_source', pattern.id, `${pattern.source}:${selector}`)
    }
  }

  for (const reference of references) {
    for (const pathKey of ['implementation', 'style']) {
      const path = reference?.[pathKey]
      if (!path || !(await fileExists(path, root))) addFinding(findings, 'reference_path_missing', reference?.id || '', `${pathKey}:${path || ''}`)
    }
  }

  for (const item of legacy) {
    if (!item?.source || !(await fileExists(item.source, root))) {
      addFinding(findings, 'legacy_source_missing', item?.selector || '', item?.source || '')
      continue
    }
    const source = await readFile(resolve(root, item.source), 'utf8')
    if (!source.includes(item.selector)) addFinding(findings, 'legacy_selector_not_in_source', item.selector, item.source)
  }

  if (registry.adoption?.legacyAutoRestyle !== false) addFinding(findings, 'legacy_policy_missing', '', 'Legacy auto-restyle must remain disabled')
  if (registry.adoption?.batchTokenRewrite !== false) addFinding(findings, 'batch_rewrite_policy_missing', '', 'Batch token rewrite must remain disabled')

  return {
    pass: findings.length === 0,
    schemaVersion: registry.schemaVersion,
    registryPath: REGISTRY_RELATIVE_PATH,
    tokenCount: tokens.length,
    patternCount: patterns.length,
    referenceCount: references.length,
    legacyPreserveOnlyCount: legacy.length,
    findings,
  }
}

export function scanUiSource(source, path) {
  const findings = []
  const normalizedPath = path.replaceAll('\\', '/')
  if (!UI_FILE_PATTERN.test(normalizedPath) || normalizedPath === 'src/styles.css') return findings

  const extension = extname(normalizedPath)
  source.split('\n').forEach((line, index) => {
    const lineNumber = index + 1
    if (line.includes('ui-system:allow-literal')) return

    if (COLOR_LITERAL_PATTERN.test(line)) {
      addFinding(findings, 'new_raw_color_literal', `${normalizedPath}:${lineNumber}`, 'Use an existing semantic token or document a narrowly scoped exception')
    }

    if (extension === '.css' && DIMENSION_PATTERN.test(line)) {
      addFinding(findings, 'new_raw_dimension', `${normalizedPath}:${lineNumber}`, 'Use an existing token or keep the value feature-local with an explicit exception')
    }

    if ((extension === '.jsx' || extension === '.tsx') && INLINE_STYLE_PATTERN.test(line)) {
      addFinding(findings, 'new_inline_visual_style', `${normalizedPath}:${lineNumber}`, 'Use a feature class and the shared CSS API for new visual rules')
    }
  })

  return findings
}

function changedUiFiles() {
  const output = execFileSync('git', ['-c', 'core.fsmonitor=false', 'diff', '--name-only', '--diff-filter=ACMRT', '--', 'src'], { cwd: ROOT, encoding: 'utf8' })
  const untracked = execFileSync('git', ['-c', 'core.fsmonitor=false', 'ls-files', '--others', '--exclude-standard', '--', 'src'], { cwd: ROOT, encoding: 'utf8' })
  return [...new Set(`${output}\n${untracked}`.split('\n').map(value => value.trim()).filter(value => UI_FILE_PATTERN.test(value)))]
}

function addedLinesForFile(path) {
  const output = execFileSync('git', ['-c', 'core.fsmonitor=false', 'diff', '--no-ext-diff', '--unified=0', '--', path], { cwd: ROOT, encoding: 'utf8' })
  return output.split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .map(line => line.slice(1))
    .join('\n')
}

function isUntracked(path) {
  const output = execFileSync('git', ['-c', 'core.fsmonitor=false', 'status', '--short', '--untracked-files=all', '--', path], { cwd: ROOT, encoding: 'utf8' })
  return output.split('\n').some(line => line.startsWith('??'))
}

async function scanChangedUi(files) {
  const findings = []
  for (const inputPath of files) {
    const path = relativePath(inputPath)
    if (!UI_FILE_PATTERN.test(path)) continue
    const source = isUntracked(path)
      ? await readFile(resolve(ROOT, path), 'utf8')
      : addedLinesForFile(path)
    findings.push(...scanUiSource(source, path))
  }
  return findings
}

function parseArgs(argv) {
  const args = { changed: false, files: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--changed') args.changed = true
    else if (value === '--files') args.files.push(...argv.slice(index + 1).filter(item => !item.startsWith('--')))
    else if (value === '--help') args.help = true
  }
  return args
}

export async function runUiSystemCheck(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  const baseline = await checkUiSystem()
  const files = args.changed
    ? (args.files.length > 0 ? args.files : changedUiFiles())
    : []
  const changedFindings = args.changed
    ? await scanChangedUi(files)
    : []
  return {
    ...baseline,
    changedScan: args.changed,
    changedFiles: files.map(relativePath),
    changedFindings,
    pass: baseline.pass && changedFindings.length === 0,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log('Usage: node scripts/check-ui-system.mjs [--changed] [--files <ui-file> ...]')
  } else {
    try {
      const result = await runUiSystemCheck(process.argv.slice(2))
      console.log(JSON.stringify(result, null, 2))
      if (!result.pass) process.exitCode = 1
    } catch (error) {
      console.log(JSON.stringify({ pass: false, findings: [{ code: 'checker_error', path: '', detail: error.message }] }, null, 2))
      process.exitCode = 1
    }
  }
}
