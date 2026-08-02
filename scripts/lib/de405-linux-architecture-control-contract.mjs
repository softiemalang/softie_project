export const CONTROL_CONTRACT_VERSION = 'de405-linux-architecture-controls-v2'

// These fields are direct arithmetic inputs or identify the exact bytes fed to
// the runner. They must match between architectures for a semantic comparison.
export const REQUIRED_IDENTICAL_FIELDS = [
  'expectedHead', 'githubRef', 'workflowIdentity',
  'sampleAsset.archiveSha256', 'sampleAsset.urlSha256',
  'officialInputs.cspiceArchiveSha256', 'officialInputs.spkSha256',
  'officialInputs.sourceManifestSha256', 'officialInputs.cspiceUrlSha256',
  'officialInputs.spkUrlSha256',
  'userspace.family', 'userspace.osRelease', 'userspace.libc',
  'userspace.compiler', 'userspace.compilerVersion', 'userspace.node',
  'cspiceBuild.compiler', 'cspiceBuild.compilerVersion', 'cspiceBuild.flags',
  'cspiceBuild.sourceManifestSha256',
  'controls.flags', 'controls.locale', 'controls.timezone',
  'controls.wrapper', 'controls.serialization', 'controls.sourceHashes',
  'container.used', 'container.image',
  'result.rowCount', 'result.sha256', 'result.lineEnding'
]

// These fields are expected to differ when the architecture changes. Their
// role is architecture selection/target identity, not a cross-architecture
// arithmetic control.
export const ARCHITECTURE_FIELDS = [
  'architecture', 'runnerLabel', 'officialInputs.arm64SourcePort',
  'host.machine', 'userspace.compilerTarget',
  'cspiceBuild.compilerTarget', 'cspiceBuild.architecture',
  'cspiceBuild.libraries.cspice.sha256',
  'cspiceBuild.libraries.csupport.sha256',
  'controls.artifactHashes.cspiceLibrary',
  'controls.artifactHashes.csupportLibrary'
]

// These identify the hosting image and kernel. They are retained for audit
// provenance but do not block a semantic result when the userspace contract
// above matches.
export const OBSERVATIONAL_FIELDS = [
  'host.imageOS', 'host.imageVersion', 'host.uname'
]

export const SEMANTIC_FINGERPRINT_FIELDS = [
  'userspace.osRelease', 'userspace.libc', 'userspace.compiler',
  'userspace.compilerVersion', 'userspace.node', 'controls.flags',
  'controls.locale', 'controls.timezone', 'controls.wrapper',
  'controls.serialization', 'controls.sourceHashes',
  'officialInputs.cspiceArchiveSha256', 'officialInputs.spkSha256',
  'officialInputs.sourceManifestSha256', 'result.rowCount', 'result.sha256'
]

export const FUTURE_FINGERPRINT_HARDENING = [
  'binutils package/version and ld --version',
  'linker identity and link flags',
  'libc package name/version/architecture (not only ldd banner)',
  'kernel and CPU feature policy if future results exercise them'
]

export const getPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value)
export const equalValue = (left, right) => JSON.stringify(left) === JSON.stringify(right)

export function compareControls(x64, arm64) {
  const mismatchedRequired = REQUIRED_IDENTICAL_FIELDS.filter(key => !equalValue(getPath(x64, key), getPath(arm64, key)))
  const differingArchitecture = ARCHITECTURE_FIELDS.filter(key => !equalValue(getPath(x64, key), getPath(arm64, key)))
  const differingObservational = OBSERVATIONAL_FIELDS.filter(key => !equalValue(getPath(x64, key), getPath(arm64, key)))
  const missingSemantic = SEMANTIC_FINGERPRINT_FIELDS.filter(key => getPath(x64, key) == null || getPath(arm64, key) == null)
  return { mismatchedRequired, differingArchitecture, differingObservational, missingSemantic }
}

export const taxonomy = {
  requiredIdentical: REQUIRED_IDENTICAL_FIELDS,
  architectureSpecific: ARCHITECTURE_FIELDS,
  observationalNonBlocking: OBSERVATIONAL_FIELDS,
  rationale: {
    requiredIdentical: 'direct arithmetic inputs, byte identities, runtime controls, and output identity',
    architectureSpecific: 'architecture selection, compiler target, or architecture-specific compiled artifact identity',
    observationalNonBlocking: 'hosting image/kernel provenance that records execution context without defining the userspace arithmetic contract'
  },
  semanticFingerprint: SEMANTIC_FINGERPRINT_FIELDS,
  futureHardening: FUTURE_FINGERPRINT_HARDENING
}
