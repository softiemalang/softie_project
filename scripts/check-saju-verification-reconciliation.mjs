import fs from 'node:fs'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { SAJU_VALIDATION_FIXTURE_VERSION, sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { runExternalValidationSuite } from '../src/interpretationPrep/externalValidationRunner.js'

const root = new URL('../', import.meta.url).pathname
const artifactPath = new URL('../artifacts/saju-verification-reconciliation-v1.json', import.meta.url).pathname
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const errors = []
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const externalRun = runExternalValidationSuite()
const fail = (message) => errors.push(message)

if (artifact.schemaVersion !== 'saju-verification-reconciliation-v1') fail('schemaVersion mismatch')
if (artifact.generatedFromHead !== currentHead) fail(`generatedFromHead ${artifact.generatedFromHead} != current HEAD ${currentHead}`)
if (artifact.verdictToken !== 'saju_scoped_external_matches_but_claim_level_verification_unproven') fail('unexpected verdictToken')
if (artifact.counts.internalRegressionFixtures !== sajuValidationFixtures.length) fail('internal fixture count drift')
if (artifact.counts.internalRegressionOnly !== sajuValidationFixtures.filter((fixture) => fixture.verificationStatus === 'regression_only').length) fail('regression_only count drift')
if (artifact.counts.internalPendingExternal !== sajuValidationFixtures.filter((fixture) => fixture.verificationStatus === 'pending_external_verification').length) fail('pending fixture count drift')
if (artifact.counts.independentReferenceFixtures !== SAJU_EXTERNAL_FIXTURES.length) fail('external fixture count drift')
if (artifact.counts.independentObservedMatches !== externalRun.sajuSummary.observedMatches) fail('observed match count drift')
if (artifact.counts.independentObservedMismatches !== externalRun.sajuSummary.observedMismatches) fail('observed mismatch count drift')
if (artifact.implementationIdentity.fixtureVersion !== SAJU_VALIDATION_FIXTURE_VERSION) fail('fixture version drift')
if (artifact.externalComparison.runnerVerdict !== externalRun.gateStatus.sajuExternalValidationStatus) fail('runner verdict drift')
if (artifact.externalComparison.finalJudgementWhenFullSuiteRuns !== externalRun.finalJudgement) fail('full-suite judgement drift')

for (const entry of artifact.sourceIdentityInventory) {
  const bytes = fs.readFileSync(new URL(`../${entry.path}`, import.meta.url))
  if (sha256(bytes) !== entry.sha256) fail(`source hash drift: ${entry.path}`)
}

const fixtureIds = new Set(SAJU_EXTERNAL_FIXTURES.map((fixture) => fixture.fixtureId))
const artifactFixtureIds = new Set(artifact.externalComparison.fixtures.map((fixture) => fixture.fixtureId))
if (fixtureIds.size !== artifactFixtureIds.size || [...fixtureIds].some((id) => !artifactFixtureIds.has(id))) fail('external fixture identity drift')
if (artifact.counts.traditionalRuleSourceIdentities !== 0) fail('traditional rule source identity must remain unresolved')
if (!artifact.findings.some((finding) => finding.id === 'traditional-rule-edition-missing' && finding.status === 'unresolved_source_identity')) fail('missing traditional-rule gap finding')
if (!artifact.findings.some((finding) => finding.id === 'internal-fixtures-circular' && finding.status === 'confirmed_gap')) fail('missing circular fixture finding')

const readiness = fs.readFileSync(new URL('../docs/saju-final-readiness.md', import.meta.url), 'utf8')
const report = fs.readFileSync(new URL('../docs/saju-external-validation-report.md', import.meta.url), 'utf8')
if (!/externalValidationStatus.*pending/.test(readiness)) fail('readiness document no longer records pending external validation')
if (!/scoped_external_validation_passed/.test(report)) fail('external report no longer records scoped result')
if (!/Tier 2/.test(report)) fail('external report no longer distinguishes Tier 2')

if (errors.length) {
  console.error(errors.map((error) => `FAIL ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({
    status: 'pass',
    verdictToken: artifact.verdictToken,
    head: currentHead,
    checkedSourceFiles: artifact.sourceIdentityInventory.length,
    checkedExternalFixtures: SAJU_EXTERNAL_FIXTURES.length,
    circularInternalFixtures: artifact.counts.internalRegressionOnly,
    unresolvedTraditionalRuleSources: artifact.counts.traditionalRuleSourceIdentities === 0,
  }, null, 2))
}
