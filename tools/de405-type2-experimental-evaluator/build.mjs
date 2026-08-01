import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const build = resolve(root, 'build')
const source = resolve(root, 'src/de405_type2_experimental_evaluator.c')
const binary = resolve(build, 'de405-type2-experimental-evaluator')
await mkdir(build, { recursive: true })
const compiler = process.env.CC || 'cc'
const flags = ['-std=c11', '-O0', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off', source, '-lm', '-o', binary]
execFileSync(compiler, flags, { stdio: 'inherit' })
const binarySha256 = createHash('sha256').update(await readFile(binary)).digest('hex')
await writeFile(resolve(build, 'runner-build.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_type2_experimental_evaluator_build', compiler, flags, binarySha256, cspiceDependency: false }, null, 2) + '\n')
console.log(JSON.stringify({ binary, binarySha256, cspiceDependency: false }, null, 2))
