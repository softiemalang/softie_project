import fs from 'node:fs'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { materializeSajuClaimProvenance, canonicalJson } from '../src/interpretationPrep/sajuClaimProvenance.js'

const root = new URL('../', import.meta.url)
const fixtureEntries = sajuValidationFixtures
  .filter((fixture) => !fixture.expectedError)
  .map((fixture) => ({ contextId: fixture.id, result: prepareInterpretationData(fixture.input) }))
if (fixtureEntries.length === 0) throw new Error('no valid representative saju fixture')
const artifact = materializeSajuClaimProvenance({
  results: fixtureEntries,
  internalFixtures: sajuValidationFixtures,
  externalFixtures: SAJU_EXTERNAL_FIXTURES,
})
const outputPath = new URL('../artifacts/saju-claim-provenance-v0.json', import.meta.url)
fs.writeFileSync(outputPath, canonicalJson(artifact))
console.log(JSON.stringify({
  status: 'materialized',
  output: new URL(outputPath).pathname.replace(new URL(root).pathname, ''),
  claimCount: artifact.claimCount,
  contentSha256: artifact.contentSha256,
  artifactByteSha256: artifact.artifactByteSha256,
}, null, 2))
