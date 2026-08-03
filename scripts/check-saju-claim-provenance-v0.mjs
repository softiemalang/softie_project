import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { checkSajuClaimProvenanceArtifact, canonicalJson, materializeSajuClaimProvenance } from '../src/interpretationPrep/sajuClaimProvenance.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { artifactPayloadWithoutIdentity, checkArtifactIdentity } from '../src/artifactIdentity.js'

const root = new URL('../', import.meta.url)
const artifactPath = new URL('../artifacts/saju-claim-provenance-v0.json', import.meta.url)
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const fixtureEntries = sajuValidationFixtures
  .filter((entry) => !entry.expectedError)
  .map((entry) => ({ contextId: entry.id, result: prepareInterpretationData(entry.input) }))
const expected = materializeSajuClaimProvenance({ results: fixtureEntries, internalFixtures: sajuValidationFixtures, externalFixtures: SAJU_EXTERNAL_FIXTURES })
const errors = [
  ...checkSajuClaimProvenanceArtifact(artifact),
  ...checkArtifactIdentity(artifact, { root: new URL('../', import.meta.url).pathname, artifactId: 'saju-claim-provenance-v0', materializerPath: 'scripts/materialize-saju-claim-provenance-v0.mjs', materializerVersion: '1.1.0' }),
]
if (canonicalJson(artifactPayloadWithoutIdentity(artifact)) !== canonicalJson(expected)) errors.push('artifact drift or non-deterministic materialization')
if (artifact.externalEvidenceSummary?.observedScopedMatches !== 7) errors.push('scoped external match count must remain 7')
if (artifact.externalEvidenceSummary?.scope !== 'fixture_declared_fields_only; not claim_level_verification') errors.push('external scope boundary missing')
if (artifact.evidenceIndex.filter((entry) => entry.kind === 'internal_regression').length !== sajuValidationFixtures.length) errors.push('internal fixture inventory drift')
if (artifact.evidenceIndex.filter((entry) => entry.kind === 'scoped_external_reference_match').length !== SAJU_EXTERNAL_FIXTURES.length) errors.push('external fixture inventory drift')
const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (errors.length) {
  console.error(errors.map((error) => `FAIL ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ status: 'pass', head, claimCount: artifact.claimCount, contentSha256: artifact.contentSha256, artifactByteSha256: artifact.artifactByteSha256 }, null, 2))
}
