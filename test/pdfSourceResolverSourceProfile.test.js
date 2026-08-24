import assert from 'node:assert/strict'
import { mkdtemp, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resolvePdfSourcePath, resolvePdfSourcePathSync } from '../scripts/lib/pdf-source-resolver.mjs'

const nanbeiPath = () => process.env.PDF_SOURCE_NANBEI_PATH
const nanyangPath = () => process.env.PDF_SOURCE_NANYANGTANG_PATH

test('explicit API source wins over configured env and verifies bytes', async () => {
  assert.ok(nanbeiPath(), 'PDF_SOURCE_NANBEI_PATH is required for source-success tests')
  const resolved = await resolvePdfSourcePath('nanbei_quanbao_219p', { explicitPath: nanbeiPath(), env: { PDF_SOURCE_NANBEI_PATH: '/missing/env.pdf' } })
  assert.equal(resolved, nanbeiPath())
})

test('explicit CLI source wins over explicit environment configuration', async () => {
  assert.ok(nanbeiPath(), 'PDF_SOURCE_NANBEI_PATH is required for source-success tests')
  const resolved = await resolvePdfSourcePath('nanbei_quanbao_219p', { argv: ['--pdf-path', nanbeiPath()], env: { PDF_SOURCE_NANBEI_PATH: '/missing/env.pdf' } })
  assert.equal(resolved, nanbeiPath())
})

test('explicit configured source directory is used before compatibility candidates', async () => {
  assert.ok(nanbeiPath(), 'PDF_SOURCE_NANBEI_PATH is required for source-success tests')
  const dir = await mkdtemp(join(tmpdir(), 'pdf-source-dir-'))
  try {
    await symlink(nanbeiPath(), join(dir, 'nanbei_quanbao_219p.pdf'))
    const resolved = await resolvePdfSourcePath('nanbei_quanbao_219p', { env: { PDF_SOURCE_DIR: dir }, compatibilityCandidates: ['/missing/compatibility.pdf'] })
    assert.equal(resolved, join(dir, 'nanbei_quanbao_219p.pdf'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('explicit configured compatibility candidate succeeds only after hash verification', () => {
  assert.ok(nanyangPath(), 'PDF_SOURCE_NANYANGTANG_PATH is required for source-success tests')
  const resolved = resolvePdfSourcePathSync('nanyangtang_quanbao_528p', { env: {}, compatibilityCandidates: [nanyangPath()] })
  assert.equal(resolved, nanyangPath())
})
