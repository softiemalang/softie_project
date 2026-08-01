import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const analysis = resolve(root, 'scripts/analyze-de405-route-root-cause.mjs')
const left = await mkdtemp(`${tmpdir()}/de405-route-analysis-left.`)
const right = await mkdtemp(`${tmpdir()}/de405-route-analysis-right.`)
const compareDirectory = async (leftDir, rightDir) => {
  const names = (await readdir(leftDir)).sort()
  const rightNames = (await readdir(rightDir)).sort()
  if (JSON.stringify(names) !== JSON.stringify(rightNames)) throw new Error('determinism output file sets differ')
  for (const name of names) {
    const a = await readFile(resolve(leftDir, name))
    const b = await readFile(resolve(rightDir, name))
    if (!a.equals(b)) throw new Error(`determinism output differs: ${name}`)
  }
}
const leftDocs = await mkdtemp(`${tmpdir()}/de405-route-analysis-docs-left.`)
const rightDocs = await mkdtemp(`${tmpdir()}/de405-route-analysis-docs-right.`)
try {
  execFileSync(process.execPath, [analysis], { cwd: root, env: { ...process.env, DE405_ROUTE_ARTIFACT_DIR: left, DE405_ROUTE_DOCS_DIR: leftDocs }, stdio: 'ignore' })
  execFileSync(process.execPath, [analysis], { cwd: root, env: { ...process.env, DE405_ROUTE_ARTIFACT_DIR: right, DE405_ROUTE_DOCS_DIR: rightDocs }, stdio: 'ignore' })
  await compareDirectory(left, right)
  await compareDirectory(leftDocs, rightDocs)
  console.log(JSON.stringify({ schemaVersion: 1, recordType: 'de405_route_root_cause_determinism_check', status: 'pass', artifactDestinationCount: 2, documentationDestinationCount: 2, outputsByteIdentical: true }, null, 2))
} finally {
  await Promise.all([rm(left, { recursive: true, force: true }), rm(right, { recursive: true, force: true }), rm(leftDocs, { recursive: true, force: true }), rm(rightDocs, { recursive: true, force: true })])
}
