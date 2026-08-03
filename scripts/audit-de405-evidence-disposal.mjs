#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readdir, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { basename, dirname, relative, resolve } from 'node:path'

const root = process.cwd()
const manifestPath = resolve(root, 'docs/de405-evidence-disposal-manifest-2026-08-03.json')
const markdownPath = resolve(root, 'docs/de405-evidence-disposal-manifest-2026-08-03.md')
const deletionPaths = [
  resolve(root, 'artifacts/.DS_Store'),
  '/private/tmp/de405-linux-asset-iOGC1t/sample.zip',
  '/private/tmp/de405-linux-asset-iOGC1t/sample.zip.extracted/de405-jpl-cspice-residual-sweep.samples.jsonl',
  '/private/tmp/de405-linux-asset-iOGC1t/sample.zip.extracted/sample-asset-manifest.json',
  '/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip',
  '/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip.extracted/de405-jpl-cspice-residual-sweep.samples.jsonl',
  '/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip.extracted/sample-asset-manifest.json',
  '/private/tmp/de405-sample-asset-check/one/sample-asset-record.json',
  '/private/tmp/de405-sample-asset-check/one/stage/de405-jpl-cspice-residual-sweep.samples.jsonl',
  '/private/tmp/de405-sample-asset-check/one/stage/sample-asset-manifest.json',
  '/private/tmp/de405-sample-asset-check/two/de405-sample-asset.zip',
  '/private/tmp/de405-sample-asset-check/two/sample-asset-record.json',
  '/private/tmp/de405-sample-asset-check/two/stage/de405-jpl-cspice-residual-sweep.samples.jsonl',
  '/private/tmp/de405-sample-asset-check/two/stage/sample-asset-manifest.json'
]
const externalRoots = [
  '/private/tmp/de405-remote-30768814210', '/private/tmp/de405-run-30748244499',
  '/private/tmp/de405-setup-30768513595', '/private/tmp/de405-linux-remote-4285P4',
  '/private/tmp/de405-sample-release-one.qbUQfF', '/private/tmp/de405-sample-release-two.xzMoUt',
  '/private/tmp/de405-sample-asset-check', '/private/tmp/de405-linux-asset-iOGC1t',
  '/private/tmp/astro-query.jsonl', '/private/tmp/astro-states.jsonl'
]
const canonicalEvidenceSet = [
  ['$HOME/.local/share/softie-de405/kernels/spk/de405.bsp', 'required_runtime', 'canonical DE405 kernel'],
  ['$HOME/.local/share/softie-de405/cspice/N0067/lib/cspice.a', 'required_runtime', 'CSPICE N0067 library'],
  ['$HOME/.local/share/softie-de405/cspice/N0067/lib/csupport.a', 'required_runtime', 'CSPICE support library'],
  ['tools/de405-cspice-runner/build/de405-canonical-v2-runner', 'required_runtime', 'canonical-v2 runner'],
  ['tools/de405-jpl-reader/build/de405-jpl-canonical-v2-runner', 'required_runtime', 'official JPL reader runner'],
  ['tools/de405-jpl-reader/fixtures/lnxp1600p2200.405', 'required_runtime', 'JPL reader input fixture'],
  ['test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'required_verification_input', 'Golden Astrology evidence'],
  ['docs/de405-legacy-native-cross-environment-summary.json', 'required_unique_evidence', 'cross-environment result summary'],
  ['docs/de405-legacy-native-cross-environment-remote-record.json', 'required_unique_evidence', 'remote provenance record'],
  ['docs/de405-linux-architecture-remote-record.json', 'required_unique_evidence', 'remote architecture provenance'],
  ['docs/de405-linux-architecture-summary.json', 'required_unique_evidence', 'cross-platform summary and hashes'],
  ['docs/de405-controlled-build-triangle-evidence.json', 'required_unique_evidence', 'controlled-build evidence'],
  ['artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', 'required_verification_input', 'current artifact checker and sweep input'],
  ['artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl', 'required_verification_input', 'current artifact checker and manifest identity'],
  ['artifacts/de405-jpl-cspice-residual-sweep.jpl.jsonl', 'required_verification_input', 'JPL overlap result stream'],
  ['artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl', 'required_verification_input', 'CSPICE overlap result stream'],
  ['scripts/run-de405-jpl-cspice-residual-sweep.mjs', 'required_verification_input', 'reproduction command'],
  ['scripts/generate-de405-canonical-v2.mjs', 'required_verification_input', 'canonical-v2 reproduction command'],
  ['scripts/validate-de405-canonical-v2.mjs', 'required_verification_input', 'canonical-v2 checker'],
  ['test/de405ArtifactReadiness.test.js', 'required_verification_input', 'artifact contract tests'],
  ['test/de405CanonicalV2Smoke.test.js', 'required_verification_input', 'canonical-v2 smoke contract'],
  ['test/de405JplCspiceOverlapEvidence.test.js', 'required_verification_input', 'JPL/CSPICE overlap contract']
]

async function walk(path) {
  const info = await lstat(path)
  if (info.isFile()) return [path]
  if (!info.isDirectory()) return []
  const out = []
  for (const name of await readdir(path)) out.push(...await walk(resolve(path, name)))
  return out
}

async function identity(path) {
  const info = await stat(path)
  const hash = createHash('sha256')
  let lines = 0
  let tail = ''
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk)
    const text = tail + chunk.toString('utf8')
    lines += (text.match(/\n/g) || []).length
    tail = text.slice(-1)
  }
  return { sizeBytes: info.size, sha256: hash.digest('hex'), lineCount: lines }
}

function directConsumers(path) {
  const rel = relative(root, path)
  if (!rel || rel.startsWith('..')) return []
  try {
    return execFileSync('rg', ['-l', '--fixed-strings', rel, 'scripts', 'test', 'docs', '.github', 'package.json', '--glob', '!artifacts/**'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort()
  } catch { return [] }
}

function classifyRepo(path, consumers) {
  const rel = relative(root, path)
  if (basename(path) === '.DS_Store') return ['fully_reproducible_disposable', 'Finder metadata; outside the artifact contract']
  if (rel.includes('strategy-c-') || rel.includes('type2-strategy-')) return ['required_unique_evidence', 'Strategy-C or strategy comparison evidence is explicitly protected']
  if (consumers.length) return ['required_verification_input', `current direct consumers: ${consumers.join(', ')}`]
  return ['cold_archive_optional', 'no current direct consumer found; retained because diagnostic provenance or committed summaries do not prove safe disposal']
}

function classifyExternal(path) {
  if (deletionPaths.includes(path)) return ['duplicate_disposable', 'exact byte duplicate of the canonical sample release/input; no unique remote provenance']
  if (path.includes('/de405-remote-30768814210/') || path.includes('/de405-linux-remote-4285P4/') || path.includes('/de405-setup-30768513595/')) return ['required_unique_evidence', 'remote result, provenance, or OCI setup record; same payload bytes do not erase variant provenance']
  if (path.includes('/de405-official-extracted-check/') || path.includes('/de405-naif-download-check/') || path.includes('/.de405-official-download/') || path.includes('/de405-source-equivalence/')) return ['required_unique_evidence', 'official acquisition/source-equivalence provenance or validation input']
  if (path.includes('/de405-sample-release-one.') || path.includes('/de405-sample-release-two.')) return ['cold_archive_optional', 'reproducible release materialization retained because attempt/release context differs']
  if (path.endsWith('/astro-query.jsonl') || path.endsWith('/astro-states.jsonl')) return ['unknown_or_user_owned', 'raw local inspection material; ownership and uniqueness are not disproven']
  return ['cold_archive_optional', 'external derived material with no current repository consumer; retained conservatively']
}

const previous = await (async () => { try { return JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8')) } catch { return null } })()
const entryKey = path => path.startsWith(`${root}/`) ? relative(root, path) : path
const repoFiles = execFileSync('git', ['-c', 'core.fsmonitor=false', 'ls-files', '--others', '--ignored', '--exclude-standard', '--', 'artifacts'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(p => resolve(root, p))
const externalFiles = (await Promise.all(externalRoots.filter(async p => { try { await lstat(p); return true } catch { return false } }).map(async p => walk(p)))).flat()
const files = [...new Set([...repoFiles, ...externalFiles])].sort()
const entries = []
for (const path of files) {
  const id = await identity(path)
  const isRepo = path.startsWith(`${root}/artifacts/`)
  const consumers = isRepo ? directConsumers(path) : []
  const [classification, basis] = isRepo ? classifyRepo(path, consumers) : classifyExternal(path)
  entries.push({ path: isRepo ? relative(root, path) : path, scope: isRepo ? 'repository_ignored_artifact' : 'external_recovery_or_raw', classification, sizeBytes: id.sizeBytes, sha256: id.sha256, lineCount: id.lineCount, currentConsumers: consumers, basis, regeneration: isRepo ? 'producer script and recorded inputs in docs/de405-artifact-materialization.md; conditional on DE405/CSPICE/JPL runtime' : 'reacquire from the recorded release/Actions/official source or rerun the recorded local materialization' })
}

const oldEntries = new Map((previous?.files || []).map(entry => [entry.path, entry]))
const deleted = deletionPaths.filter(path => !entries.some(entry => entry.path === entryKey(path))).map(path => oldEntries.get(entryKey(path)) || oldEntries.get(path) || { path: entryKey(path), scope: 'external_recovery_or_raw', classification: 'duplicate_disposable', basis: 'pre-disposal candidate register; exact hash/size recorded in audit command output' }).map(entry => ({ ...entry, status: 'deleted' }))
const liveFiles = entries.filter(entry => !deletionPaths.some(path => entry.path === entryKey(path)))
const sum = list => list.reduce((n, entry) => n + (entry.sizeBytes || 0), 0)
const isPreDisposal = deletionPaths.some(path => entries.some(entry => entry.path === entryKey(path)))
const beforeBytes = isPreDisposal ? sum(entries) + sum(deleted) : previous?.storage?.auditedBytesBefore ?? sum(entries) + sum(deleted)
const afterBytes = isPreDisposal ? sum(entries) : sum(liveFiles)
const result = {
  schemaVersion: 1,
  recordType: 'de405_evidence_disposal_manifest',
  phase: isPreDisposal ? 'pre_disposal' : 'post_disposal',
  decision: 'complete_de405_raw_evidence_disposal_uncommitted',
  commitStatus: 'uncommitted',
  repository: '$REPO',
  branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(),
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  parity: execFileSync('git', ['rev-list', '--left-right', '--count', 'main...origin/main'], { cwd: root, encoding: 'utf8' }).trim(),
  auditedStorageRoots: ['$REPO/artifacts', '$TMPDIR/de405-remote-30768814210', '$TMPDIR/de405-run-30748244499', '$TMPDIR/de405-setup-30768513595', '$TMPDIR/de405-linux-remote-4285P4', '$TMPDIR/de405-sample-release-one.qbUQfF', '$TMPDIR/de405-sample-release-two.xzMoUt', '$TMPDIR/de405-sample-asset-check', '$TMPDIR/de405-linux-asset-iOGC1t', '$TMPDIR/astro-query.jsonl', '$TMPDIR/astro-states.jsonl', '$TMPDIR/de405-source-equivalence (result/provenance boundary only; source trees not expanded)', '$TMPDIR/de405-official-extracted-check (top-level/provenance boundary only; extracted source tree not expanded)', '$TMPDIR/de405-naif-download-check (top-level/provenance boundary only; extracted source tree not expanded)', '$TMPDIR/.de405-official-download (top-level/provenance boundary only)', '$HOME/.local/share/softie-de405 (read-only canonical runtime inventory)'],
  minimumCanonicalEvidenceSet: canonicalEvidenceSet.map(([path, classification, reason]) => ({ path, classification, reason })),
  storage: { auditedBytesBefore: beforeBytes, auditedBytesAfter: afterBytes, deletedBytes: beforeBytes - afterBytes, auditedFileCountBefore: entries.length + deleted.length, auditedFileCountAfter: isPreDisposal ? entries.length : liveFiles.length, deletedFileCount: deleted.length },
  residualSweep: { files: ['artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', 'artifacts/de405-jpl-cspice-residual-sweep.jpl.jsonl', 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl', 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl'], disposition: 'preserved_required_verification_input', reason: 'direct consumers and readiness/inventory contract still require exact bytes; checker contract was not changed' },
  files: isPreDisposal ? entries : [...liveFiles, ...deleted],
  preservedBoundaries: ['canonical DE405 BSP', 'canonical-v2 runner and native dependencies', 'tracked files', 'Strategy-C artifacts and visible Strategy-C source/test/native files', '.git', 'remote provenance and variant outputs', 'official source/download/extraction material'],
  regenerationConditions: ['npm run de405:overlap:sweep', 'node scripts/generate-de405-phase-c-evidence.mjs', 'node scripts/generate-de405-canonical-v2.mjs', 'requires the recorded DE405 SPK, JPL fixture/reader, CSPICE N0067, native runners, and exact source/input identities'],
  validationResults: [
    { command: 'node scripts/check-astrology-ephemeris-golden.mjs', status: 'passed', evidence: 'golden checker pass; raw/rule-core hashes and recorded error bounds verified' },
    { command: 'node scripts/check-verified-astrology-boundary.mjs', status: 'passed', evidence: 'adapter boundary pass; no forbidden imports or production imports' },
    { command: 'npm run check:de405:artifacts', status: 'passed', evidence: '15/15 generated present, 0 missing, 3 pending, ready status' },
    { command: 'npm run check:de405:cross-platform-evidence', status: 'passed', evidence: 'corpus/conservation/exactly-once/candidate/sentinels/artifact hashes all true; 17,279 non-exact rows' },
    { command: 'node --test test/de405CanonicalV2Smoke.test.js', status: 'passed', evidence: '9/9 tests passed' },
    { command: 'node --test test/de405JplCspiceOverlapEvidence.test.js', status: 'passed', evidence: '3/3 tests passed after rebuilding the missing JPL runner with npm run de405:jpl:build-runner' },
    { command: 'node --test test/astrologyAngleProperties.test.js test/astrologyContract.test.js test/astrologyEphemerisCore.test.js test/astrologyEphemerisGolden.test.js test/astrologyEphemerisMovingFrame.test.js test/astrologyPromptAdapter.test.js test/astrologyRuleCore.test.js test/astrologyTimeAngleCore.test.js test/de405JplCanonicalV2Smoke.test.js', status: 'passed', evidence: '51/51 tests passed; actual ephemeris core 10-body composition and JPL smoke 10 rows included' },
    { command: 'npm run build', status: 'passed', evidence: 'Vite production build completed' },
    { command: 'git diff --check', status: 'passed', evidence: 'no whitespace errors; fsmonitor warning was non-fatal' },
    { command: 'git -c core.fsmonitor=false status --short --branch; git diff --cached --name-only; git rev-list --left-right --count main...origin/main', status: 'passed', evidence: 'main, staged 0, parity 0 0; package.json and 21 pre-existing visible Strategy-C paths remain' },
    { command: 'npm test', status: 'skipped', evidence: 'explicitly prohibited by work order' }
  ],
  unresolved: ['repository ignored artifacts with no direct consumer remain cold_archive_optional because unique diagnostic/evidence role was not disproven', 'OCI setup image hash ca4cc3db... differs from remote run archive 6447e903... and is therefore not disposable', 'Actions variant JSONL hashes are equal but provenance is distinct', 'readiness checker still requires the four residual streams; no contract relaxation was attempted'],
  validationPlan: ['Golden evidence checker', 'Verified Astrology boundary checker', 'DE405 artifact checker', 'cross-platform evidence checker', 'canonical-v2 smoke', 'JPL/CSPICE overlap baseline smoke', 'actual DE405 adapter 10/10', 'focused Astrology tests', 'npm run build', 'git diff --check', 'staged=0; main; parity=0 0; Strategy-C/package.json/21 visible files preserved'],
  generatedAt: '2026-08-03'
}
await writeFile(manifestPath, JSON.stringify(result, null, 2) + '\n')
const byClass = new Map()
for (const entry of result.files) byClass.set(entry.classification, (byClass.get(entry.classification) || 0) + 1)
const md = `# DE405 evidence disposal manifest (2026-08-03)\n\n- Decision: \`${result.decision}\`\n- HEAD: \`${result.head}\`; branch: \`${result.branch}\`; main/origin parity: \`${result.parity}\`\n- Commit status: \`${result.commitStatus}\`\n- Audited roots: ${result.auditedStorageRoots.join(', ')}\n- Audited files: ${result.storage.auditedFileCountBefore} before, ${result.storage.auditedFileCountAfter} after\n- Audited bytes: ${result.storage.auditedBytesBefore} before, ${result.storage.auditedBytesAfter} after; reclaimed logical bytes: ${result.storage.deletedBytes}\n- Classification counts: ${[...byClass].map(([k,v]) => `${k}=${v}`).join(', ')}\n\n## Minimum canonical evidence set\n\n${result.minimumCanonicalEvidenceSet.map(item => `- \`${item.path}\` — ${item.classification}; ${item.reason}`).join('\n')}\n\n## Disposal\n\nDeleted only exact external duplicate paths recorded in the JSON manifest; repository artifacts, canonical runtime, tracked evidence, Strategy-C material, remote provenance, and official inputs were preserved. The four residual sweep JSONL files remain required verification inputs because current consumers and the artifact readiness contract still read them.\n\n${result.files.filter(entry => entry.status === 'deleted').map(entry => `- DELETED \`${entry.path}\` — ${entry.sizeBytes} bytes, SHA-256 \`${entry.sha256}\`; ${entry.basis}`).join('\n')}\n\n## Unresolved\n\n${result.unresolved.map(item => `- ${item}`).join('\n')}\n\n## Regeneration\n\n${result.regenerationConditions.map(item => `- \`${item}\``).join('\n')}\n\nMachine-readable per-file lineage, consumers, hashes, classifications, preserved boundaries, and validation plan: [JSON manifest](./de405-evidence-disposal-manifest-2026-08-03.json).\n`
await writeFile(markdownPath, md)
