import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROLLUP_NATIVE_FALLBACK_REQUIRE = "require('@rollup/wasm-node/dist/native.js')"
export const ROLLUP_NATIVE_LEGACY_FALLBACK_REQUIRE = "require('@rollup/wasm-node')"
export const ROLLUP_NATIVE_STALE_ADVICE = 'Please try `npm i` again after removing both package-lock.json and node_modules directory.'
export const ROLLUP_NATIVE_SAFE_ADVICE = 'Re-run npm ci using the committed package-lock.json; do not delete package-lock.json.'

export const ROLLUP_NATIVE_PATCH_TARGET = `\t\tthrow new Error(
\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t'${ROLLUP_NATIVE_STALE_ADVICE}',
\t\t\t{ cause: error }
\t\t);`

export const ROLLUP_NATIVE_PATCH_REPLACEMENT = `\t\ttry {
\t\t\treturn require('@rollup/wasm-node/dist/native.js');
\t\t} catch {
\t\t\tthrow new Error(
\t\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t\t'${ROLLUP_NATIVE_SAFE_ADVICE}',
\t\t\t\t{ cause: error }
\t\t\t);
\t\t}`

function countOccurrences(source, value) {
  let count = 0
  let offset = 0
  while (true) {
    const next = source.indexOf(value, offset)
    if (next === -1) return count
    count += 1
    offset = next + value.length
  }
}

function normalizeStaleAdvice(source) {
  const staleCount = countOccurrences(source, ROLLUP_NATIVE_STALE_ADVICE)
  if (staleCount > 1) {
    throw new Error(`Rollup native fallback stale guidance count mismatch: expected at most one, found ${staleCount}`)
  }
  return source.replace(ROLLUP_NATIVE_STALE_ADVICE, ROLLUP_NATIVE_SAFE_ADVICE)
}

export function patchRollupNativeSource(source) {
  const targetCount = countOccurrences(source, ROLLUP_NATIVE_PATCH_TARGET)
  const fallbackCount = countOccurrences(source, ROLLUP_NATIVE_FALLBACK_REQUIRE)
  const legacyFallbackCount = countOccurrences(source, ROLLUP_NATIVE_LEGACY_FALLBACK_REQUIRE)

  if (targetCount > 1 || fallbackCount > 1 || legacyFallbackCount > 1) {
    throw new Error(
      `Rollup native fallback patch target is ambiguous: target=${targetCount}, fallback=${fallbackCount}, legacyFallback=${legacyFallbackCount}`,
    )
  }

  if (targetCount > 0 && (fallbackCount > 0 || legacyFallbackCount > 0)) {
    throw new Error('Rollup native fallback patch target is mixed: both patched and unpatched forms are present')
  }

  if (fallbackCount === 1) {
    const nextSource = normalizeStaleAdvice(source)
    return { source: nextSource, changed: nextSource !== source }
  }

  if (legacyFallbackCount === 1) {
    const nextSource = normalizeStaleAdvice(source.replaceAll(ROLLUP_NATIVE_LEGACY_FALLBACK_REQUIRE, ROLLUP_NATIVE_FALLBACK_REQUIRE))
    if (countOccurrences(nextSource, ROLLUP_NATIVE_FALLBACK_REQUIRE) !== 1) {
      throw new Error('Rollup native fallback patch target mismatch after legacy fallback normalization')
    }
    return { source: nextSource, changed: nextSource !== source }
  }

  if (targetCount !== 1) {
    throw new Error(`Rollup native fallback patch target mismatch: expected exactly one unpatched target, found ${targetCount}`)
  }

  const nextSource = normalizeStaleAdvice(source.replace(ROLLUP_NATIVE_PATCH_TARGET, ROLLUP_NATIVE_PATCH_REPLACEMENT))
  if (countOccurrences(nextSource, ROLLUP_NATIVE_FALLBACK_REQUIRE) !== 1 || countOccurrences(nextSource, ROLLUP_NATIVE_PATCH_TARGET) !== 0) {
    throw new Error('Rollup native fallback patch did not produce exactly one patched fallback')
  }
  return { source: nextSource, changed: true }
}

export function applyRollupNativePatch({ rootDirectory = process.cwd() } = {}) {
  const nativeJsPath = resolve(rootDirectory, 'node_modules/rollup/dist/native.js')
  const source = readFileSync(nativeJsPath, 'utf8')
  const result = patchRollupNativeSource(source)
  if (result.changed) writeFileSync(nativeJsPath, result.source)
  return { ...result, nativeJsPath }
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedAsScript) {
  applyRollupNativePatch()
}
