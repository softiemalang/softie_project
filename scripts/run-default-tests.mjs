#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { discoverDefaultTestFiles } from './lib/test-suite-discovery.mjs'

const files = await discoverDefaultTestFiles()
if (process.argv.includes('--list')) {
  console.log(files.map(file => `test/${file}`).join('\n'))
  process.exit(0)
}

const run = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files.map(file => `test/${file}`)], { stdio: 'inherit' })
process.exitCode = run.status ?? 1
