import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
const dir = resolve(process.env.DE405_CONTROLLED_MATRIX_OUTPUT_DIR || 'artifacts/de405-controlled-build-matrix')
const manifest = JSON.parse(await readFile(resolve(dir, 'manifest.json'), 'utf8'))
const analysis = JSON.parse(await readFile(resolve(dir, 'analysis.json'), 'utf8'))
const fail = message => { throw new Error(message) }
const hashFile = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex') }
if (manifest.schemaVersion !== 1 || manifest.recordType !== 'de405_controlled_build_matrix') fail('invalid manifest schema')
if (manifest.baselineHead !== '83220c05e88c9f13a88c6c66502974928125bd9f') fail(`unexpected HEAD: ${manifest.baselineHead}`)
if (manifest.variants.length !== 4 || manifest.variants.some(v => v.status !== 'executed')) fail('matrix incomplete')
if (manifest.host.platform !== 'darwin' || manifest.host.architecture !== 'arm64') fail('unexpected host')
if (!manifest.sourceIdentities.corpus?.sha256 || !manifest.sourceIdentities.kernel?.sha256) fail('missing provenance hashes')
for (const variant of manifest.variants) if (await hashFile(resolve(dir, variant.output.path)) !== variant.output.sha256) fail(`stale output: ${variant.id}`)
if (analysis.matrixCompleteness.executedVariantCount !== 4 || !analysis.matrixCompleteness.identityChecked) fail('analysis completeness failure')
if (analysis.nonArithmeticControls.status !== 'held_constant_and_identity_checked') fail('non-arithmetic controls not checked')
if (!['floating_point_build_semantics_sensitivity_confirmed', 'compiler_effect_not_observed_os_architecture_remains'].includes(analysis.expectedClassification)) fail('unexpected classification')
if (!analysis.comparisons.every(c => c.rowCount === 150671)) fail('full corpus missing')
for (const file of ['manifest.json', 'analysis.json', 'analysis.md']) if (!(await readFile(resolve(dir, file))).length) fail(`empty ${file}`)
console.log(JSON.stringify({ status: 'pass', schema: 'pass', provenance: 'pass', freshness: 'deterministic-output-contract', matrixCompleteness: 'pass', expectedClassification: analysis.expectedClassification }, null, 2))
