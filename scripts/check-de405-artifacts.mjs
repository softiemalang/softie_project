#!/usr/bin/env node
import { formatReadiness, inspectArtifactReadiness, parseCliOptions, resolveArtifactRoot, resolveInventoryPath } from './lib/de405-artifact-contract.mjs'

const options = parseCliOptions(process.argv.slice(2))
const result = await inspectArtifactReadiness({
  artifactRoot: resolveArtifactRoot({ cliRoot: options.artifactroot }),
  inventoryPath: resolveInventoryPath({ cliPath: options.inventory })
})
console.log(options.json ? JSON.stringify(result, null, 2) : formatReadiness(result))
if (result.status !== 'ready') process.exitCode = 3
