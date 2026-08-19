import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v15.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v15.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const mutations = [
  { id: 'promote-suzhou-holding', mutate: value => { value.v15ResearchDossier.units.quaternary.sourceIdentity.reportedHolding.status = 'authoritative' } },
  { id: 'invent-suzhou-item', mutate: value => { value.v15ResearchDossier.units.quaternary.sourceIdentity.itemIdentifier = { status: 'direct', detail: 'invented-item' } } },
  { id: 'invent-suzhou-leaf', mutate: value => { value.v15ResearchDossier.units.quaternary.sourceBytes.embeddedImage.historicalLeaf = true } },
  { id: 'promote-suzhou-branch', mutate: value => { value.v15ResearchDossier.units.quaternary.fiveFieldBinding.branchToken.status = 'direct' } },
  { id: 'promote-suzhou-full-binding', mutate: value => { value.v15ResearchDossier.units.quaternary.fiveFieldBinding.fullBinding = true } },
  { id: 'promote-suzhou-independent', mutate: value => { value.v15ResearchDossier.units.quaternary.graphAdmission.independentPhysicalWitnessAdmitted = true } },
  { id: 'promote-suzhou-same-copy', mutate: value => { value.v15ResearchDossier.units.quaternary.sourceIdentity.sameCopyAsAnhuiZi4051 = { status: 'direct', detail: 'same-copy' } } },
  { id: 'add-suzhou-graph-source', mutate: value => { value.v15ResearchDossier.graphBoundary.sourcesAdded = 1 } },
  { id: 'continue-acquisition-gate', mutate: value => { value.v15ResearchDossier.continuationDecisions.suzhouFrontier.decision = 'continue' } },
  { id: 'close-parent-blocker', mutate: value => { value.v15ResearchDossier.blockers[0].status = 'resolved' } },
  { id: 'promote-readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'add-generated-timestamp', mutate: value => { value.v15ResearchDossier.generatedAt = new Date().toISOString() } },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v15-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
