import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  canonicalJson,
  materializeBundle,
  ROOT,
  SCHEMA,
} from './materialize-ziwei-p0-palace-branch-slot-composition-v15.mjs'
import { checkArtifact } from './check-ziwei-p0-palace-branch-slot-composition-v15.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function mutateAndCheck(mutation) {
  const directory = await mkdtemp(resolve(tmpdir(), 'ziwei-palace-composition-v15-negative-'))
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

const results = []
for (const mutation of mutations) results.push({ id: mutation.id, ...(await mutateAndCheck(mutation.mutate)) })
const failed = results.filter(item => !item.rejected)
console.log(JSON.stringify({ schemaVersion: SCHEMA, mutationCount: results.length, allRejected: failed.length === 0, results }, null, 2))
if (failed.length) process.exitCode = 1
