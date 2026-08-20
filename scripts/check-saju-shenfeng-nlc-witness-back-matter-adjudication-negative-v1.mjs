#!/usr/bin/env node
import {
  checkSajuShenfengNlcWitnessBackMatterAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessBackMatterAdjudicationV1.js'
import { buildArtifact } from './materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs'

export const NEGATIVE_MUTATIONS = Object.freeze([
  {
    id: 'promote-backmatter-to-copy-identity',
    mutate: artifact => { artifact.blockerReassessment[0].currentStatus = 'satisfied' },
  },
  {
    id: 'close-edition-lineage-from-reprint-notice',
    mutate: artifact => { artifact.blockerReassessment[3].currentStatus = 'satisfied' },
  },
  {
    id: 'promote-library-mark-to-nlc-call-number',
    mutate: artifact => { artifact.newEvidence.observations[1].observedMarks.push('NLC call number established') },
  },
  {
    id: 'add-canonical-lineage-edge',
    mutate: artifact => { artifact.lineageGraph.canonicalEdges.push({ from: '1926', to: '1929' }) },
  },
  {
    id: 'open-readiness-or-production',
    mutate: artifact => { artifact.readiness.productionActivation = 'active' },
  },
  {
    id: 'mutate-v0-predecessor',
    mutate: artifact => { artifact.predecessor.preserved = false },
  },
])

export async function runNegativeChecks() {
  const base = await buildArtifact()
  return NEGATIVE_MUTATIONS.map(({ id, mutate }) => {
    const candidate = structuredClone(base)
    mutate(candidate)
    const errors = checkSajuShenfengNlcWitnessBackMatterAdjudication(candidate)
    return { id, rejected: errors.length > 0, errors }
  })
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const results = await runNegativeChecks()
  const failed = results.filter(result => !result.rejected)
  console.log(JSON.stringify({
    status: failed.length ? 'fail' : 'pass',
    requiredCount: results.length,
    rejectedCount: results.filter(result => result.rejected).length,
    results,
  }, null, 2))
  if (failed.length) process.exitCode = 1
}
