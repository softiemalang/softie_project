#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

import { SOURCE_LOCAL_TEST_FILES } from './lib/test-suite-discovery.mjs'

if (process.argv.includes('--list')) {
  process.stdout.write(SOURCE_LOCAL_TEST_FILES.join('\n'))
  process.stdout.write('\n')
  process.exit(0)
}

const run = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', ...SOURCE_LOCAL_TEST_FILES],
  { stdio: 'inherit' },
)
process.exitCode = run.status ?? 1
