import fs from 'node:fs'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { materializeSajuClaimProvenance, canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { execFileSync } from 'node:child_process'

const root = new URL('../', import.meta.url)
const fixtureEntries = sajuValidationFixtures
  .filter((fixture) => !fixture.expectedError)
  .map((fixture) => ({ contextId: fixture.id, result: prepareInterpretationData(fixture.input) }))
if (fixtureEntries.length === 0) throw new Error('no valid representative saju fixture')
const payload = materializeSajuClaimProvenance({
  results: fixtureEntries,
  internalFixtures: sajuValidationFixtures,
  externalFixtures: SAJU_EXTERNAL_FIXTURES,
})
const rootPath = new URL('../', import.meta.url).pathname
const artifact = attachArtifactIdentity(payload, buildArtifactIdentity({
  root: rootPath,
  artifactId: 'saju-claim-provenance-v0',
  materializerPath: 'scripts/materialize-saju-claim-provenance-v0.mjs',
  materializerVersion: '1.1.0',
  baseHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: rootPath, encoding: 'utf8' }).trim(),
  inputs: ['src/interpretationPrep/fixtures/sajuValidationFixtures.js', 'src/saju/engine/externalValidationFixtures.js', 'src/interpretationPrep/prepare.js'],
}))
const outputPath = new URL('../artifacts/saju-claim-provenance-v0.json', import.meta.url)
fs.writeFileSync(outputPath, canonicalJson(artifact))
console.log(JSON.stringify({
  status: 'materialized',
  output: new URL(outputPath).pathname.replace(new URL(root).pathname, ''),
  claimCount: artifact.claimCount,
  contentSha256: artifact.contentSha256,
  artifactByteSha256: artifact.artifactByteSha256,
}, null, 2))
