import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  generateActiveToleranceProposal,
  serializeProposalCanonical,
  validateProposalFreshness
} from '../scripts/lib/de405-active-tolerance-proposal.mjs'

async function createFreshProposalFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'de405-freshness-test-'))

  const candidateSourceObj = {
    schemaVersion: 1,
    worstCase: { metric: 'positionResidualNorm', value: 1.0e-5 },
    headroomComparison: { positionResidualNorm: { max: 1.0e-5 } },
    proposals: { A: { rule: 'max' } },
    platformScope: 'synthetic test scope'
  }

  const manifestRows = [{ sampleId: 'sample-1', queryEt: 1000 }]
  const sampleRows = [{ sampleId: 'sample-1', evaluationStatus: 'selection_ambiguous' }]
  const classificationRows = [{ sampleId: 'sample-1', classification: 'candidate_state_different' }]
  const candidateEvidenceRows = [{ schemaVersion: 1, sampleId: 'sample-1', classification: 'candidate_state_different' }]

  const manifestText = manifestRows.map(r => JSON.stringify(r)).join('\n') + '\n'
  const samplesText = sampleRows.map(r => JSON.stringify(r)).join('\n') + '\n'
  const classificationsText = classificationRows.map(r => JSON.stringify(r)).join('\n') + '\n'

  const paths = {
    candidateSource: join(dir, 'candidate-source.json'),
    summary: join(dir, 'summary.json'),
    manifest: join(dir, 'manifest.jsonl'),
    samples: join(dir, 'samples.jsonl'),
    classifications: join(dir, 'classifications.jsonl'),
    classificationSummary: join(dir, 'classification-summary.json'),
    candidateEvidence: join(dir, 'candidate-evidence.jsonl'),
    investigation: join(dir, 'investigation.json'),
    phaseSummary: join(dir, 'phase-summary.json'),
    worstCase: join(dir, 'worst-case.json')
  }

  await writeFile(paths.candidateSource, JSON.stringify(candidateSourceObj, null, 2) + '\n')
  await writeFile(paths.summary, JSON.stringify({ summary: { sourceSampleCount: 1 } }, null, 2) + '\n')
  await writeFile(paths.manifest, manifestText)
  await writeFile(paths.samples, samplesText)
  await writeFile(paths.classifications, classificationsText)
  await writeFile(paths.classificationSummary, JSON.stringify({ inputs: {} }, null, 2) + '\n')
  await writeFile(paths.candidateEvidence, candidateEvidenceRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.investigation, JSON.stringify({ cases: [] }, null, 2) + '\n')
  await writeFile(paths.phaseSummary, JSON.stringify({ analysisStatus: 'complete', selectionUnresolvedCount: 1, outOfCoverageCount: 0 }, null, 2) + '\n')
  await writeFile(paths.worstCase, JSON.stringify({ worstCaseReproduction: { status: 'verified' } }, null, 2) + '\n')

  const proposalObj = await generateActiveToleranceProposal(paths)
  const proposalPath = join(dir, 'proposal.json')
  await writeFile(proposalPath, serializeProposalCanonical(proposalObj))

  const cleanup = () => rm(dir, { recursive: true, force: true }).catch(() => {})
  return { dir, paths, proposalObj, proposalPath, cleanup }
}

test('freshness validator identifies matching v2 proposal as fresh', async () => {
  const { paths, proposalPath, cleanup } = await createFreshProposalFixture()
  try {
    const result = await validateProposalFreshness(proposalPath, paths)
    assert.equal(result.status, 'fresh')
    assert.equal(result.fresh, true)
    assert.equal(result.schemaVersion, 2)
    assert.deepEqual(result.mismatches, [])
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies file modification/sha256 change as stale', async () => {
  const { paths, proposalPath, cleanup } = await createFreshProposalFixture()
  try {
    // Modify manifest file content
    await writeFile(paths.manifest, JSON.stringify({ sampleId: 'sample-modified', queryEt: 9999 }) + '\n')

    const result = await validateProposalFreshness(proposalPath, paths)
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.schemaVersion, 2)
    assert.equal(result.mismatches.some(m => m.source === 'manifest' && m.field === 'sha256'), true)
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies schema v1 proposal as stale due to missing provenance', async () => {
  const { dir, paths, cleanup } = await createFreshProposalFixture()
  try {
    const v1Obj = {
      schemaVersion: 1,
      sourceSummary: {
        manifest: { size: 10, sha256: 'dummy', lineCount: 1 }
      }
    }
    const v1Path = join(dir, 'v1-proposal.json')
    await writeFile(v1Path, JSON.stringify(v1Obj, null, 2) + '\n')

    const result = await validateProposalFreshness(v1Path, paths)
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.schemaVersion, 1)
    assert.equal(result.mismatches.some(m => m.source === 'provenance'), true)
  } finally {
    await cleanup()
  }
})

test('freshness validator identifies unparseable or corrupted JSON as invalid', async () => {
  const { dir, paths, cleanup } = await createFreshProposalFixture()
  try {
    const invalidPath = join(dir, 'invalid.json')
    await writeFile(invalidPath, '{ corrupt json ...')

    const result = await validateProposalFreshness(invalidPath, paths)
    assert.equal(result.status, 'invalid')
    assert.equal(result.fresh, false)
    assert.equal(result.schemaVersion, null)
  } finally {
    await cleanup()
  }
})

test('mismatches in validator result are deterministically sorted', async () => {
  const { paths, proposalPath, cleanup } = await createFreshProposalFixture()
  try {
    await writeFile(paths.manifest, 'modified\n')
    await writeFile(paths.samples, 'modified\n')

    const result = await validateProposalFreshness(proposalPath, paths)
    assert.equal(result.status, 'stale')
    const sources = result.mismatches.map(m => m.source)
    const sortedSources = [...sources].sort((a, b) => a.localeCompare(b))
    assert.deepEqual(sources, sortedSources)
  } finally {
    await cleanup()
  }
})
