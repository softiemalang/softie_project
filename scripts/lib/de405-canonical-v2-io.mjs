import { readFile, writeFile } from 'node:fs/promises'
import { ROW_KEYS, VECTOR_KEYS, DECIMAL_RE, TARGETS, assertMaterializationProfile } from './de405-canonical-v2-contract.mjs'
export async function readJson(path) { return JSON.parse(await readFile(path, 'utf8')) }
export function validateRow(row, line) {
  if (JSON.stringify(Object.keys(row)) !== JSON.stringify(ROW_KEYS)) throw new Error(`line ${line}: key order mismatch`)
  if (row.schemaVersion !== 'de405-canonical-v2') throw new Error(`line ${line}: schema mismatch`)
  const target = TARGETS.find(t => t.targetId === row.targetId)
  if (!target || row.target !== target.target || row.targetType !== target.targetType) throw new Error(`line ${line}: target mismatch`)
  if (row.observerId !== 399 || row.observer !== 'EARTH' || row.frame !== 'J2000' || row.aberrationCorrection !== 'NONE') throw new Error(`line ${line}: observer contract mismatch`)
  for (const value of [row.etSeconds, ...VECTOR_KEYS.map(k => row.positionKm?.[k]), ...VECTOR_KEYS.map(k => row.velocityKmPerSecond?.[k])]) {
    if (typeof value !== 'string' || !DECIMAL_RE.test(value) || value.includes('NaN') || value.includes('Infinity') || /^-0\.0+e/.test(value)) throw new Error(`line ${line}: numeric serialization mismatch`)
  }
  if (JSON.stringify(Object.keys(row.positionKm)) !== JSON.stringify(VECTOR_KEYS) || JSON.stringify(Object.keys(row.velocityKmPerSecond)) !== JSON.stringify(VECTOR_KEYS)) throw new Error(`line ${line}: vector key order mismatch`)
}
export async function validateBytes(file, manifest) {
  const profile = assertMaterializationProfile(manifest)
  const bytes = await readFile(file)
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw new Error('BOM forbidden')
  const text = bytes.toString('utf8'); if (text.includes('\r')) throw new Error('CRLF forbidden'); if (!text.endsWith('\n')) throw new Error('trailing LF required')
  const lines = text.slice(0, -1).split('\n'); if (lines.length !== profile.expectedRowCount || lines.some(line => !line)) throw new Error('row count mismatch')
  let previousEt = -Infinity, previousTarget = -Infinity, pairs = new Set()
  lines.forEach((line, i) => { const row = JSON.parse(line); validateRow(row, i + 1); const et = Number(row.etSeconds); if (et < previousEt || (et === previousEt && row.targetId <= previousTarget)) throw new Error('ordering mismatch'); if (et !== previousEt && i % 10 !== 0) throw new Error('missing target'); if (i % 10 === 0 && i > 0 && Math.abs(et - previousEt - profile.stepSeconds) > 0) throw new Error('ET step mismatch'); if (i === 0 && row.etSeconds !== profile.startEt) throw new Error('start ET mismatch'); const pair = `${row.etSeconds}/${row.targetId}`; if (pairs.has(pair)) throw new Error('duplicate pair'); pairs.add(pair); previousEt = et; previousTarget = row.targetId })
  if (profile.endEtExclusive !== profile.startEt && previousEt >= Number(profile.endEtExclusive)) throw new Error('end ET boundary mismatch')
  return { rowCount: lines.length, sizeBytes: bytes.length }
}
export async function writeJson(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
