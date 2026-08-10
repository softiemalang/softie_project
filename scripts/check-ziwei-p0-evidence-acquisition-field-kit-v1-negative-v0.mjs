import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { ARTIFACT_PATH, ROOT } from './materialize-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'
import { checkArtifact } from './check-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'

const mutate = (id, fn) => ({ id, fn })

const MUTATIONS = [
  mutate('wrong-blocker-target-map', candidate => { candidate.targets[0].blockerIds = ['blocker-image-reuse-rights'] }),
  mutate('claim-layer-mix', candidate => { candidate.targets.find(item => item.id === 'acq-calendar-time-input-authority').resolvesClaimIds.push('claim-major-star-placement-ziwei') }),
  mutate('source-authority-promotion', candidate => { candidate.scope.sourceAuthorityPromoted = true }),
  mutate('semantic-authority-promotion', candidate => { candidate.currentAudit.statuses.sourceAuthorityPromoted = true; candidate.currentAudit.graph.semanticAuthority = 1 }),
  mutate('same-record-independent', candidate => { candidate.currentAudit.sourceInventory.heldButAuthorityInsufficient[2].status = 'independent_witness_admitted' }),
  mutate('rotation-semantic-promotion', candidate => { candidate.currentAudit.statuses.rotation06 = 'semantic_authority' }),
  mutate('nanyang-missing-cell-fill', candidate => { candidate.currentAudit.keyEvidenceBoundaries.find(item => item.id === 'four-transformations').observed = 'Nanbei 40/40; Nanyang 40/40 direct' }),
  mutate('shen-zhu-row-elision', candidate => { candidate.currentAudit.keyEvidenceBoundaries.find(item => item.id === 'life-body-rulers').observed = 'life/body 144/144; 命主 144/144; 身主 144/144' }),
  mutate('ocr-acceptance-shortcut', candidate => { candidate.targets[1].acceptanceCriteria.push('OCR-only is sufficient') }),
  mutate('rights-resolves-semantic-claim', candidate => { candidate.targets.find(item => item.id === 'review-image-level-reuse-permission').resolvesClaimIds = ['claim-12-palace-diagram-semantics'] }),
  mutate('readiness-promotion', candidate => { candidate.scope.readinessChanged = true }),
  mutate('image-storage', candidate => { candidate.preservation.sourceImagesStoredInGit = true }),
  mutate('external-acquisition', candidate => { candidate.scope.externalAcquisitionPerformed = true }),
  mutate('generated-timestamp', candidate => { candidate.deterministicContract.generatedAt = '2026-08-10T00:00:00Z' }),
]

const baselineBytes = await readFile(resolve(ROOT, ARTIFACT_PATH))
const baseline = JSON.parse(baselineBytes)
const results = []
for (const mutation of MUTATIONS) {
  const candidate = structuredClone(baseline)
  mutation.fn(candidate)
  const failures = await checkArtifact(candidate, { root: ROOT })
  results.push({ id: mutation.id, rejected: failures.length > 0, failures })
}

const result = {
  schemaVersion: 'ziwei-p0-evidence-acquisition-field-kit-v1-negative-v0',
  mutationCount: MUTATIONS.length,
  allRejected: results.every(item => item.rejected),
  results,
}
console.log(JSON.stringify(result, null, 2))
if (!result.allRejected) process.exitCode = 1
