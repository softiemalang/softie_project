import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  NCL_06589_SCREENSHOT_EVIDENCE,
  checkSajuSanming1578OfficialViewerAdjudication,
} from '../src/interpretationPrep/sajuSanming1578OfficialViewerAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from '../scripts/materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs'
import { verifyHistoricalSnapshot } from './helpers/sajuHistoricalSnapshot.mjs'

test('NCL 06589 official viewer evidence narrows the blocker without promoting folio or copy lineage', async () => {
  const artifact = JSON.parse(await readFile(ARTIFACT_PATH, 'utf8'))
  assert.deepEqual(checkSajuSanming1578OfficialViewerAdjudication(artifact), [])
  assert.equal(artifact.summary.firstPartyRecordIdentityObserved, true)
  assert.equal(artifact.summary.firstPartyViewerTargetObserved, true)
  assert.equal(artifact.summary.screenshotEvidenceCount, NCL_06589_SCREENSHOT_EVIDENCE.length)
  assert.equal(artifact.summary.identityContextPageCount, 2)
  assert.equal(artifact.summary.volumeSequenceContextCaptureCount, 9)
  assert.equal(artifact.summary.folioReadabilityCaptureCount, 9)
  assert.equal(artifact.summary.folioReadabilityResult, 'unresolved_not_legible_after_direct_magnification')
  assert.equal(artifact.summary.leafSequenceReadable, false)
  assert.equal(artifact.summary.boundedViewerVolumeSequenceObserved, true)
  assert.equal(artifact.summary.targetPageCount, 2)
  assert.equal(artifact.firstPartyItem.internalScanLabel, '007583')
  assert.equal(artifact.firstPartyItem.internalScanLabelToCatalogMapping, 'unresolved')
  assert.equal(artifact.targetPageReconciliation.viewerRecordInternalLabelPairing.status, 'bounded_intra_viewer_pairing')
  assert.equal(artifact.targetPageReconciliation.viewerRecordInternalLabelPairing.catalogMappingClosed, false)
  assert.equal(artifact.targetPageReconciliation.viewerVolumeContext.status, 'bounded_viewer_sequence_only')
  assert.deepEqual(artifact.targetPageReconciliation.viewerVolumeContext.targetViewerPageIndices, [150, 151])
  assert.equal(artifact.targetPageReconciliation.viewerVolumeContext.targetWithinViewerOrdinalRange, true)
  assert.equal(artifact.targetPageReconciliation.viewerVolumeContext.printedFolioClosed, false)
  assert.equal(artifact.targetPageReconciliation.viewerVolumeContext.copyLineageClosed, false)
  assert.equal(artifact.targetPageReconciliation.officialPageBytesObtained, false)
  assert.equal(artifact.targetPageReconciliation.printedFolioClosed, false)
  assert.equal(artifact.targetPageReconciliation.copyLineageClosed, false)
  assert.equal(artifact.targetPageReconciliation.folioReadabilityAssessment.status, 'unresolved_not_legible_after_direct_magnification')
  assert.equal(artifact.targetPageReconciliation.folioReadabilityAssessment.directInspectionCompleted, true)
  assert.equal(artifact.targetPageReconciliation.folioReadabilityAssessment.leafSequenceReadable, false)
  assert.equal(artifact.targetPageReconciliation.folioReadabilityAssessment.printedFolioClosed, false)
  assert.deepEqual(artifact.targetPageReconciliation.targetPages.map(page => page.viewerPageIndex), [150, 151])
  assert.deepEqual(artifact.targetPageReconciliation.targetPages.map(page => page.printedFolio), [null, null])
  assert.equal(artifact.blockerReassessment.statusAfter, 'open_narrowed')
  assert.equal(artifact.sourceClaimReconciliation.statusMutation, false)
  assert.equal(artifact.lineageGraph.newCanonicalEdges.length, 0)
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
})

test('Sanming 1578 official-viewer v1 is deterministic and preserves the historical predecessor', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))

  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs',
    materializerVersion: VERSION,
    predecessorPaths: PREDECESSOR_PATHS,
  })
  assert.deepEqual(checkSajuSanming1578OfficialViewerAdjudication(artifact), [])

  const report = JSON.parse(execFileSync(process.execPath, [
    'scripts/check-saju-sanming-1578-official-viewer-adjudication-v1.mjs',
    '--historical',
  ], { cwd: ROOT, encoding: 'utf8' }))
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.identityContextPageCount, 2)
  assert.equal(report.volumeSequenceContextCaptureCount, 9)
  assert.equal(report.folioReadabilityCaptureCount, 9)
  assert.equal(report.folioReadabilityResult, 'unresolved_not_legible_after_direct_magnification')
  assert.equal(report.boundedViewerVolumeSequenceObserved, true)
  assert.equal(report.targetPageCount, 2)
  assert.equal(report.officialPageBytesObtained, false)
  assert.equal(report.printedFolioClosed, false)
  assert.equal(report.copyLineageClosed, false)
})
