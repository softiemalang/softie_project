#!/usr/bin/env node
import {
  checkSajuShenfengNlcWitnessAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessAdjudication.js'
import { buildArtifact } from './materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs'

const witness = (artifact, witnessId) => artifact.witnesses.find(item => item.witnessId === witnessId)

export const NEGATIVE_MUTATIONS = Object.freeze([
  {
    id: 'append-dingchou-to-shenfeng-male-literal',
    mutate: artifact => { witness(artifact, 'nlc-1926-12jh004266').pageAudit.maleExample.firstDaYunLiteral = '五歲運逆行丁丑' },
  },
  {
    id: 'collapse-1926-nlc-record-identities',
    mutate: artifact => { witness(artifact, 'nlc-1926-13jh001619').itemIdentity.fid = '12jh004266' },
  },
  {
    id: 'move-1926-target-to-parent-p20-locator',
    mutate: artifact => { witness(artifact, 'nlc-1926-12jh004266').pageAudit.actualPdfPage = 20 },
  },
  {
    id: 'count-same-layout-as-independent-lineage',
    mutate: artifact => { artifact.independenceReconciliation.axes[2].countedAsIndependent = true },
  },
  {
    id: 'promote-lineage-edge',
    mutate: artifact => { artifact.lineageGraph.canonicalEdges.push({ from: '1926', to: '1929' }) },
  },
  {
    id: 'open-semantic-or-production-readiness',
    mutate: artifact => { artifact.readiness.productionActivation = 'active' },
  },
  {
    id: 'mutate-parent-preservation',
    mutate: artifact => { artifact.supersedingEvidence.predecessorArtifact.parentArtifactPreserved = false },
  },
])

export async function runNegativeChecks() {
  const base = await buildArtifact()
  return NEGATIVE_MUTATIONS.map(({ id, mutate }) => {
    const candidate = structuredClone(base)
    mutate(candidate)
    const errors = checkSajuShenfengNlcWitnessAdjudication(candidate)
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
