#!/usr/bin/env node
import {
  checkSajuGeminiV7ParentAdjudication,
} from '../src/interpretationPrep/sajuGeminiV7ParentAdjudication.js'
import { buildArtifact } from './materialize-saju-gemini-v7-parent-adjudication.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)
const edge = (artifact, edgeId) => artifact.lineageGraph.edges.find(item => item.edgeId === edgeId)

export const NEGATIVE_MUTATIONS = Object.freeze([
  {
    id: 'gemini-v7-wholesale-import',
    mutate: artifact => { artifact.candidatePacket.importedAsCanonicalEvidence = true },
  },
  {
    id: 'catalog-extent-to-public-12-volume-transition',
    mutate: artifact => { claim(artifact, 'claim.B.anu-catalog-extent-to-public-count').status = 'kept' },
  },
  {
    id: 'same-worked-case-to-independent-lineage',
    mutate: artifact => { claim(artifact, 'claim.A.same-worked-example-independent-corroboration').independence.axes['edition/textual-lineage'].countedAsIndependent = true },
  },
  {
    id: 'text-abbreviation-to-independence',
    mutate: artifact => { claim(artifact, 'claim.A.sanming-literal-one-day-four-month').independence.axes['semantic-corroboration'].countedAsIndependent = true },
  },
  {
    id: 'seal-owner-lifetime-to-manuscript-taq',
    mutate: artifact => { claim(artifact, 'claim.C.gengcun-TAQ-1843').status = 'kept' },
  },
  {
    id: 'metadata-to-transmission-genealogy',
    mutate: artifact => { edge(artifact, 'edge欄江網-to-造化元鑰').canonicalGraphIncluded = true },
  },
  {
    id: 'cover-preface-to-physical-edition-date',
    mutate: artifact => { claim(artifact, 'claim.D.waseda-cover-to-physical-date').status = 'kept' },
  },
  {
    id: 'ctext-e-text-to-historical-witness',
    mutate: artifact => { claim(artifact, 'claim.E.ctext-e-text-as-historical-witness').status = 'kept' },
  },
  {
    id: 'hypothesis-edge-to-canonical-graph',
    mutate: artifact => { edge(artifact, 'edge1776-manuscript-to-1895-edition').canonicalGraphIncluded = true },
  },
  {
    id: 'historical-rule-to-production-authority',
    mutate: artifact => { artifact.readiness.productionActivation = 'active' },
  },
])

export async function runNegativeChecks() {
  const base = await buildArtifact()
  return NEGATIVE_MUTATIONS.map(({ id, mutate }) => {
    const candidate = structuredClone(base)
    mutate(candidate)
    const errors = checkSajuGeminiV7ParentAdjudication(candidate)
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
