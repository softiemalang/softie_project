import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  applyRollupNativePatch,
  patchRollupNativeSource,
  ROLLUP_NATIVE_FALLBACK_REQUIRE,
  ROLLUP_NATIVE_PATCH_TARGET,
  ROLLUP_NATIVE_SAFE_ADVICE,
  ROLLUP_NATIVE_STALE_ADVICE,
} from '../scripts/patch-rollup-native.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const requireFromRoot = createRequire(resolve(root, 'package.json'))

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
}

test('Rollup native fallback patch is fail-closed and lockfile-safe', () => {
  const unpatched = `prefix\n${ROLLUP_NATIVE_PATCH_TARGET}\nsuffix`
  const first = patchRollupNativeSource(unpatched)

  assert.equal(first.changed, true)
  assert.equal(first.source.includes(ROLLUP_NATIVE_FALLBACK_REQUIRE), true)
  assert.equal(first.source.includes(ROLLUP_NATIVE_STALE_ADVICE), false)
  assert.equal(first.source.includes(ROLLUP_NATIVE_SAFE_ADVICE), true)

  const second = patchRollupNativeSource(first.source)
  assert.equal(second.changed, false)
  assert.equal(second.source, first.source)
})

test('Rollup native fallback patch rejects an unknown or mixed target', () => {
  assert.throws(
    () => patchRollupNativeSource('rollup native loader with no known fallback target'),
    /patch target mismatch/,
  )

  const unpatched = `${ROLLUP_NATIVE_PATCH_TARGET}\n${ROLLUP_NATIVE_PATCH_TARGET}`
  assert.throws(() => patchRollupNativeSource(unpatched), /target is ambiguous/)

  const patched = patchRollupNativeSource(ROLLUP_NATIVE_PATCH_TARGET).source
  assert.throws(() => patchRollupNativeSource(`${patched}\n${ROLLUP_NATIVE_PATCH_TARGET}`), /target is mixed/)
})

test('postinstall target mismatch fails before modifying the installed file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rollup-native-fallback-mismatch-'))
  const nativePath = join(directory, 'node_modules', 'rollup', 'dist', 'native.js')
  mkdirSync(dirname(nativePath), { recursive: true })
  writeFileSync(nativePath, 'unrecognized rollup native loader\n')

  try {
    assert.throws(() => applyRollupNativePatch({ rootDirectory: directory }), /patch target mismatch/)
    assert.equal(readFileSync(nativePath, 'utf8'), 'unrecognized rollup native loader\n')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('current Rollup and WASM fallback packages expose the compatible contract', () => {
  const rollupPackage = readJson('node_modules/rollup/package.json')
  const wasmPackage = readJson('node_modules/@rollup/wasm-node/package.json')
  assert.equal(rollupPackage.version, wasmPackage.version)

  const wasmNative = requireFromRoot('@rollup/wasm-node/dist/native.js')
  for (const exportName of ['parse', 'parseAsync', 'xxhashBase16', 'xxhashBase36', 'xxhashBase64Url']) {
    assert.equal(typeof wasmNative[exportName], 'function', `missing WASM export: ${exportName}`)
  }

  const rollup = requireFromRoot('rollup')
  assert.equal(typeof rollup.rollup, 'function')

  const nativeSource = readFileSync(resolve(root, 'node_modules/rollup/dist/native.js'), 'utf8')
  assert.equal(nativeSource.includes(ROLLUP_NATIVE_FALLBACK_REQUIRE), true)
  assert.equal(nativeSource.includes(ROLLUP_NATIVE_PATCH_TARGET), false)
  assert.equal(patchRollupNativeSource(nativeSource).source.includes(ROLLUP_NATIVE_STALE_ADVICE), false)
})
