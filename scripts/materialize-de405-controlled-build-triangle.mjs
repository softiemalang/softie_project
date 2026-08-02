import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const matrixDir = resolve(process.env.DE405_CONTROLLED_MATRIX_OUTPUT_DIR || 'artifacts/de405-controlled-build-matrix')
const outputJson = resolve(process.env.DE405_TRIANGLE_EVIDENCE_JSON || 'docs/de405-controlled-build-triangle-evidence.json')
const outputMd = resolve(process.env.DE405_TRIANGLE_EVIDENCE_MD || 'docs/de405-controlled-build-triangle-evidence.md')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const hashFile = async path => { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex') }
const identity = async (path, label) => ({ path: label, sizeBytes: (await stat(path)).size, sha256: await hashFile(path) })
const normalizeFlags = flags => flags.map(flag => flag.replace(/^-I.*cspice\/N0067\/include$/, '-I<CSPICE_N0067>/include'))
const appleManifest = await readJson(resolve(matrixDir, 'manifest.json'))
const appleAnalysis = await readJson(resolve(matrixDir, 'analysis.json'))
const linuxPath = resolve(root, 'artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json')
const linux = await readJson(linuxPath)
const materializer = await identity(resolve(root, 'scripts/materialize-de405-controlled-build-triangle.mjs'), 'scripts/materialize-de405-controlled-build-triangle.mjs')
const linuxIdentity = await identity(linuxPath, 'artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json')
const appleVariants = appleManifest.variants.map(variant => ({ id: variant.id, status: variant.status, target: variant.target, compiler: variant.compiler, flags: normalizeFlags(variant.flags), binary: { ...variant.binary, path: `artifacts/de405-controlled-build-matrix/build/${variant.id}/runner` }, output: { ...variant.output, path: `artifacts/de405-controlled-build-matrix/${variant.output.path}` } }))
const blocked = reason => ({ status: 'blocked', classification: 'blocked_linux_arm64_control_unavailable', firstDivergence: null, fullSweep: null, reason })
const evidence = {
  schemaVersion: 1,
  recordType: 'de405_controlled_build_triangle_evidence',
  storageClass: 'repository_provenance_manifest',
  baselineHead: appleManifest.baselineHead,
  finalClassification: 'blocked_linux_arm64_control_unavailable',
  materialization: { generator: materializer, deterministicSerialization: 'JSON.stringify with two-space indentation and final LF', machineSpecificFields: 'normalized out of this artifact', productionActivation: false, productionRoutingChanged: false, toleranceChanged: false },
  commonInput: { sourceIdentities: appleManifest.sourceIdentities, corpusRowCount: 150671, stateComponentCount: 6, inputOrder: 'samples.jsonl order; sampleId and queryEtHex identity checked', wrapper: 'same C integration runner and JSONL writer for Apple matrix; existing Linux evidence retained separately' },
  environments: {
    macosArm64: { status: 'executed', osIdentity: 'darwin-arm64', architecture: 'arm64', execution: 'native host', emulation: false, compilerFamilyControl: appleManifest.compilerFamilyControl, variants: appleVariants, analysis: appleAnalysis },
    linuxArm64: { status: 'blocked', osIdentity: 'linux-arm64', architecture: 'arm64', execution: 'unavailable in current host', emulation: false, availability: { docker: false, podman: false, qemu: false, lima: false, nativeLinux: false }, reason: 'No installed Linux arm64 runtime, container engine, VM, or QEMU executable was available; no installation or external download was performed.' },
    linuxX8664: { status: 'existing_external_execution', osIdentity: 'alpine-linux-3.22.1-musl', architecture: 'x86_64', execution: linux.linuxEnvironment.execution, emulation: true, provenance: { source: linuxIdentity, environment: linux.linuxEnvironment, compilerRuns: linux.compilerRuns, exactness: linux.exactness, mismatchSets: linux.mismatchSets } }
  },
  pairs: {
    linuxArm64VsLinuxX8664: blocked('Linux arm64 control is unavailable, so architecture cannot be isolated under the same Linux image/compiler/libc/runtime.'),
    macosArm64VsLinuxArm64: blocked('Linux arm64 control is unavailable, so OS/environment cannot be isolated while holding arm64 constant.'),
    macosArm64VsExistingLinuxX8664: { status: 'observed_but_mixed', classification: 'no_controlled_difference_observed_prior_provenance_requires_recheck', firstDivergence: null, fullSweep: null, reason: 'Existing Linux x86_64 evidence records a reproducible mismatch, but OS, architecture, compiler family/version, libc, and execution/emulation differ; paired raw state streams for a new first-divergence distribution are not available in that artifact.' }
  },
  unresolvedVariables: ['Linux arm64 execution', 'same Linux image across arm64 and x86_64', 'same compiler family/version on Linux arm64 and x86_64', 'pairwise raw-state first divergence for the existing Apple/Linux-x86_64 record'],
  existingEvidenceClassification: linux.status
}
const markdown = `# DE405 controlled-build triangle evidence\n\n- Final classification: \`${evidence.finalClassification}\`\n- Baseline HEAD: \`${evidence.baselineHead}\`\n- Apple arm64 rows/components: ${evidence.commonInput.corpusRowCount} / ${evidence.commonInput.stateComponentCount}\n- Linux arm64: blocked; no installed Linux arm64 runtime or emulator\n- Linux x86_64: existing Alpine 3.22.1 / musl / QEMU x86_64 evidence\n\n## Pairwise status\n\n- Linux arm64 ↔ Linux x86_64: blocked; architecture effect not isolated.\n- macOS arm64 ↔ Linux arm64: blocked; OS effect at fixed arm64 not isolated.\n- macOS arm64 ↔ existing Linux x86_64: observed but mixed; existing provenance requires recheck.\n\nThe Apple controlled-build variants are persisted by normalized provenance and raw-output hashes under the generated artifact directory. No production route, tolerance, or public contract changed.\n`
await writeFile(outputJson, JSON.stringify(evidence, null, 2) + '\n')
await writeFile(outputMd, markdown)
console.log(JSON.stringify({ status: 'materialized', json: outputJson, markdown: outputMd, finalClassification: evidence.finalClassification }, null, 2))
