import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import {
  generateActiveToleranceProposal,
  runProposalPreflight,
  serializeProposalCanonical
} from '../scripts/lib/de405-active-tolerance-proposal.mjs'

async function createSyntheticFixtures({
  manifestCount = 3,
  samplesCount = 3,
  unresolvedCount = 2,
  outOfCoverageCount = 0,
  staleClassificationSummary = false,
  missingEvidenceId = false,
  worstCaseVerified = true
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'de405-gen-test-'))

  const candidateSourceObj = {
    schemaVersion: 1,
    recordType: 'de405_active_tolerance_proposal',
    worstCase: { metric: 'positionResidualNorm', value: 1.0e-5 },
    headroomComparison: { positionResidualNorm: { max: 1.0e-5 } },
    proposals: { A: { rule: 'max' } },
    platformScope: 'synthetic test scope'
  }

  const manifestRows = []
  for (let i = 0; i < manifestCount; i += 1) {
    const sampleId = `sample-${i + 1}`
    manifestRows.push({ sampleId, queryEt: 1000 + i, targetId: 2, centerId: 0, epochKind: 'knot' })
  }

  const sampleRows = []
  for (let i = 0; i < samplesCount; i += 1) {
    const sampleId = `sample-${i + 1}`
    sampleRows.push({ sampleId, evaluationStatus: i < unresolvedCount ? 'selection_ambiguous' : 'evaluated' })
  }

  const classificationRows = []
  for (let i = 0; i < unresolvedCount; i += 1) {
    classificationRows.push({ sampleId: `sample-${i + 1}`, classification: 'candidate_state_different', reason: 'synthetic test' })
  }
  for (let i = 0; i < outOfCoverageCount; i += 1) {
    classificationRows.push({ sampleId: `sample-${unresolvedCount + i + 1}`, classification: 'unexpected_out_of_coverage', reason: 'synthetic test' })
  }

  const candidateEvidenceRows = []
  for (let i = 0; i < (missingEvidenceId ? unresolvedCount - 1 : unresolvedCount); i += 1) {
    candidateEvidenceRows.push({
      schemaVersion: 1,
      recordType: 'de405_candidate_state_evidence',
      sampleId: `sample-${i + 1}`,
      classification: 'candidate_state_different'
    })
  }

  const manifestText = manifestRows.map(r => JSON.stringify(r)).join('\n') + '\n'
  const samplesText = sampleRows.map(r => JSON.stringify(r)).join('\n') + '\n'
  const classificationsText = classificationRows.map(r => JSON.stringify(r)).join('\n') + '\n'

  const manifestSha256 = createHash('sha256').update(manifestText).digest('hex')
  const samplesSha256 = createHash('sha256').update(samplesText).digest('hex')
  const classificationSha256 = createHash('sha256').update(classificationsText).digest('hex')

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
  await writeFile(paths.summary, JSON.stringify({ summary: { sourceSampleCount: manifestCount } }, null, 2) + '\n')
  await writeFile(paths.manifest, manifestText)
  await writeFile(paths.samples, samplesText)
  await writeFile(paths.classifications, classificationsText)
  await writeFile(paths.classificationSummary, JSON.stringify({
    inputs: {
      manifestSha256: staleClassificationSummary ? 'stale_hash' : manifestSha256,
      samplesSha256: staleClassificationSummary ? 'stale_hash' : samplesSha256,
      classificationSha256: staleClassificationSummary ? 'stale_hash' : classificationSha256
    }
  }, null, 2) + '\n')
  await writeFile(paths.candidateEvidence, candidateEvidenceRows.map(r => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(paths.investigation, JSON.stringify({ cases: new Array(outOfCoverageCount).fill({}) }, null, 2) + '\n')
  await writeFile(paths.phaseSummary, JSON.stringify({ analysisStatus: 'complete', selectionUnresolvedCount: unresolvedCount, outOfCoverageCount }, null, 2) + '\n')
  await writeFile(paths.worstCase, JSON.stringify({ worstCaseReproduction: { status: worstCaseVerified ? 'verified' : 'failed' } }, null, 2) + '\n')

  const cleanup = () => rm(dir, { recursive: true, force: true }).catch(() => {})
  return { dir, paths, cleanup }
}

test('generator output is byte-identical and deterministic across multiple runs', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ manifestCount: 5, samplesCount: 5, unresolvedCount: 2 })
  try {
    const proposal1 = await generateActiveToleranceProposal(paths)
    const json1 = serializeProposalCanonical(proposal1)
    const sha1 = createHash('sha256').update(json1).digest('hex')

    const proposal2 = await generateActiveToleranceProposal(paths)
    const json2 = serializeProposalCanonical(proposal2)
    const sha256_2 = createHash('sha256').update(json2).digest('hex')

    assert.equal(json1, json2)
    assert.equal(sha1, sha256_2)
    assert.equal(json1.endsWith('\n'), true)
    assert.equal(proposal1.schemaVersion, 2)
  } finally {
    await cleanup()
  }
})

test('generator correctly extracts candidate allowlist and ignores stale candidate source blockers/status', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ unresolvedCount: 2 })
  try {
    const proposal = await generateActiveToleranceProposal(paths)
    assert.equal(proposal.candidate.payload.platformScope, 'synthetic test scope')
    assert.equal(proposal.candidate.approved, false)
    assert.deepEqual(proposal.blockers, ['selection_unresolved=2'])
    assert.equal(proposal.status, 'blocked_by_unresolved_evidence')
    assert.equal(proposal.activeTransition, false)
    assert.equal(proposal.contractModified, false)
  } finally {
    await cleanup()
  }
})

test('generator produces pending_scientific_approval when unresolved and out-of-coverage counts are zero', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ manifestCount: 4, samplesCount: 4, unresolvedCount: 0, outOfCoverageCount: 0 })
  try {
    const proposal = await generateActiveToleranceProposal(paths)
    assert.equal(proposal.status, 'pending_scientific_approval')
    assert.deepEqual(proposal.blockers, [])
    assert.equal(proposal.activeTransition, false)
  } finally {
    await cleanup()
  }
})

test('generator includes unexpected_out_of_coverage blocker when out-of-coverage > 0', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ manifestCount: 5, samplesCount: 5, unresolvedCount: 1, outOfCoverageCount: 2 })
  try {
    const proposal = await generateActiveToleranceProposal(paths)
    assert.equal(proposal.status, 'blocked_by_unresolved_evidence')
    assert.deepEqual(proposal.blockers, ['selection_unresolved=1', 'unexpected_out_of_coverage=2'])
  } finally {
    await cleanup()
  }
})

test('preflight rejects count mismatch between manifest and samples', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ manifestCount: 3, samplesCount: 4 })
  try {
    await assert.rejects(
      async () => runProposalPreflight(paths),
      /Preflight count mismatch/
    )
  } finally {
    await cleanup()
  }
})

test('preflight rejects stale classification summary source hash mismatch', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ staleClassificationSummary: true })
  try {
    await assert.rejects(
      async () => runProposalPreflight(paths),
      /Preflight error: classification summary manifest SHA-256 mismatch/
    )
  } finally {
    await cleanup()
  }
})

test('preflight rejects candidate evidence missing unresolved sample IDs', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ missingEvidenceId: true })
  try {
    await assert.rejects(
      async () => runProposalPreflight(paths),
      /Preflight error: candidate evidence record count/
    )
  } finally {
    await cleanup()
  }
})

test('preflight rejects unverified worst-case reproduction status', async () => {
  const { paths, cleanup } = await createSyntheticFixtures({ worstCaseVerified: false })
  try {
    await assert.rejects(
      async () => runProposalPreflight(paths),
      /Preflight error: worst-case reproduction status is not verified/
    )
  } finally {
    await cleanup()
  }
})

test('generator rejects when candidate source path is identical to output path', async () => {
  const { paths, cleanup } = await createSyntheticFixtures()
  try {
    const samePathOptions = { ...paths, output: paths.candidateSource }
    await assert.rejects(
      async () => generateActiveToleranceProposal(samePathOptions),
      /candidate_source_equals_output/
    )
  } finally {
    await cleanup()
  }
})

test('generator allows replacement simulation without self-reference hash chain when output is written to a distinct file', async () => {
  const { dir, paths, cleanup } = await createSyntheticFixtures()
  try {
    const proposal1 = await generateActiveToleranceProposal(paths)
    const json1 = serializeProposalCanonical(proposal1)

    // Simulate replacement: output is written to distinct file (or replaced via script --force)
    const distinctOutput = join(dir, 'output-proposal.json')
    const proposal2 = await generateActiveToleranceProposal({ ...paths, output: distinctOutput })
    const json2 = serializeProposalCanonical(proposal2)

    assert.equal(json1, json2)
  } finally {
    await cleanup()
  }
})
