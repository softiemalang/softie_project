import { readFile } from 'node:fs/promises'
const path = process.argv[2] || 'docs/de405-cspice-source-equivalence.json'; const v = JSON.parse(await readFile(path, 'utf8'))
if (v.schemaVersion !== 1 || v.recordType !== 'de405-cspice-source-equivalence-bridge') throw new Error('invalid source equivalence bridge schema')
if (v.classification !== 'official_source_de405_runtime_equivalent_ready_for_remote_dispatch') throw new Error(`source equivalence is not ready: ${v.classification}`)
if (v.sourceIdentity?.officialAggregateSha256 !== '6a50a493d82786783f468dfde2e904561d2d1cbb27ffed538137be999f18eb93' || v.sourceIdentity?.historicalLocalAggregateSha256 !== 'b5f541391b8750af347af6b5746e800b566826ba114e481e262b9caa8f8af0a8' || v.sourceIdentity?.officialArchiveSha256 !== '60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce') throw new Error('source identity bridge contract failed')
if (v.host?.platform !== 'darwin' || v.host?.architecture !== 'arm64' || v.host?.sourceOnlyBuild !== true || v.host?.prebuiltLibrariesUsed !== false) throw new Error('controlled source-only Apple arm64 build contract failed')
for (const variant of ['official', 'local']) {
  const build = v.builds?.[variant]
  if (!build?.sourceManifestSha256 || !build.cspiceLibrarySha256 || !build.csupportLibrarySha256 || !build.runnerSha256) throw new Error(`missing ${variant} build provenance`)
}
if (v.runtimeComparison.rows !== 150671 || v.runtimeComparison.components !== 904026 || v.runtimeComparison.differingRows !== 0 || v.runtimeComparison.differingComponents !== 0 || v.runtimeComparison.firstDivergence !== null) throw new Error('runtime equivalence contract failed')
if (!v.rerunByteIdentity.official || !v.rerunByteIdentity.local || new Set(Object.values(v.resultHashes).map(x => x.sha256)).size !== 1) throw new Error('rerun/result byte identity contract failed')
if (v.inputs.samplesSha256 !== '62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84' || v.inputs.spkSha256 !== '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89') throw new Error('input identity contract failed')
console.log(JSON.stringify({ status: 'pass', classification: v.classification, rows: v.runtimeComparison.rows, components: v.runtimeComparison.components, resultSha256: v.resultHashes.official1.sha256 }, null, 2))
