import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v14.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v14.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v14-negative-'))
  const completePath = resolve(directory, 'complete.json')
  try {
    await materializeBundle(completePath, { mode: 'historical_reference' })
    const value = JSON.parse(await readFile(completePath, 'utf8'))
    mutation(value)
    const body = Buffer.from(canonicalJson(value))
    await writeFile(completePath, body)
    await writeFile(completePath + '.integrity.json', canonicalJson({
      schemaVersion: SCHEMA + '-integrity-v0',
      path: relative(ROOT, completePath),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
    const errors = checkArtifact(ROOT, completePath)
    return { rejected: errors.length > 0, errors }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

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

const results = []
for (const mutation of mutations) results.push({ id: mutation.id, ...(await mutateAndCheck(mutation.mutate)) })
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
