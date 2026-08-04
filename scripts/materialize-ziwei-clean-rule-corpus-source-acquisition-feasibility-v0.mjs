import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-clean-rule-corpus-source-acquisition-feasibility-v0'
export const VERDICT = 'ziwei_clean_rule_corpus_source_acquisition_feasibility_partial_blocked'
export const BASIS_HEAD = '3bbae92d81fa19107167b288c666f9dc19e2fdf3'
export const VERSION = '0.1.0'
export const INPUT = 'test/fixtures/ziwei/clean-rule-corpus-source-acquisition-feasibility-v0.json'
export const LEDGER = 'test/fixtures/ziwei/clean-rule-corpus-source-candidates-v0.json'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

export async function materializeAcquisitionFeasibility() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const observedHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (observedHead !== BASIS_HEAD) throw new Error(`feasibility requires HEAD ${BASIS_HEAD}; observed ${observedHead}`)
  const ledger = JSON.parse(await readFile(resolve(root, LEDGER), 'utf8'))
  const input = JSON.parse(await readFile(resolve(root, INPUT), 'utf8'))
  const selected = ledger.candidates.filter(candidate => candidate.verdict === 'access_blocked').map(candidate => candidate.sourceKey).sort()
  const evidence = input.officialEvidence.slice().sort((a, b) => a.sourceKey.localeCompare(b.sourceKey))
  if (JSON.stringify(selected) !== JSON.stringify(evidence.map(item => item.sourceKey).sort())) throw new Error('official evidence must cover exactly ledger access_blocked candidates')
  const assessments = Object.fromEntries(evidence.map(item => [item.sourceKey, item.sourceKey === 'google-books-2000-dingwen-ming007' || item.sourceKey === 'ndltd-097cgu05121028-exchange-rate-study' ? 'application_required' : 'rights_unclear']))
  const artifact = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead,
    accessedOn: input.accessedOn,
    scope: 'official acquisition feasibility only; no source bytes, rule corpus, claims, grounding, or interpretation',
    mechanicalSelection: { sourceSelectionLedger: LEDGER, predicate: "candidate.verdict === 'access_blocked'", selectedSourceKeys: selected },
    officialEvidence: evidence,
    acquisitionAssessments: assessments,
    alternatives: input.alternatives.slice().sort((a, b) => a.alternativeKey.localeCompare(b.alternativeKey)),
    verdictDefinitions: {
      acquirable: 'Exact edition, original/page image, reproducible page map, obtainable bytes/hash, and permitted storage/quotation are all evidenced.',
      acquirable_with_limits: 'The same gates close with explicit narrow storage/quotation limits and no complete-text claim.',
      application_required: 'A named institutional/provider application, authorized access, purchase/borrow, or in-person/copy process is required before the evidence can be closed.',
      access_blocked_frozen: 'Public route is blocked or does not expose the required witness; no bypass or inferred access is allowed.',
      identity_unresolved: 'Edition, lineage, or witness identity remains unresolved.',
      rights_unclear: 'Public access exists, but storage/reuse rights for the proposed evidence are not closed.'
    },
    sourceVerdicts: {
      'google-books-2000-dingwen-ming007': { status: 'application_required', exactEdition: true, pageMap: false, bytes: false, hash: false, rights: 'limited_personal_noncommercial; repository_storage_unresolved', nextStep: 'authorized purchase/borrow or publisher/library supply; no action taken' },
      'ndltd-097cgu05121028-exchange-rate-study': { status: 'application_required', exactEdition: false, pageMap: false, bytes: false, hash: false, rights: 'NCL access/copy conditions; repository_storage_unresolved', nextStep: 'authorized portal/library access or formal copy request; no action taken' },
      'ctext-ziwei-page-res-979714': { status: 'rights_unclear', exactEdition: false, pageMap: false, bytes: false, hash: false, rights: 'limited quotation/private use; complete seed reuse unresolved', nextStep: 'rights clarification and manually captured witness review; no action taken' }
    },
    alternativeSeedAssessment: { evaluatedCount: input.alternatives.length, admissibleCount: 0, status: 'blocked', reason: 'No alternative closes exact edition, rule-bearing location/page map, actual bytes/hash, and permitted storage together.' },
    downstreamBoundaries: { actualRuleCorpusGenerated: false, stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', interpretationGenerated: false, rankingGenerated: false, promptGenerated: false },
    prohibitedActionsNotTaken: ['download', 'login', 'account_creation', 'purchase', 'application', 'institution_contact', 'access_bypass', 'large_file_storage', 'rule_ingestion', 'claim_generation', 'grounding', 'activation'],
    deterministicContract: { candidateSelection: 'source-selection ledger verdict predicate only', sorting: 'sourceKey/alternativeKey lexicographic', generatedAt: 'forbidden', missingBytesNeverHashed: true, ids: 'stable sourceKey/alternativeKey only; no random identifiers' },
    materializer: 'scripts/materialize-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs',
    checker: 'scripts/check-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs',
    negativeFixture: 'test/fixtures/ziwei/clean-rule-corpus-source-acquisition-feasibility-negative-v0.json'
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: VERSION, baseHead: observedHead, inputs: [INPUT, LEDGER, 'src/ziwei/cleanRuleCorpusSourceSelection.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-clean-rule-corpus-source-acquisition-feasibility-v0/complete.json')
  const artifact = await materializeAcquisitionFeasibility()
  const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, artifactByteSha256: sha256(Buffer.from(body)), selectedAccessBlocked: artifact.mechanicalSelection.selectedSourceKeys, alternativeCount: artifact.alternatives.length }, null, 2))
}
