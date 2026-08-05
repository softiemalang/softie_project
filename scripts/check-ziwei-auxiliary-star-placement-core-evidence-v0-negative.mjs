import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildArtifact } from './materialize-ziwei-auxiliary-star-placement-core-evidence-v0.mjs'
import { checkBundle } from './check-ziwei-auxiliary-star-placement-core-evidence-v0.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const fixture = JSON.parse(readFileSync(resolve(ROOT, 'test/fixtures/ziwei/ziwei-auxiliary-star-placement-core-evidence-v0-negative-v0.json'), 'utf8'))

function setPath(target, path, value) {
  let cursor = target
  for (const segment of path.slice(0, -1)) cursor = cursor[segment]
  cursor[path[path.length - 1]] = value
}

const failures = []
for (const mutation of fixture.mutations) {
  const expected = buildArtifact()
  const candidate = { artifact: structuredClone(expected.artifact), files: structuredClone(expected.files) }
  setPath(candidate, mutation.path, mutation.value)
  const errors = checkBundle(candidate)
  if (!errors.includes(mutation.expectedError)) failures.push({ id: mutation.id, expectedError: mutation.expectedError, errors })
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ status: 'ok', mutationCount: fixture.mutations.length, detected: fixture.mutations.map((mutation) => mutation.id) }, null, 2))
}
