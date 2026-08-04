import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'
import { BASIS_HEAD, INPUT, LEDGER, SCHEMA, VERDICT, VERSION } from './materialize-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs'
const root = resolve(new URL('..', import.meta.url).pathname)
const path = resolve(process.argv[2] || 'artifacts/ziwei-clean-rule-corpus-source-acquisition-feasibility-v0/complete.json')
const artifact = JSON.parse(await readFile(path, 'utf8')); const ledger = JSON.parse(await readFile(resolve(root, LEDGER), 'utf8')); const failures = []
const blocked = ledger.candidates.filter(x => x.verdict === 'access_blocked').map(x => x.sourceKey).sort()
if (artifact.schemaVersion !== SCHEMA || artifact.verdictToken !== VERDICT || artifact.basisHead !== BASIS_HEAD || artifact.observedHead !== BASIS_HEAD) failures.push('schema_or_head')
if (JSON.stringify(artifact.mechanicalSelection.selectedSourceKeys) !== JSON.stringify(blocked)) failures.push('mechanical_selection_changed')
if (JSON.stringify(Object.keys(artifact.acquisitionAssessments).sort()) !== JSON.stringify(blocked)) failures.push('assessment_scope_changed')
for (const key of blocked) { const item = artifact.sourceVerdicts?.[key]; if (!item || !['application_required', 'access_blocked_frozen', 'rights_unclear', 'identity_unresolved', 'acquirable', 'acquirable_with_limits'].includes(item.status)) failures.push(`missing_status:${key}`); if (item?.hash === true || item?.bytes === true) failures.push(`unproven_bytes:${key}`); if (['acquirable', 'acquirable_with_limits'].includes(item?.status)) failures.push(`unsafe_admission:${key}`) }
if (artifact.alternativeSeedAssessment?.admissibleCount !== 0 || artifact.alternativeSeedAssessment?.status !== 'blocked') failures.push('alternative_seed_promoted')
const d = artifact.downstreamBoundaries || {}; if (d.actualRuleCorpusGenerated !== false || d.stableClaimCount !== 0 || d.readiness !== 'not_safe_to_start' || d.grounding !== 'blocked' || d.activation !== 'experimental' || d.interpretationGenerated !== false || d.rankingGenerated !== false || d.promptGenerated !== false) failures.push('downstream_promoted')
if (artifact.prohibitedActionsNotTaken?.includes('download') !== true || artifact.prohibitedActionsNotTaken?.includes('purchase') !== true) failures.push('boundary_missing')
failures.push(...checkArtifactIdentity(artifact, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs', materializerVersion: VERSION }))
const bytes = await readFile(path); const result = { pass: failures.length === 0, basisHead: artifact.basisHead, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), selectedAccessBlocked: blocked, alternativeSeedAdmissibleCount: artifact.alternativeSeedAssessment?.admissibleCount, failures: [...new Set(failures)] }
console.log(JSON.stringify(result, null, 2)); if (result.failures.length) process.exitCode = 1
