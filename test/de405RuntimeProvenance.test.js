import test from 'node:test'
import assert from 'node:assert/strict'
import { assertRuntimeProvenance } from '../scripts/lib/de405-runtime-provenance.mjs'

const sha = 'f'.repeat(40)
test('runtime provenance binds checkout, GITHUB_SHA, expectedHead, and main ref', () => {
  assert.deepEqual(assertRuntimeProvenance({ head: sha, githubSha: sha, githubRef: 'refs/heads/main', expectedHead: sha }), { head: sha, githubSha: sha, githubRef: 'refs/heads/main', expectedHead: sha })
  for (const mutation of [{ githubRef: 'refs/tags/v1' }, { githubSha: 'e'.repeat(40) }, { head: 'e'.repeat(40) }, { expectedHead: 'e'.repeat(40) }]) assert.throws(() => assertRuntimeProvenance({ head: sha, githubSha: sha, githubRef: 'refs/heads/main', expectedHead: sha, ...mutation }))
})
