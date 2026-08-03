import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { attachArtifactIdentity, buildArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'

const root = process.cwd()
const baseHead = 'acb1af9f7ad393cea23d8d9949660c9bcfe37beb'
const specs = [
  ['artifacts/saju-claim-provenance-v0.json', 'saju-claim-provenance-v0', 'scripts/materialize-saju-claim-provenance-v0.mjs', ['src/interpretationPrep/fixtures/sajuValidationFixtures.js', 'src/saju/engine/externalValidationFixtures.js', 'src/interpretationPrep/prepare.js']],
  ['artifacts/saju-readiness-grounding-v0.json', 'saju-readiness-grounding-v0', 'scripts/materialize-saju-readiness-grounding-v0.mjs', ['artifacts/saju-claim-provenance-v0.json', 'src/interpretationPrep/sajuReadinessGrounding.js']],
  ['artifacts/saju-acceptance-review-v0.json', 'saju-acceptance-review-v0', 'scripts/review-saju-acceptance-v0.mjs', ['artifacts/saju-claim-provenance-v0.json', 'artifacts/saju-readiness-grounding-v0.json', 'test/fixtures/saju-acceptance-review-negative-v0.json']],
]

for (const [path, artifactId, materializerPath, inputs] of specs) {
  const legacy = JSON.parse(execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
  const migrated = attachArtifactIdentity(legacy, buildArtifactIdentity({ root, artifactId, materializerPath, materializerVersion: '1.1.0', baseHead, inputs }))
  const text = path.endsWith('saju-claim-provenance-v0.json') ? JSON.stringify(migrated, null, 2)
    : path.endsWith('saju-acceptance-review-v0.json') ? `${JSON.stringify(JSON.parse(canonicalIdentityJson(migrated)))}\n`.trimEnd()
      : JSON.stringify(migrated)
  writeFileSync(path, `${text}\n`)
  console.log(JSON.stringify({ path, artifactId, baseHead, artifactPayloadSha256: migrated.artifactIdentity.artifactPayloadSha256 }))
}
