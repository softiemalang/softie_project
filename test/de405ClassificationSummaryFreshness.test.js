import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  generateClassificationSummary,
  validateClassificationSummaryFreshness
} from '../scripts/lib/de405-classification-summary.mjs'

const sha256File = async path => createHash('sha256').update(await readFile(path)).digest('hex')

async function createFreshFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'de405-class-summary-fresh-test-'))

  const manifestRows = [{ sampleId: 's1' }, { sampleId: 's2' }]
  const sampleRows = [{ sampleId: 's1' }, { sampleId: 's2' }]
  const classificationRows = [{ sampleId: 's1', classification: 'candidate_state_different' }]

  const paths = {
    summary: join(dir, 'summary.json'),
    manifest: join(dir, 'manifest.jsonl'),
    samples: join(dir, 'samples.jsonl'),
    classifications: join(dir, 'classifications.jsonl'),
    output: join(dir, 'classification-summary.json')
  }

  await writeFile(paths.summary, JSON.stringify({ sourceSampleCount: 2 }, null, 2) + '\n')
  await writeFile(paths.manifest, manifestRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.samples, sampleRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.classifications, classificationRows.map(r => JSON.stringify(r)).join('\n') + '\n')

  await generateClassificationSummary(paths)

  const cleanup = () => rm(dir, { recursive: true, force: true }).catch(() => {})
  return { dir, paths, cleanup }
}

test('freshness validator identifies matching summary as fresh', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'fresh')
    assert.equal(result.fresh, true)
    assert.equal(result.schemaVersion, 1)
    assert.deepEqual(result.mismatches, [])
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies manifest sha256 change as stale', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    // Modify manifest file content
    await writeFile(paths.manifest, JSON.stringify({ sampleId: 's-modified' }) + '\n')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.mismatches.some(m => m.source === 'manifest' && m.field === 'sha256'), true)
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies samples sha256 change as stale', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    await writeFile(paths.samples, JSON.stringify({ sampleId: 's-modified' }) + '\n')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.mismatches.some(m => m.source === 'samples' && m.field === 'sha256'), true)
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies classifications sha256 change as stale', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    await writeFile(paths.classifications, JSON.stringify({ sampleId: 's1', classification: 'other' }) + '\n')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'stale', `expected status=stale after classifications SHA mutation; actual status=${result.status}`)
    assert.equal(result.fresh, false, `expected fresh=false for mismatch role=classifications; actual fresh=${result.fresh}`)
    assert.equal(
      result.mismatches.some(m => m.source === 'classifications' && m.field === 'sha256'),
      true,
      `expected mismatch role=classifications field=sha256; actual mismatches=${JSON.stringify(result.mismatches)}`
    )
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies invalid JSON as invalid status', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    await writeFile(paths.output, 'invalid json content')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'invalid')
    assert.equal(result.fresh, false)
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies unsupported schema version as invalid status', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    const summary = JSON.parse(await readFile(paths.output, 'utf8'))
    summary.schemaVersion = 99
    await writeFile(paths.output, JSON.stringify(summary, null, 2) + '\n')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'invalid')
    assert.equal(result.fresh, false)
  } finally {
    await cleanup()
  }
})

test('freshness validator returns deterministically ordered mismatches', async () => {
  const { paths, cleanup } = await createFreshFixture()
  try {
    // Modify manifest and samples
    await writeFile(paths.manifest, JSON.stringify({ sampleId: 's-m' }) + '\n')
    await writeFile(paths.samples, JSON.stringify({ sampleId: 's-s' }) + '\n')

    const result = await validateClassificationSummaryFreshness(paths.output, paths)
    assert.equal(result.status, 'stale')
    assert.ok(result.mismatches.length >= 2)

    // Verify sorted by source ASC then field ASC
    for (let i = 0; i < result.mismatches.length - 1; i++) {
      const current = result.mismatches[i]
      const next = result.mismatches[i + 1]
      const cmp = current.source.localeCompare(next.source)
      assert.ok(cmp < 0 || (cmp === 0 && current.field.localeCompare(next.field) <= 0))
    }
  } finally {
    await cleanup()
  }
})

test('validates current repository summary as fresh without mutating repository artifacts', async () => {
  const paths = {
    summary: resolve('artifacts/de405-jpl-cspice-residual-sweep.summary.json'),
    manifest: resolve('artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl'),
    samples: resolve('artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'),
    classifications: resolve('artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl'),
    classificationSummary: resolve('artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json'),
    proposal: resolve('artifacts/de405-jpl-cspice-active-tolerance-proposal.json')
  }
  const before = {
    classificationSummary: await sha256File(paths.classificationSummary),
    proposal: await sha256File(paths.proposal)
  }

  const result = await validateClassificationSummaryFreshness(paths.classificationSummary, {
    summary: paths.summary,
    manifest: paths.manifest,
    samples: paths.samples,
    classifications: paths.classifications
  })

  assert.equal(result.status, 'fresh', `expected status=fresh for repository classification summary; actual status=${result.status}`)
  assert.equal(result.fresh, true, `expected fresh=true for repository classification summary; actual fresh=${result.fresh}`)
  assert.equal(result.schemaVersion, 1)
  assert.deepEqual(result.mismatches, [], `expected no mismatches; actual mismatches=${JSON.stringify(result.mismatches)}`)

  const after = {
    classificationSummary: await sha256File(paths.classificationSummary),
    proposal: await sha256File(paths.proposal)
  }
  assert.equal(before.classificationSummary, '57c8177ae330afb2f7aef9a6cecc1faab0d3151a3e22da8ffc129f682c73f2e7')
  assert.equal(before.proposal, 'b4fb0e412c586116bda4bde9b97bef3fc6ceff01ec7a64b36e1638d2a3f44174')
  assert.deepEqual(after, before, `repository artifact SHA changed during freshness validation: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`)
})
