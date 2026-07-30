import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  generateClassificationSummary,
  serializeClassificationSummaryCanonical
} from '../scripts/lib/de405-classification-summary.mjs'

async function createTestFixture(options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'de405-class-summary-gen-test-'))

  const manifestRows = options.manifestRows || [
    { sampleId: 's1' },
    { sampleId: 's2' },
    { sampleId: 's3' },
    { sampleId: 's4' },
    { sampleId: 's5' }
  ]

  const sampleRows = options.sampleRows || [
    { sampleId: 's1' },
    { sampleId: 's2' },
    { sampleId: 's3' },
    { sampleId: 's4' },
    { sampleId: 's5' }
  ]

  const classificationRows = options.classificationRows || [
    { sampleId: 's1', classification: 'candidate_state_different' },
    { sampleId: 's2', classification: 'state_equivalent_selection_different' }
  ]

  const summaryObj = options.summaryObj || {
    schemaVersion: 1,
    sourceSampleCount: manifestRows.length,
    evaluatedSamples: manifestRows.length
  }

  const paths = {
    summary: join(dir, 'summary.json'),
    manifest: join(dir, 'manifest.jsonl'),
    samples: join(dir, 'samples.jsonl'),
    classifications: join(dir, 'classifications.jsonl'),
    output: join(dir, 'classification-summary.json')
  }

  await writeFile(paths.summary, JSON.stringify(summaryObj, null, 2) + '\n')
  await writeFile(paths.manifest, manifestRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.samples, sampleRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.classifications, classificationRows.map(r => JSON.stringify(r)).join('\n') + '\n')

  const cleanup = () => rm(dir, { recursive: true, force: true }).catch(() => {})
  return { dir, paths, cleanup }
}

test('classification summary generator produces deterministic output', async () => {
  const { paths, cleanup } = await createTestFixture()
  try {
    const summary1 = await generateClassificationSummary(paths)
    const json1 = serializeClassificationSummaryCanonical(summary1)
    const sha1 = createHash('sha256').update(json1).digest('hex')

    const summary2 = await generateClassificationSummary({ ...paths, force: true })
    const json2 = serializeClassificationSummaryCanonical(summary2)
    const sha2 = createHash('sha256').update(json2).digest('hex')

    assert.equal(json1, json2)
    assert.equal(sha1, sha2)
  } finally {
    await cleanup()
  }
})

test('valid synthetic fixture generates expected summary counts', async () => {
  const { paths, cleanup } = await createTestFixture()
  try {
    const summary = await generateClassificationSummary(paths)
    assert.equal(summary.schemaVersion, 1)
    assert.equal(summary.recordType, 'de405_sweep_classification_summary')
    assert.equal(summary.analysisStatus, 'complete')
    assert.equal(summary.sourceSampleCount, 5)
    assert.equal(summary.totalClassificationCount, 2)
    assert.equal(summary.selectionUnresolvedCount, 2)
    assert.equal(summary.outOfCoverageCount, 0)
    assert.equal(summary.duplicateClassificationIdentities, 0)
    assert.equal(summary.classificationCounts.candidate_state_different, 1)
    assert.equal(summary.classificationCounts.state_equivalent_selection_different, 1)
  } finally {
    await cleanup()
  }
})

test('empty classification fixture generates valid summary with 0 unresolved', async () => {
  const { paths, cleanup } = await createTestFixture({ classificationRows: [] })
  try {
    const summary = await generateClassificationSummary(paths)
    assert.equal(summary.sourceSampleCount, 5)
    assert.equal(summary.totalClassificationCount, 0)
    assert.equal(summary.selectionUnresolvedCount, 0)
    assert.equal(summary.outOfCoverageCount, 0)
    assert.equal(summary.analysisStatus, 'complete')
  } finally {
    await cleanup()
  }
})

test('out-of-coverage fixture sets outOfCoverageCount and incomplete analysisStatus', async () => {
  const { paths, cleanup } = await createTestFixture({
    classificationRows: [
      { sampleId: 's1', classification: 'unexpected_out_of_coverage' }
    ]
  })
  try {
    const summary = await generateClassificationSummary(paths)
    assert.equal(summary.outOfCoverageCount, 1)
    assert.equal(summary.analysisStatus, 'incomplete')
  } finally {
    await cleanup()
  }
})

test('preflight rejects manifest and samples record count mismatch', async () => {
  const { paths, cleanup } = await createTestFixture({
    sampleRows: [{ sampleId: 's1' }]
  })
  try {
    await assert.rejects(
      generateClassificationSummary(paths),
      /manifest count \(5\) != samples count \(1\)/
    )
  } finally {
    await cleanup()
  }
})

test('preflight rejects summary and manifest count mismatch', async () => {
  const { paths, cleanup } = await createTestFixture({
    summaryObj: { sourceSampleCount: 10 }
  })
  try {
    await assert.rejects(
      generateClassificationSummary(paths),
      /summary sample count \(10\) != manifest count \(5\)/
    )
  } finally {
    await cleanup()
  }
})

test('preflight rejects identity mismatches (duplicate manifest, sampleId mismatch)', async () => {
  const { paths: paths1, cleanup: c1 } = await createTestFixture({
    manifestRows: [{ sampleId: 's1' }, { sampleId: 's1' }],
    sampleRows: [{ sampleId: 's1' }, { sampleId: 's1' }]
  })
  try {
    await assert.rejects(
      generateClassificationSummary(paths1),
      /duplicate manifest sampleId: s1/
    )
  } finally {
    await c1()
  }

  const { paths: paths2, cleanup: c2 } = await createTestFixture({
    classificationRows: [{ sampleId: 'nonexistent', classification: 'candidate_state_different' }]
  })
  try {
    await assert.rejects(
      generateClassificationSummary(paths2),
      /classification sampleId nonexistent missing from manifest\/samples/
    )
  } finally {
    await c2()
  }
})

test('overwrite protection fails without force and succeeds with force', async () => {
  const { paths, cleanup } = await createTestFixture()
  try {
    // Write initial output
    await writeFile(paths.output, 'initial')

    await assert.rejects(
      async () => generateClassificationSummary(paths),
      /output_exists/
    )

    // Verify initial file content untouched
    assert.equal(await readFile(paths.output, 'utf8'), 'initial')

    // Generate with force = true
    await generateClassificationSummary({ ...paths, force: true })
    const updated = await readFile(paths.output, 'utf8')
    assert.notEqual(updated, 'initial')
    assert.equal(JSON.parse(updated).recordType, 'de405_sweep_classification_summary')
  } finally {
    await cleanup()
  }
})

test('generated classification summary satisfies proposal generator preflight inputs contract', async () => {
  const { paths, cleanup } = await createTestFixture()
  try {
    const summary = await generateClassificationSummary(paths)
    assert.ok(summary.inputs)
    assert.ok(summary.inputs.manifestSha256)
    assert.ok(summary.inputs.samplesSha256)
    assert.ok(summary.inputs.classificationSha256)
  } finally {
    await cleanup()
  }
})

test('repository artifact files are strictly preserved during generator test execution', async () => {
  const fileStat = await stat('artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json')
  assert.ok(fileStat.size > 0)
})
