import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

const integrityBody = ({ canonicalJson, root, schema, path, body }) => canonicalJson({
  schemaVersion: `${schema}-integrity-v0`,
  path: relative(root, path),
  byteSha256: sha256(body),
  byteScope: 'UTF-8 JSON bytes including final LF',
})

async function snapshotOutputs(outputs) {
  return Promise.all(Object.entries(outputs).map(async ([name, path]) => ({
    name,
    path,
    body: await readFile(path),
    integrityBody: await readFile(`${path}.integrity.json`),
  })))
}

async function writeSnapshot({ canonicalJson, directory, root, schema, snapshot }) {
  let completePath = null
  for (const entry of snapshot) {
    const path = entry.name === 'complete' ? resolve(directory, 'complete.json') : resolve(directory, entry.name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, entry.body)
    await writeFile(`${path}.integrity.json`, integrityBody({ canonicalJson, root, schema, path, body: entry.body }))
    if (entry.name === 'complete') completePath = path
  }
  if (!completePath) throw new Error('materialized bundle has no complete output')
  return completePath
}

async function assertSnapshotUnchanged(snapshot) {
  for (const entry of snapshot) {
    const body = await readFile(entry.path)
    const integrityBody = await readFile(`${entry.path}.integrity.json`)
    if (!body.equals(entry.body) || !integrityBody.equals(entry.integrityBody)) {
      throw new Error(`base materialized output changed during negative checks: ${entry.name}`)
    }
  }
}

export async function runZiweiP0NegativeMutations({
  canonicalJson,
  checkArtifact,
  materializeBundle,
  mutations,
  root,
  schema,
  tempPrefix,
}) {
  const baseDirectory = await mkdtemp(resolve(tmpdir(), `${tempPrefix}-base-`))
  try {
    const basePath = resolve(baseDirectory, 'complete.json')
    const baseBundle = await materializeBundle(basePath, { mode: 'historical_reference' })
    const snapshot = await snapshotOutputs(baseBundle.outputs)
    const baseEntry = snapshot.find(entry => entry.name === 'complete')
    if (!baseEntry) throw new Error('materialized bundle has no complete snapshot')
    const baseArtifact = JSON.parse(baseEntry.body.toString('utf8'))
    const results = []
    const mutationDirectory = await mkdtemp(resolve(tmpdir(), `${tempPrefix}-mutations-`))

    try {
      const completePath = await writeSnapshot({ canonicalJson, directory: mutationDirectory, root, schema, snapshot })
      for (const mutation of mutations) {
        const candidate = structuredClone(baseArtifact)
        mutation.mutate(candidate)
        const body = Buffer.from(canonicalJson(candidate))
        await writeFile(completePath, body)
        await writeFile(`${completePath}.integrity.json`, integrityBody({ canonicalJson, root, schema, path: completePath, body }))
        const errors = checkArtifact(root, completePath)
        results.push({ id: mutation.id, rejected: errors.length > 0, errors })
      }
    } finally {
      await rm(mutationDirectory, { recursive: true, force: true })
    }

    await assertSnapshotUnchanged(snapshot)
    return results
  } finally {
    await rm(baseDirectory, { recursive: true, force: true })
  }
}
