import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
for (const key of ['root', 'manifest', 'remote-record', 'summary', 'remote-summary', 'local-summary', 'expected-head']) if (!args[key]) throw new Error(`--${key} is required`)
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const hashFile = async path => { const h = createHash('sha256'); for await (const chunk of createReadStream(path)) h.update(chunk); return h.digest('hex') }
const fail = message => { throw new Error(message) }
const root = args.root; const manifest = await readJson(args.manifest); const remote = await readJson(args['remote-record']); const summary = await readJson(args.summary); const remoteSummary = await readJson(args['remote-summary']); const localSummary = await readJson(args['local-summary'])
if (remote.runId !== '30768814210' || remote.execution.head !== args['expected-head'] || remote.execution.ref !== 'refs/heads/main' || remote.execution.workflow !== '.github/workflows/de405-legacy-native-matrix.yml') fail('remote execution identity mismatch')
if (Object.values(remote.jobs).some(status => status !== 'success')) fail('remote job failure recorded')
if (remote.sampleAsset.archiveBytes !== 280781846 || remote.sampleAsset.archiveSha256 !== '5fb3f6f7c5a7b20f9081d1f16a6f000c00df8594c88606344a9c8d833b9aa1c8') fail('sample asset identity mismatch')
if (remote.setupImage.id !== 'sha256:f36bd95fad46641a2c723bdcc8f3cce1fe46f0cebe62eda28fb95952312c78c6' || remote.setupImage.archiveSha256 !== '6447e903512b19f19cc05f37e351051581dfe17737d4e117339a3d951c998e45' || remote.setupImage.retentionDays !== 14) fail('Alpine setup image identity mismatch')
const rawById = new Map()
for (const variant of manifest.variants) {
  const path = `${root}/${variant.output.path}`; const provenance = await readJson(`${root}/${variant.provenance.path}`); const bytes = await stat(path); const sha256 = await hashFile(path); let rows = 0; let crlf = false; let finalByte = 0
  const input = createReadStream(path); input.on('data', chunk => { finalByte = chunk.at(-1) })
  const lines = createInterface({ input, crlfDelay: Infinity }); for await (const line of lines) { rows++; if (line.includes('\r')) crlf = true }
  if (rows !== 150671 || crlf || finalByte !== 10) fail(`raw serialization mismatch: ${variant.id}`)
  if (sha256 !== remote.variants[variant.id].resultSha256 || sha256 !== '07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b') fail(`raw result hash mismatch: ${variant.id}`)
  if (provenance.expectedHead !== args['expected-head'] || provenance.githubRef !== remote.execution.ref || provenance.workflowIdentity !== remote.execution.workflow) fail(`provenance execution mismatch: ${variant.id}`)
  if (provenance.officialInputs.spkSha256 !== '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89' || provenance.officialInputs.cspiceArchiveSha256 !== '60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce') fail(`official input mismatch: ${variant.id}`)
  if (variant.id.startsWith('alpine-') && (!provenance.userspace.toolchain?.image?.id || !provenance.userspace.toolchain?.image?.archiveSha256 || provenance.userspace.toolchain.packages?.musl !== '1.2.5-r12' || provenance.userspace.toolchain.packages?.binutils !== '2.44-r3' || provenance.userspace.toolchain.packages?.gcc !== '14.2.0-r6' || provenance.userspace.toolchain.packages?.clang20 !== '20.1.8-r0' || provenance.userspace.toolchain.packages?.nodejs !== '22.23.2-r0')) fail(`Alpine toolchain mismatch: ${variant.id}`)
  rawById.set(variant.id, {path, provenance, sha256})
}
if (summary.classification !== 'canonical_v2_cross_environment_bitwise_identity_established' || summary.execution.head !== args['expected-head'] || summary.corpus.rowCount !== 150671 || summary.corpus.componentCount !== 904026 || summary.variants.length !== 3 || summary.pairwise.length !== 3) fail('tracked summary contract mismatch')
for (const pair of summary.pairwise) if (pair.differingRows !== 0 || pair.differingComponents !== 0 || pair.firstDivergence !== null || Object.values(pair.ulp).some(Boolean) || Object.values(pair.absolute).some(Boolean)) fail('pairwise identity contract mismatch')
if (await hashFile(args['remote-summary']) !== remote.summaryHashes.remoteSummarySha256 || await hashFile(args['local-summary']) !== remote.summaryHashes.localReanalysisSummarySha256 || JSON.stringify(remoteSummary) !== JSON.stringify(localSummary)) fail('remote/local summary mismatch')
if (remote.rawArtifacts.tracked !== false || summary.rawArtifacts.tracked !== false) fail('raw artifact tracking contract mismatch')
const forbidden = /(?:\/Users\/|\/private\/tmp\/|generatedAt|timestamp|hostname)/
if (forbidden.test(await readFile(args.summary, 'utf8')) || forbidden.test(await readFile(args['remote-record'], 'utf8'))) fail('machine-specific path/time leaked into tracked evidence')
console.log(JSON.stringify({ status: 'pass', integrity: 'pass', rawVariants: rawById.size, rows: 150671, components: 904026, classification: summary.classification, remoteLocalSummaryByteIdentical: true }, null, 2))
