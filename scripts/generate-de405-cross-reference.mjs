#!/usr/bin/env node

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const defaults = {
  manifest: path.join(root, 'test/fixtures/astrology/de405/manifest.json'),
  baseline: path.join(root, 'test/fixtures/astrology/de405/baseline.json'),
  timestamps: '/tmp/mallang-erfa-epv00-feasibility/de405/official-reader/full-timestamps.txt',
  jplBinary: '/tmp/mallang-erfa-epv00-feasibility/de405/full-range/lnxp1600p2200.405',
  naifSpk: '/tmp/mallang-erfa-epv00-feasibility/de405/de405.bsp',
  officialReader: '/tmp/mallang-erfa-epv00-feasibility/de405/official-reader/de405-batch-o0',
  cspiceRunner: '/tmp/mallang-erfa-epv00-feasibility/de405/contract_runner_x86',
  output: path.join(root, 'test/fixtures/astrology/de405/raw-comparison.jsonl'),
}
const AU_KM = 149597870.7
const finite = (x) => Number.isFinite(x)
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const argsOf = (argv) => { const a = { ...defaults, json: false }; for (let i = 0; i < argv.length; i += 1) { const k = argv[i]; if (k === '--json') a.json = true; else if (k === '--output') a.output = argv[++i]; else if (k === '--timestamps') a.timestamps = argv[++i]; else if (k === '--jpl-binary') a.jplBinary = argv[++i]; else if (k === '--naif-spk') a.naifSpk = argv[++i]; else if (k === '--official-reader') a.officialReader = argv[++i]; else if (k === '--cspice-runner') a.cspiceRunner = argv[++i]; else throw new Error(`unknown argument: ${k}`) } return a }
const mustFile = (file) => { if (!fs.existsSync(file)) throw new Error(`missing input: ${file}`); return file }
const run = (file, input, extra = [], cwd = root) => { const r = spawnSync(file, extra, { input, cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 }); if (r.error) throw r.error; if (r.status !== 0) throw new Error(`${file} exited ${r.status}: ${r.stderr}`); return r.stdout }
const vector = (a, b) => a.map((x, i) => x - b[i])
const norm = (a) => Math.hypot(...a)
const stats = (values) => { const s = [...values].sort((a, b) => a - b); const q = (p) => { const x = (s.length - 1) * p; const i = Math.floor(x); return s[i] + (s[Math.ceil(x)] - s[i]) * (x - i) }; return { p95: q(.95), p99: q(.99), max: s.at(-1) } }

export function generate(options = {}) {
  const a = { ...defaults, ...options }
  const manifest = JSON.parse(fs.readFileSync(a.manifest, 'utf8'))
  for (const file of [a.timestamps, a.jplBinary, a.naifSpk, a.officialReader, a.cspiceRunner]) mustFile(file)
  const expected = manifest.artifacts
  for (const [file, spec] of [[a.jplBinary, expected.jplDe405Binary], [a.naifSpk, expected.naifDe405Spk]]) { if (hash(file) !== spec.sha256 || fs.statSync(file).size !== spec.sizeBytes) throw new Error(`artifact hash/size mismatch: ${file}`) }
  const timestampBytes = fs.readFileSync(a.timestamps); if (crypto.createHash('sha256').update(timestampBytes).digest('hex') !== manifest.timestamps.sha256) throw new Error('timestamp fixture hash mismatch')
  const jds = timestampBytes.toString('utf8').trim().split(/\r?\n/).map(Number); if (jds.length !== manifest.timestamps.sampleCount || jds.some((x) => !finite(x))) throw new Error('timestamp count/finite contract failed')
  const input = jds.map((jd) => `${(jd - 2451545.0) * 86400.0}`).join('\n') + '\n'
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'de405-cross-reference-'))
  try {
    fs.symlinkSync(a.jplBinary, path.join(temp, 'JPLEPH'))
    const official = run(a.officialReader, input, [], temp).trim().split('\n').map((line) => { const p = line.split(',').map((x) => x.trim()); return { status: p[1], p: p.slice(14, 17).map(Number), v: p.slice(17, 20).map(Number) } })
    const spice = run(a.cspiceRunner, input, [a.naifSpk]).trim().split('\n').map(JSON.parse)
    if (official.length !== jds.length || spice.length !== jds.length) throw new Error('runner sample count mismatch')
    const rows = jds.map((jd, i) => { const p = vector(official[i].p.map((x) => x * AU_KM), spice[i].earth_sun[0].slice(0, 3)); const v = vector(official[i].v.map((x) => x * AU_KM / 86400), spice[i].earth_sun[1].slice(0, 3)); return { jdTdb: jd, status: official[i].status === 'ok' && spice[i].jd === jd ? 'ok' : 'mismatch', positionResidualKm: { x: p[0], y: p[1], z: p[2], norm: norm(p) }, velocityResidualKmPerSec: { x: v[0], y: v[1], z: v[2], norm: norm(v) } } })
    if (rows.some((r) => r.status !== 'ok' || ![r.positionResidualKm, r.velocityResidualKm].flatMap(Object.values).every(finite))) throw new Error('non-finite value or status mismatch')
    const text = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'; fs.mkdirSync(path.dirname(a.output), { recursive: true }); fs.writeFileSync(a.output, text, 'utf8')
    return { schemaVersion: 1, sampleCount: rows.length, statusMismatch: 0, rawSha256: crypto.createHash('sha256').update(text).digest('hex'), summary: { positionComponentKm: stats(rows.flatMap((r) => [r.positionResidualKm.x, r.positionResidualKm.y, r.positionResidualKm.z].map(Math.abs))), positionNormKm: stats(rows.map((r) => r.positionResidualKm.norm)), velocityComponentKmPerSec: stats(rows.flatMap((r) => [r.velocityResidualKmPerSec.x, r.velocityResidualKmPerSec.y, r.velocityResidualKmPerSec.z].map(Math.abs))), velocityNormKmPerSec: stats(rows.map((r) => r.velocityResidualKmPerSec.norm)) }, contract: { target: 'Sun→Earth', frame: 'J2000', time: 'JD TDB; CSPICE ET=(jdTdb-2451545.0)*86400.0', newline: 'LF; final newline included' } }
  } finally { fs.rmSync(temp, { recursive: true, force: true }) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) { try { const a = argsOf(process.argv.slice(2)); const result = generate(a); console.log(a.json ? JSON.stringify(result, null, 2) : `${result.rawSha256}\n${JSON.stringify(result.summary)}`) } catch (error) { console.error(`DE405 generation error: ${error.message}`); process.exitCode = 1 } }
