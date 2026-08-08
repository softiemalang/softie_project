import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
execFileSync(process.execPath, [resolve(root, 'tools/de405-type2-strategy-c-integration/build.mjs')], { cwd: root, stdio: 'inherit' })
