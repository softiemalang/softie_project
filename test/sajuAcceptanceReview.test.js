import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const provenance = JSON.parse(fs.readFileSync('artifacts/saju-claim-provenance-v0.json', 'utf8'))
const grounding = JSON.parse(fs.readFileSync('artifacts/saju-readiness-grounding-v0.json', 'utf8'))
const positive = JSON.parse(fs.readFileSync('test/fixtures/saju-acceptance-review-positive-v0.json', 'utf8'))

test('positive fixture contracts preserve occurrence identity and claim gates', () => {
  assert.equal(provenance.claimCount, positive.claimCount)
  assert.equal(provenance.claims.reduce((sum, claim) => sum + claim.occurrenceCount, 0), positive.occurrenceCount)
  assert.equal(new Set(provenance.claims.flatMap(claim => claim.occurrences.map(occurrence => occurrence.occurrenceId))).size, positive.uniqueOccurrenceCount)
  assert.equal(provenance.claims.every(claim => claim.claimTextContract === positive.claimTextContract && claim.rawText.isVerifiedFact === false), true)
  assert.equal(grounding.readiness.claims.every(claim => claim.conversationGate && claim.conversationGate.rawTextConsumption.isVerifiedFact === false), true)
  assert.equal(grounding.bundle.claimRefs.every(ref => ref.conversationGate && ref.conversationGate.blockedOrUnsupportedReason.length > 0), true)
})

test('independent saju acceptance review artifact is deterministic and bounded', () => {
  const output = execFileSync(process.execPath, ['scripts/check-saju-acceptance-review-v0.mjs'], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.basisHead, 'acb1af9f7ad393cea23d8d9949660c9bcfe37beb')
  assert.deepEqual(result.distribution, { accepted: 10, accepted_with_declared_limit: 4, gap: 0, violation: 0, not_applicable: 0 })
  assert.equal(result.negativeCases, 12)
  const first = fs.readFileSync('artifacts/saju-acceptance-review-v0.json', 'utf8')
  execFileSync(process.execPath, ['scripts/review-saju-acceptance-v0.mjs'], { encoding: 'utf8' })
  const second = fs.readFileSync('artifacts/saju-acceptance-review-v0.json', 'utf8')
  assert.equal(first, second)
})
