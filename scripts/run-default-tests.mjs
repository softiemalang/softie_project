#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import {
  discoverTestProfileFiles,
  SOURCE_LOCAL_TEST_FILES,
  TEST_PROFILES,
} from './lib/test-suite-discovery.mjs'

const args = process.argv.slice(2)
const profile = args[0]?.startsWith('-') || args.length === 0 ? 'default' : args.shift()
if (!TEST_PROFILES.includes(profile)) throw new Error(`unknown test profile: ${profile}`)

const discoveredFiles = await discoverTestProfileFiles(profile)
const files = profile === 'all'
  ? [...discoveredFiles, ...SOURCE_LOCAL_TEST_FILES].sort((a, b) => a.localeCompare(b))
  : discoveredFiles
const filePaths = files.map(file => SOURCE_LOCAL_TEST_FILES.includes(file) ? file : `test/${file}`)
if (process.argv.includes('--list')) {
  console.log(filePaths.join('\n'))
  process.exit(0)
}

const run = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...filePaths], { stdio: 'inherit' })
process.exitCode = run.status ?? 1
