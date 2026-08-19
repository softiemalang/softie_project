import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v14.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v14.mjs'
import { runZiweiP0NegativeMutations } from './lib/run-ziwei-p0-negative-mutations.mjs'

const mutations = [
  { id: 'promote-jielan-source', mutate: value => { value.v14ResearchDossier.units.primary.sourceIdentity.heldBy.status = 'authoritative' } },
  { id: 'invent-jielan-leaf', mutate: value => { value.v14ResearchDossier.units.primary.accessBoundary.rawHistoricalLeafAcquired = true } },
  { id: 'promote-jielan-binding', mutate: value => { value.v14ResearchDossier.units.primary.fiveFieldBinding.fullBinding = true } },
  { id: 'promote-jielan-ordinal', mutate: value => { value.v14ResearchDossier.units.primary.fiveFieldBinding.productionOrdinal = true } },
  { id: 'promote-erxianan-child', mutate: value => { value.v14ResearchDossier.units.secondary.transmissionCheck.exactZiweiChildUnder1906 = true } },
  { id: 'promote-erxianan-independent', mutate: value => { value.v14ResearchDossier.units.secondary.fiveFieldBinding.independentPhysicalWitness = true } },
  { id: 'promote-commercial-preview', mutate: value => { value.v14ResearchDossier.units.tertiary.fiveFieldBinding.semanticAuthority = true } },
  { id: 'add-dossier-graph-source', mutate: value => { value.v14ResearchDossier.graphBoundary.sourcesAdded = 1 } },
  { id: 'close-dossier-blocker', mutate: value => { value.v14ResearchDossier.blockers[0].status = 'resolved' } },
  { id: 'promote-readiness', mutate: value => { value.readinessImpact.readiness = 'safe_to_start' } },
  { id: 'add-generated-timestamp', mutate: value => { value.v14ResearchDossier.generatedAt = new Date().toISOString() } },
]

const results = await runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root: ROOT,
  schema: SCHEMA,
  tempPrefix: 'ziwei-palace-composition-v14-negative',
})
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
