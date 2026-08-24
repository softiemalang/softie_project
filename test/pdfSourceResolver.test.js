import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getPdfSourceMetadata, resolvePdfSourcePath, resolvePdfSourcePathSync } from '../scripts/lib/pdf-source-resolver.mjs'

const nanbeiPath = () => process.env.PDF_SOURCE_NANBEI_PATH

test('missing and hash-mismatched sources are distinct failures without fallback', async () => {
  await assert.rejects(
    () => resolvePdfSourcePath('nanbei_quanbao_219p', { explicitPath: join(tmpdir(), 'pdf-source-does-not-exist.pdf'), env: { PDF_SOURCE_NANBEI_PATH: nanbeiPath() } }),
    error => error.code === 'MISSING_SOURCE_FILE',
  )

  const dir = await mkdtemp(join(tmpdir(), 'pdf-source-resolver-'))
  try {
    const mismatch = join(dir, 'mismatch.pdf')
    await writeFile(mismatch, Buffer.from('%PDF-not-the-registered-source'))
    await assert.rejects(
      () => resolvePdfSourcePath('nanbei_quanbao_219p', { explicitPath: mismatch, env: { PDF_SOURCE_NANBEI_PATH: nanbeiPath() } }),
      error => error.code === 'SHA256_MISMATCH',
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('malformed input and unknown sources fail closed', () => {
  assert.throws(() => resolvePdfSourcePathSync('nanbei_quanbao_219p', { explicitPath: '' }), error => error.code === 'INVALID_SOURCE_INPUT')
  assert.throws(() => resolvePdfSourcePathSync('nanbei_quanbao_219p', { argv: ['--pdf-path'] }), error => error.code === 'INVALID_SOURCE_INPUT')
  assert.throws(() => resolvePdfSourcePathSync('unknown-source', { explicitPath: '/tmp/anything.pdf' }), error => error.code === 'UNKNOWN_SOURCE_ID')
  assert.equal(getPdfSourceMetadata('nanbei_quanbao_219p').expectedSha256, '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023')
})
