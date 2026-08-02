import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const jsonPath = resolve(process.env.DE405_TRIANGLE_EVIDENCE_JSON || 'docs/de405-controlled-build-triangle-evidence.json')
const mdPath = resolve(process.env.DE405_TRIANGLE_EVIDENCE_MD || 'docs/de405-controlled-build-triangle-evidence.md')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const hashFile = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex') }
const fail = message => { throw new Error(message) }
const evidence = await readJson(jsonPath)
const markdown = await readFile(mdPath, 'utf8')
const expectedHead = '83220c05e88c9f13a88c6c66502974928125bd9f'
if (evidence.schemaVersion !== 1 || evidence.recordType !== 'de405_controlled_build_triangle_evidence') fail('invalid triangle schema')
if (evidence.baselineHead !== expectedHead) fail('unexpected baseline HEAD')
if (evidence.finalClassification !== 'blocked_linux_arm64_control_unavailable') fail('unexpected final classification')
if (evidence.environments.macosArm64.status !== 'executed' || evidence.environments.linuxArm64.status !== 'blocked' || evidence.environments.linuxX8664.status !== 'existing_external_execution') fail('environment matrix incomplete')
if (evidence.environments.macosArm64.variants.length !== 4 || evidence.commonInput.corpusRowCount !== 150671 || evidence.commonInput.stateComponentCount !== 6) fail('Apple matrix completeness failure')
if (evidence.pairs.linuxArm64VsLinuxX8664.status !== 'blocked' || evidence.pairs.macosArm64VsLinuxArm64.status !== 'blocked' || evidence.pairs.macosArm64VsExistingLinuxX8664.status !== 'observed_but_mixed') fail('pairwise classification failure')
if (!evidence.environments.linuxArm64.availability || Object.values(evidence.environments.linuxArm64.availability).some(Boolean)) fail('Linux arm64 availability evidence is not blocked')
const sourcePaths = { integration: 'tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c', candidate: 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c', corpus: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', kernel: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp', cspiceArchive: '/Users/softie/.local/share/softie-de405/cspice/N0067/lib/cspice.a', csupportArchive: '/Users/softie/.local/share/softie-de405/cspice/N0067/lib/csupport.a' }
for (const [key, relative] of Object.entries(sourcePaths)) {
  const path = relative.startsWith('/') ? relative : resolve(root, relative)
  if (await hashFile(path) !== evidence.commonInput.sourceIdentities[key].sha256) fail(`source hash mismatch: ${key}`)
}
const materializerPath = resolve(root, 'scripts/materialize-de405-controlled-build-triangle.mjs')
if (await hashFile(materializerPath) !== evidence.materialization.generator.sha256) fail('materializer freshness mismatch')
const linuxPath = resolve(root, 'artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json')
if (await hashFile(linuxPath) !== evidence.environments.linuxX8664.provenance.source.sha256) fail('Linux provenance hash mismatch')
for (const variant of evidence.environments.macosArm64.variants) {
  if (await hashFile(resolve(root, variant.output.path)) !== variant.output.sha256) fail(`Apple output hash mismatch: ${variant.id}`)
  if (await hashFile(resolve(root, variant.binary.path)) !== variant.binary.sha256) fail(`Apple binary hash mismatch: ${variant.id}`)
}
const forbidden = /(?:\/Users\/|\/private\/tmp\/|generatedAt|timestamp|hostname)/
if (forbidden.test(await readFile(jsonPath, 'utf8')) || forbidden.test(markdown)) fail('machine-specific path/time leaked into persistent evidence')
if (!markdown.includes(`Final classification: \`${evidence.finalClassification}\``) || !markdown.includes(String(evidence.commonInput.corpusRowCount)) || !markdown.includes('Linux arm64 ↔ Linux x86_64: blocked')) fail('documentation does not match evidence')
console.log(JSON.stringify({ status: 'pass', schema: 'pass', provenance: 'pass', hashes: 'pass', freshness: 'pass', matrixCompleteness: 'pass', pairwiseClassification: 'pass', documentation: 'pass', finalClassification: evidence.finalClassification }, null, 2))
