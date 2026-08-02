import { readFile } from 'node:fs/promises'
const text = await readFile('.github/workflows/de405-linux-architecture-evidence.yml', 'utf8')
for (const value of ['workflow_dispatch:', 'ubuntu-24.04', 'ubuntu-24.04-arm', 'contents: read', 'input_bundle_url', 'input_bundle_sha256', 'curl --fail --location', 'sha256sum --check', 'scripts/build-de405-linux-cspice.mjs', 'actions/upload-artifact@', 'retention-days: 14', 'DE405_EXPECTED_HEAD', 'DE405_EXPECTED_COMPILER:', 'DE405_CFLAGS:', 'DE405_CSPICE_CFLAGS:', '-O2', '-ffp-contract=off', 'LC_ALL: C.UTF-8', 'TZ: UTC', 'scripts/run-de405-linux-architecture-evidence.mjs', '150671']) if (!text.includes(value)) throw new Error(`workflow missing ${value}`)
for (const forbidden of ['push:', 'pull_request:', 'schedule:', 'workflow_call:', 'actions/cache', 'secrets.', 'git add', 'git commit', 'git push', 'npm install', '@v4', '@v3']) if (text.includes(forbidden)) throw new Error(`workflow contains forbidden ${forbidden}`)
for (const match of text.matchAll(/uses:\s*([^\s#]+)/g)) if (!/@[0-9a-f]{40}$/.test(match[1])) throw new Error(`action is not SHA pinned: ${match[1]}`)
if ((text.match(/arch: (x64|arm64)/g) || []).length !== 2) throw new Error('matrix must contain exactly x64 and arm64')
if (text.includes('run-id:') || text.includes('github-token:') || text.includes('secrets.')) throw new Error('workflow must not use cross-run artifact credentials')
console.log('ok: workflow contract')
