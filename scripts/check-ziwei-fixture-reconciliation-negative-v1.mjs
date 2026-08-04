import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { materializeReconciliation } from './materialize-ziwei-fixture-reconciliation-v1.mjs'

const negative = JSON.parse(await readFile(resolve('test/fixtures/ziwei/fixture-reconciliation-negative-v1.json'), 'utf8'))
const artifact = await materializeReconciliation()
const findings = []
const clone = value => JSON.parse(JSON.stringify(value))
for (const item of negative.cases) {
  const mutated = clone(artifact)
  if (item.id === 'internal_as_external') mutated.fixtures[0].fixtureProvenance = { expectationOrigin: 'internal_resolver', regressionOnly: true }
  if (item.id === 'source_version_omitted') mutated.fixtures[0].source.declared.editionOrVersion = null
  if (item.id === 'configuration_hidden') mutated.fixtures[5].classification.primary = 'source_identity_unresolved'
  if (item.id === 'scoped_match_expanded') mutated.fixtures[0].scope.fullChartValidationClaim = true
  if (item.id === 'rule_variant_deleted') mutated.fixtures[0].ruleVariant = null
  if (item.id === 'verified_promoted') mutated.beforeAfter.after.verified = 6
  if (item.id === 'nondeterministic_output') mutated.fixtures.reverse()
  const detects = {
    internal_as_external: mutated.fixtures.every(f => f.fixtureProvenance.expectationOrigin !== 'internal_resolver' && f.fixtureProvenance.regressionOnly === false),
    source_version_omitted: mutated.fixtures.every(f => f.source.declared.editionOrVersion && f.source.identityStatus === 'unresolved'),
    configuration_hidden: mutated.fixtures.filter(f => f.inputConfigurationIdentity.missingRequiredFields.length).every(f => f.classification.primary === 'configuration_mismatch'),
    scoped_match_expanded: mutated.fixtures.every(f => f.scope.fullChartValidationClaim === false),
    rule_variant_deleted: mutated.fixtures.every(f => f.ruleVariant?.status === 'not_detected'),
    verified_promoted: mutated.beforeAfter.after.verified === 0 && mutated.beforeAfter.after.pending === 6,
    nondeterministic_output: mutated.fixtures.map(f => f.fixtureId).join('|') === [...mutated.fixtures].sort((a, b) => a.fixtureId.localeCompare(b.fixtureId)).map(f => f.fixtureId).join('|'),
  }
  if (!detects[item.id]) findings.push(item.id)
}
const result = { pass: findings.length === negative.cases.length, findings, expected: negative.cases.map(item => item.id) }
console.log(JSON.stringify(result, null, 2))
if (!result.pass) process.exitCode = 1
