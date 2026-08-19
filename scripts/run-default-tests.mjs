#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { discoverTestProfileFiles, TEST_PROFILES } from './lib/test-suite-discovery.mjs'

const args = process.argv.slice(2)
const profile = args[0]?.startsWith('-') || args.length === 0 ? 'default' : args.shift()
if (!TEST_PROFILES.includes(profile)) throw new Error(`unknown test profile: ${profile}`)

const files = await discoverTestProfileFiles(profile)
if (process.argv.includes('--list')) {
  console.log(files.map(file => `test/${file}`).join('\n'))
  process.exit(0)
}

const run = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files.map(file => `test/${file}`)], { stdio: 'inherit' })
process.exitCode = run.status ?? 1
