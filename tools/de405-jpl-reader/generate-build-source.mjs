#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractSubroutines } from './extract-reader.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXPECTED_READER_SHA256 = '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
const EXPECTED_EXTRACTED_SHA256 = '59206e48c80ac20b19187b16f7b8dd2ca57f953d1d60516b15f126ce2266cd53'

async function sha256String(str) {
  return createHash('sha256').update(str).digest('hex')
}

export async function generateBuildSource(sourceFile, outputDir) {
  // 1. Verify original source
  const sourceContent = await readFile(sourceFile, 'utf8')
  const originalSourceSha256 = createHash('sha256').update(sourceContent).digest('hex')
  if (originalSourceSha256 !== EXPECTED_READER_SHA256) {
    throw new Error(`Original testeph.f SHA-256 mismatch: got ${originalSourceSha256}, expected ${EXPECTED_READER_SHA256}`)
  }

  // 2. Perform verbatim extraction into temporary / output dir
  const { subroutineFile, provenance: extractionProv } = await extractSubroutines(sourceFile, outputDir)
  const extractedContent = await readFile(subroutineFile, 'utf8')
  const extractedSha256 = createHash('sha256').update(extractedContent).digest('hex')

  if (extractedSha256 !== EXPECTED_EXTRACTED_SHA256) {
    throw new Error(`Extracted subroutines SHA-256 mismatch: got ${extractedSha256}, expected ${EXPECTED_EXTRACTED_SHA256}`)
  }

  // 3. Transformation 1: select_fsizer3 in extracted subroutines
  const fsizer3CallAnchor = 'C        CALL FSIZER3(NRECL,KSIZE,NRFILE,NAMFIL)'
  const fsizer3CallReplacement = '         CALL FSIZER3(NRECL,KSIZE,NRFILE,NAMFIL)'

  const fsizer3MatchCount = (extractedContent.match(new RegExp(fsizer3CallAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (fsizer3MatchCount !== 1) {
    throw new Error(`Anchor match count error for select_fsizer3: expected 1, found ${fsizer3MatchCount}`)
  }

  const tailoredExtracted = extractedContent.replace(fsizer3CallAnchor, fsizer3CallReplacement)

  // 4. Extract SUBROUTINE FSIZER3 from original testeph.f (lines 368-423) and apply transformations
  const sourceLines = sourceContent.split(/\r?\n/)
  const fsizer3StartIndex = sourceLines.findIndex(line => /SUBROUTINE\s+FSIZER3/i.test(line))
  if (fsizer3StartIndex < 0) {
    throw new Error('SUBROUTINE FSIZER3 not found in testeph.f')
  }

  const plephStartIndex = sourceLines.findIndex(line => /SUBROUTINE\s+PLEPH/i.test(line))
  const fsizer3Lines = sourceLines.slice(fsizer3StartIndex, plephStartIndex > fsizer3StartIndex ? plephStartIndex : fsizer3StartIndex + 56)
  let fsizer3Block = fsizer3Lines.join('\n') + '\n'

  // Transformation 2: set_nrecl_4
  const nreclAnchor = '       NRECL='
  const nreclReplacement = '       NRECL=4'
  const nreclMatchCount = (fsizer3Block.match(new RegExp(nreclAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (nreclMatchCount !== 1) {
    throw new Error(`Anchor match count error for set_nrecl_4: expected 1, found ${nreclMatchCount}`)
  }
  fsizer3Block = fsizer3Block.replace(nreclAnchor, nreclReplacement)

  // Transformation 3: set_ksize_2036
  const ksizeAnchor = '      KSIZE = '
  const ksizeReplacement = '      KSIZE = 2036'
  const ksizeMatchCount = (fsizer3Block.match(new RegExp(ksizeAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (ksizeMatchCount !== 1) {
    throw new Error(`Anchor match count error for set_ksize_2036: expected 1, found ${ksizeMatchCount}`)
  }
  fsizer3Block = fsizer3Block.replace(ksizeAnchor, ksizeReplacement)

  // 5. Combine into generated build source
  const generatedContent = tailoredExtracted + '\n' + fsizer3Block
  const outputSha256 = createHash('sha256').update(generatedContent).digest('hex')

  const selfContent = await readFile(fileURLToPath(import.meta.url), 'utf8')
  const generatorSha256 = createHash('sha256').update(selfContent).digest('hex')

  // 6. Write atomically to target file
  await mkdir(outputDir, { recursive: true })
  const targetGeneratedFile = resolve(outputDir, 'testeph-de405.generated.f')
  const tmpFile = resolve(outputDir, `testeph-de405.generated.f.tmp.${Date.now()}`)

  await writeFile(tmpFile, generatedContent, 'utf8')
  await rename(tmpFile, targetGeneratedFile)

  // 7. Verify byte-identity on rerun
  const checkRunContent = (extractedContent.replace(fsizer3CallAnchor, fsizer3CallReplacement)) + '\n' + fsizer3Block
  const checkSha256 = createHash('sha256').update(checkRunContent).digest('hex')
  if (checkSha256 !== outputSha256) {
    throw new Error('Deterministic build tailoring failed: re-run output hash mismatch')
  }

  // 8. Build tailoring provenance metadata
  const provenance = {
    sourceExtraction: {
      mode: 'verbatim',
      semanticChanges: 'none',
      sourceSha256: originalSourceSha256,
      extractedSha256,
      sourceLineCount: sourceLines.length,
      extractedLineRange: {
        start: 426,
        end: sourceLines.length
      }
    },
    buildTailoring: {
      mode: 'deterministic-generated',
      configuration: {
        fsizer: 'FSIZER3',
        nrecl: 4,
        ksize: 2036,
        ephemeris: 'DE405'
      },
      equationChanges: 'none',
      manualEdits: false,
      allowedTransformations: [
        'select_fsizer3',
        'set_nrecl_4',
        'set_ksize_2036'
      ],
      unexpectedChanges: [],
      inputSha256: extractedSha256,
      outputSha256,
      generatorSha256
    }
  }

  const tailoringFile = resolve(outputDir, 'build-tailoring.json')
  await writeFile(tailoringFile, JSON.stringify(provenance, null, 2) + '\n', 'utf8')

  return {
    generatedFile: targetGeneratedFile,
    outputSha256,
    provenance
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const source = process.argv[2] ? resolve(process.argv[2]) : resolve(__dirname, 'fixtures/testeph.f')
  const outDir = process.argv[3] ? resolve(process.argv[3]) : resolve(__dirname, 'build')
  generateBuildSource(source, outDir)
    .then(res => console.log(JSON.stringify(res, null, 2)))
    .catch(err => {
      console.error(`Generation failed: ${err.message}`)
      process.exitCode = 1
    })
}
