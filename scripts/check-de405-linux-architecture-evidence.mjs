import { readFile } from 'node:fs/promises'
import { CONTROL_CONTRACT_VERSION, ARCHITECTURE_FIELDS, OBSERVATIONAL_FIELDS, REQUIRED_IDENTICAL_FIELDS, SEMANTIC_FINGERPRINT_FIELDS } from './lib/de405-linux-architecture-control-contract.mjs'
const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
if (!args.input) throw new Error('--input is required')
const v = JSON.parse(await readFile(args.input, 'utf8'))
if (v.schemaVersion !== 2 || v.evidenceKind !== 'de405-linux-architecture-comparison' || v.controlContractVersion !== CONTROL_CONTRACT_VERSION) throw new Error('invalid evidence schema or control contract')
const allowed = ['no_architecture_effect_observed_semantically_matched_linux_userspace', 'architecture_effect_observed_semantically_matched_linux_userspace', 'blocked_semantic_userspace_fingerprint_incomplete', 'blocked_required_userspace_control_mismatch']
if (!allowed.includes(v.classification)) throw new Error(`unexpected classification: ${v.classification}`)
for (const key of ['sampleCount', 'componentCount', 'differingRows', 'differingComponents', 'distribution', 'controls', 'provenance', 'provenanceHashes']) if (!(key in v)) throw new Error(`missing ${key}`)
if ((v.fixture ? v.sampleCount < 2 : v.sampleCount !== 150671) || v.componentCount !== v.sampleCount * 6 || v.differingRows < 0 || v.differingComponents < 0) throw new Error('invalid counts')
for (const key of ['mismatchedRequired', 'missingSemantic', 'differingArchitecture', 'differingObservational']) if (!Array.isArray(v.controls[key])) throw new Error(`invalid control record: ${key}`)
if (v.controls.differingArchitecture.some(key => !ARCHITECTURE_FIELDS.includes(key))) throw new Error('unclassified architecture field')
if (v.controls.differingObservational.some(key => !OBSERVATIONAL_FIELDS.includes(key))) throw new Error('unclassified observational field')
if (v.classification === 'no_architecture_effect_observed_semantically_matched_linux_userspace' && (v.controls.mismatchedRequired.length || v.controls.missingSemantic.length || v.differingRows || v.differingComponents)) throw new Error('no-effect claim has blocking mismatch or numeric difference')
if (v.classification === 'architecture_effect_observed_semantically_matched_linux_userspace' && (v.controls.mismatchedRequired.length || v.controls.missingSemantic.length || !v.differingRows)) throw new Error('architecture-effect claim lacks semantic controls or numeric difference')
if (v.classification === 'blocked_semantic_userspace_fingerprint_incomplete' && !v.controls.missingSemantic.length) throw new Error('semantic block lacks missing fingerprint fields')
if (v.classification === 'blocked_required_userspace_control_mismatch' && !v.controls.mismatchedRequired.length) throw new Error('required-control block lacks mismatch')
for (const key of ['maxUlp', 'p50Ulp', 'p95Ulp', 'p99Ulp', 'p999Ulp', 'maxAbsoluteDifference', 'p50AbsoluteDifference', 'p95AbsoluteDifference', 'p99AbsoluteDifference', 'p999AbsoluteDifference']) if (!(key in v.distribution)) throw new Error(`missing distribution.${key}`)
for (const arch of ['x64', 'arm64']) {
  const p = v.provenance[arch]
  if (p?.architecture !== arch || !p?.sampleAsset?.archiveSha256 || !p?.officialInputs?.cspiceArchiveSha256 || !p?.officialInputs?.spkSha256 || !p?.officialInputs?.sourceManifestSha256 || !p?.host?.imageOS || !p?.host?.imageVersion || !p?.host?.uname || !p?.host?.machine || !p?.userspace?.osRelease || !p?.userspace?.libc || !p?.userspace?.compiler || !p?.userspace?.compilerVersion || !p?.userspace?.compilerTarget || !p?.userspace?.node || !p?.cspiceBuild?.compiler || !p?.cspiceBuild?.compilerVersion || !Array.isArray(p?.cspiceBuild?.flags) || !p?.cspiceBuild?.sourceManifestSha256 || !Array.isArray(p?.controls?.flags) || !p?.controls?.locale || !p?.controls?.timezone || !p?.controls?.wrapper || !p?.controls?.serialization || !p?.controls?.sourceHashes || !p?.controls?.artifactHashes || !('used' in (p?.container || {}))) throw new Error(`incomplete ${arch} provenance`)
}
if (REQUIRED_IDENTICAL_FIELDS.length !== 31 || SEMANTIC_FINGERPRINT_FIELDS.length !== 16) throw new Error('unexpected control taxonomy shape')
console.log(`ok: ${v.classification}`)
