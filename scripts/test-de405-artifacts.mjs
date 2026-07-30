#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { formatReadiness, inspectArtifactReadiness, parseCliOptions, resolveArtifactRoot, resolveInventoryPath } from './lib/de405-artifact-contract.mjs'
import { discoverArtifactTestFiles } from './lib/test-suite-discovery.mjs'

const options = parseCliOptions(process.argv.slice(2))
const result = await inspectArtifactReadiness({
  artifactRoot: resolveArtifactRoot({ cliRoot: options.artifactroot }),
  inventoryPath: resolveInventoryPath({ cliPath: options.inventory })
})
if (result.status !== 'ready') {
  console.error(formatReadiness(result))
  console.error('preparation: run npm run check:de405:artifacts, then follow docs/de405-artifact-materialization.md')
  process.exitCode = 3
} else {
  const run = spawnSync(process.execPath, ['--test', ...await discoverArtifactTestFiles().then(files => files.map(file => `test/${file}`))], { stdio: 'inherit' })
  process.exitCode = run.status ?? 1
}
