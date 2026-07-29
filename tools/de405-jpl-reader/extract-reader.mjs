#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXPECTED_READER_SHA256 = '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'

export async function extractSubroutines(sourceFile, outputDir) {
  const sourceContent = await readFile(sourceFile, 'utf8')
  const originalSourceSha256 = createHash('sha256').update(sourceContent).digest('hex')
  if (originalSourceSha256 !== EXPECTED_READER_SHA256) {
    throw new Error(`original testeph.f SHA-256 mismatch: got ${originalSourceSha256}, expected ${EXPECTED_READER_SHA256}`)
  }

  const lines = sourceContent.split(/\r?\n/)
  // Find where SUBROUTINE PLEPH starts (1-indexed line 434, 0-indexed index 433)
  const plephIndex = lines.findIndex(line => /SUBROUTINE\s+PLEPH/i.test(line))
  if (plephIndex < 0) {
    throw new Error('SUBROUTINE PLEPH not found in testeph.f')
  }

  const excludedLineRanges = [`1-${plephIndex}`]
  const includedLineRanges = [`${plephIndex + 1}-${lines.length}`]

  const extractedLines = lines.slice(plephIndex)
  const extractedContent = extractedLines.join('\n') + '\n'
  const extractedSourceSha256 = createHash('sha256').update(extractedContent).digest('hex')

  const selfContent = await readFile(fileURLToPath(import.meta.url), 'utf8')
  const extractionScriptSha256 = createHash('sha256').update(selfContent).digest('hex')

  await mkdir(outputDir, { recursive: true })
  const targetSubroutineFile = resolve(outputDir, 'generated_testeph_subroutines.f')
  await writeFile(targetSubroutineFile, extractedContent, 'utf8')

  const provenance = {
    originalSourceFile: sourceFile,
    originalSourceSha256,
    extractionScriptSha256,
    sourceTotalLineCount: lines.length,
    includedLineRanges,
    excludedLineRanges,
    extractedSourceFile: 'generated_testeph_subroutines.f',
    extractedSourceSha256,
    semanticChanges: 'none',
    logicalLineCount: extractedLines.length,
    trailingNewline: true,
    lineCountDefinition: 'logical-source-lines'
  }

  const targetProvenanceFile = resolve(outputDir, 'extraction-provenance.json')
  await writeFile(targetProvenanceFile, JSON.stringify(provenance, null, 2) + '\n', 'utf8')

  return { subroutineFile: targetSubroutineFile, provenance }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const source = process.argv[2] ? resolve(process.argv[2]) : resolve(__dirname, 'fixtures/testeph.f')
  const outDir = process.argv[3] ? resolve(process.argv[3]) : resolve(__dirname, 'build')
  extractSubroutines(source, outDir)
    .then(res => console.log(JSON.stringify(res, null, 2)))
    .catch(err => {
      console.error(`Extraction failed: ${err.message}`)
      process.exitCode = 1
    })
}
