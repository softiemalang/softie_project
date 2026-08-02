import { readFile } from 'node:fs/promises'
const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
if (!args.input) throw new Error('--input is required')
const v = JSON.parse(await readFile(args.input, 'utf8'))
if (v.schemaVersion !== 1 || v.evidenceKind !== 'de405-linux-architecture-comparison') throw new Error('invalid evidence schema')
const allowed = ['architecture_sensitivity_confirmed_same_linux_environment', 'no_controlled_difference_observed', 'blocked_reproducible_linux_userspace_unavailable']
if (!allowed.includes(v.classification)) throw new Error(`unexpected classification: ${v.classification}`)
for (const key of ['sampleCount', 'differingRows', 'differingComponents', 'distribution', 'controls', 'provenance', 'provenanceHashes']) if (!(key in v)) throw new Error(`missing ${key}`)
if ((v.fixture ? v.sampleCount < 2 : v.sampleCount !== 150671) || v.differingRows < 0 || v.differingComponents < 0) throw new Error('invalid counts')
if (!Array.isArray(v.controls.mismatched)) throw new Error('invalid control record')
if (v.classification === 'architecture_sensitivity_confirmed_same_linux_environment' && v.controls.mismatched.length) throw new Error('sensitivity cannot be claimed with mixed controls')
for (const key of ['maxUlp', 'p50Ulp', 'p95Ulp', 'p99Ulp', 'p999Ulp', 'maxAbsoluteDifference', 'p50AbsoluteDifference', 'p95AbsoluteDifference', 'p99AbsoluteDifference', 'p999AbsoluteDifference']) if (!(key in v.distribution)) throw new Error(`missing distribution.${key}`)
for (const arch of ['x64', 'arm64']) {
  const p = v.provenance[arch]
  if (p?.architecture !== arch || !p?.sampleAsset?.archiveSha256 || !p?.officialInputs?.cspiceArchiveSha256 || !p?.officialInputs?.spkSha256 || !p?.officialInputs?.sourceManifestSha256 || !p?.host?.imageOS || !p?.host?.imageVersion || !p?.host?.uname || !p?.host?.machine || !p?.userspace?.osRelease || !p?.userspace?.libc || !p?.userspace?.compiler || !p?.userspace?.compilerVersion || !p?.userspace?.compilerTarget || !p?.userspace?.node || !p?.cspiceBuild?.compiler || !p?.cspiceBuild?.compilerVersion || !Array.isArray(p?.cspiceBuild?.flags) || !p?.cspiceBuild?.sourceManifestSha256 || !Array.isArray(p?.controls?.flags) || !p?.controls?.locale || !p?.controls?.timezone || !p?.controls?.wrapper || !p?.controls?.serialization || !p?.controls?.sourceHashes || !p?.controls?.artifactHashes || !('used' in (p?.container || {}))) throw new Error(`incomplete ${arch} provenance`)
}
console.log(`ok: ${v.classification}`)
