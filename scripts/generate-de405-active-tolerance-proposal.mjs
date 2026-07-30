#!/usr/bin/env node
import { mkdtemp, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import {
  generateActiveToleranceProposal,
  parseCliOptions,
  serializeProposalCanonical
} from './lib/de405-active-tolerance-proposal.mjs'

async function main() {
  const options = parseCliOptions(process.argv.slice(2))

  if (!options.output) {
    console.error('Error: --output <path> is required')
    process.exitCode = 1
    return
  }

  const outputPath = resolve(process.cwd(), options.output)
  const candidateSourcePath = resolve(process.cwd(), options.candidateSource || 'docs/de405-active-tolerance-candidate.json')

  if (outputPath === candidateSourcePath) {
    console.error(`Error: candidate_source_equals_output - Candidate source path cannot be the same as output path: ${outputPath}`)
    process.exitCode = 1
    return
  }

  // Overwrite protection
  let fileExists = false
  try {
    const info = await stat(outputPath)
    if (info.isFile() || info.isDirectory()) fileExists = true
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  if (fileExists && !options.force) {
    console.error(`Error: output_exists - Target file already exists: ${outputPath}. Use --force to overwrite.`)
    process.exitCode = 1
    return
  }

  const proposalObj = await generateActiveToleranceProposal(options)
  const canonicalJson = serializeProposalCanonical(proposalObj)

  if (fileExists && options.force) {
    const tempDir = await mkdtemp(join(tmpdir(), 'de405-proposal-gen-'))
    const tempFile = join(tempDir, 'temp-proposal.json')
    try {
      await writeFile(tempFile, canonicalJson, 'utf8')
      JSON.parse(canonicalJson) // Verify parseable
      await rename(tempFile, outputPath)
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  } else {
    await writeFile(outputPath, canonicalJson, 'utf8')
  }

  console.log(JSON.stringify({
    status: 'success',
    output: outputPath,
    schemaVersion: proposalObj.schemaVersion,
    proposalStatus: proposalObj.status,
    blockers: proposalObj.blockers
  }, null, 2))
}

main().catch(err => {
  console.error(`Generator failed: ${err.message}`)
  process.exitCode = 1
})
