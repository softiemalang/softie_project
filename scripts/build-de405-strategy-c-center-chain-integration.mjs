import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
execFileSync('node', ['tools/de405-type2-strategy-c-center-chain-integration/build.mjs'], { cwd: root, stdio: 'inherit' })
