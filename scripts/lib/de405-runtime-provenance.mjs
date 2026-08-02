export function assertRuntimeProvenance({ head, githubSha, githubRef, expectedHead }) {
  if (githubRef !== 'refs/heads/main') throw new Error(`workflow must run from refs/heads/main, got ${githubRef || 'missing ref'}`)
  if (!/^[0-9a-f]{40}$/.test(githubSha || '')) throw new Error('GITHUB_SHA must be a 40-character commit SHA')
  if (!/^[0-9a-f]{40}$/.test(head || '')) throw new Error('checkout HEAD must be a 40-character commit SHA')
  if (expectedHead !== githubSha) throw new Error(`expectedHead/GITHUB_SHA mismatch: ${expectedHead} != ${githubSha}`)
  if (head !== githubSha) throw new Error(`checkout HEAD/GITHUB_SHA mismatch: ${head} != ${githubSha}`)
  return { head, githubSha, githubRef, expectedHead }
}
