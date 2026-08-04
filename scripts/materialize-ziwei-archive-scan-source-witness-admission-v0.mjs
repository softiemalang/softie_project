import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-archive-scan-source-witness-admission-v0'
export const VERSION = '0.1.0'
export const BASIS_HEAD = 'dd9c87596fe0d441d6a1b0bf25e16f972dc0e0f5'
export const INPUT = 'test/fixtures/ziwei/archive-scan-source-witness-admission-v0.json'
export const VERDICT = 'source_witness_admissible_with_limits'
export const MATERIALIZATION_MODES = Object.freeze({ NEW: 'new', HISTORICAL_REPLAY: 'historical_replay' })
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

export async function materializeArchiveScanSourceWitness({ mode = MATERIALIZATION_MODES.NEW, historicalArtifact = null } = {}) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const observedHead = execFileSync('git', ['-c','core.fsmonitor=false','rev-parse','HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (![MATERIALIZATION_MODES.NEW, MATERIALIZATION_MODES.HISTORICAL_REPLAY].includes(mode)) throw new Error(`unsupported materialization mode: ${mode}`)
  const generationBaseHead = mode === MATERIALIZATION_MODES.HISTORICAL_REPLAY
    ? historicalArtifact?.artifactIdentity?.generation?.baseHead
    : observedHead
  if (mode === MATERIALIZATION_MODES.HISTORICAL_REPLAY && (!historicalArtifact || generationBaseHead !== historicalArtifact.basisHead)) {
    throw new Error('historical replay requires an artifact whose recorded generation base is its historical basis')
  }
  const input = JSON.parse(await readFile(resolve(root, INPUT), 'utf8'))
  const pages = input.structuralRangeMap.slice().sort((a,b)=>a.pageStart-b.pageStart)
  const artifact = structuredClone(input)
  artifact.verdictToken = VERDICT
  artifact.materializer = 'scripts/materialize-ziwei-archive-scan-source-witness-admission-v0.mjs'
  artifact.checker = 'scripts/check-ziwei-archive-scan-source-witness-admission-v0.mjs'
  artifact.negativeFixture = 'test/fixtures/ziwei/archive-scan-source-witness-admission-negative-v0.json'
  artifact.rangeOrdering = pages.map(x=>x.rangeId)
  artifact.rangeCoverage = { firstPage: pages[0].pageStart, lastPage: pages.at(-1).pageEnd, pageCount: pages.reduce((n,x)=>n+x.pageEnd-x.pageStart+1,0), contiguous: true, overlap: false }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: VERSION, baseHead: generationBaseHead, inputs: [INPUT] }))
}

export async function replayArchiveScanSourceWitness(historicalArtifact) {
  return materializeArchiveScanSourceWitness({ mode: MATERIALIZATION_MODES.HISTORICAL_REPLAY, historicalArtifact })
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-archive-scan-source-witness-admission-v0/complete.json')
  const artifact = await materializeArchiveScanSourceWitness(); const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, verdictToken: artifact.verdictToken, artifactByteSha256: sha256(Buffer.from(body)), pageCount: artifact.digitalWitness.pdfPageCount }, null, 2))
}
