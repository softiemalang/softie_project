import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const nativeJsPath = resolve('node_modules/rollup/dist/native.js')
const source = readFileSync(nativeJsPath, 'utf8')

const search = `\t\tthrow new Error(
\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t'Please try \`npm i\` again after removing both package-lock.json and node_modules directory.',
\t\t\t{ cause: error }
\t\t);`

const replacement = `\t\ttry {
\t\t\treturn require('@rollup/wasm-node');
\t\t} catch {
\t\t\tthrow new Error(
\t\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t\t'Please try \`npm i\` again after removing both package-lock.json and node_modules directory.',
\t\t\t\t{ cause: error }
\t\t\t);
\t\t}`

const nextSource = source.replaceAll("@rollup/wasm-node')", "@rollup/wasm-node/dist/native.js')")

if (!nextSource.includes("require('@rollup/wasm-node/dist/native.js')")) {
  writeFileSync(nativeJsPath, source.replace(search, replacement.replace('@rollup/wasm-node', '@rollup/wasm-node/dist/native.js')))
} else if (nextSource !== source) {
  writeFileSync(nativeJsPath, nextSource)
}
