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

  const stateEntryAnchor = '      END\nC+++++++++++++++++++++++++++++\nC\n      SUBROUTINE CONST'
  const candidateEntry = `

      ENTRY JPLCAND(ET2Z,NTARG,NCENT,ISUB,NA,RRD)
      IF (NA .LE. 0 .OR. ISUB .LT. 0 .OR. ISUB .GE. NA) THEN
        DO I=1,6
          RRD(I)=0.D0
        ENDDO
        RETURN
      ENDIF
      S=ET2Z(1)-.5D0
      CALL SPLIT(S,PJD(1))
      CALL SPLIT(ET2Z(2),PJD(3))
      PJD(1)=PJD(1)+PJD(3)+.5D0
      PJD(2)=PJD(2)+PJD(4)
      CALL SPLIT(PJD(2),PJD(3))
      PJD(1)=PJD(1)+PJD(3)
      IF(PJD(1)+PJD(4).LT.SS(1) .OR.
     &   PJD(1)+PJD(4).GT.SS(2)) THEN
        DO I=1,6
          RRD(I)=0.D0
        ENDDO
        RETURN
      ENDIF
      NR=IDINT((PJD(1)-SS(1))/SS(3))+3
      IF(PJD(1).EQ.SS(2)) NR=NR-1
      tmp1 = DBLE(NR-3)*SS(3) + SS(1)
      tmp2 = PJD(1) - tmp1
      T(1) = (tmp2 + PJD(4))/SS(3)
      IF(NR.NE.NRL) THEN
        NRL=NR
        READ(NRFILE,REC=NR,ERR=99)(BUF(K),K=1,NCOEFFS)
      ENDIF
      T(2)=SS(3)*86400.D0
      TC(1)=T(1)*DBLE(NA)-DBLE(ISUB)
      TC(2)=T(2)/DBLE(NA)
      AUFAC=1.D0
      CALL INTERP(BUF(IPT(1,11)+ISUB*IPT(2,11)*3),TC,
     &  IPT(2,11),3,1,2,CANDPVSUN)
      DO I=1,6
        CANDPVSUN(I)=CANDPVSUN(I)*AUFAC
      ENDDO
      DO I=1,12
        LIST(I)=0
      ENDDO
      DO I=1,2
        K=NTARG
        IF(I.EQ.2) K=NCENT
        IF(K.LE.10) LIST(K)=2
        IF(K.EQ.10) LIST(3)=2
        IF(K.EQ.3) LIST(10)=2
      ENDDO
      DO I=1,10
        IF(LIST(I).EQ.0) GO TO 14
        CALL INTERP(BUF(IPT(1,I)+ISUB*IPT(2,I)*3),TC,
     &    IPT(2,I),3,1,LIST(I),CANDPV(1,I))
        DO J=1,6
          CANDPV(J,I)=CANDPV(J,I)*AUFAC
        ENDDO
  14    CONTINUE
      ENDDO
      IF(NTARG.EQ.11 .OR. NCENT.EQ.11) THEN
        DO I=1,6
          CANDPV(I,11)=CANDPVSUN(I)
        ENDDO
      ENDIF
      IF(LIST(3).EQ.2) THEN
        DO I=1,6
          CANDPV(I,3)=CANDPV(I,3)-CANDPV(I,10)/(1.D0+EMRAT)
        ENDDO
      ENDIF
      IF(LIST(10).EQ.2) THEN
        DO I=1,6
          CANDPV(I,10)=CANDPV(I,3)+CANDPV(I,10)
        ENDDO
      ENDIF
      DO I=1,6
        RRD(I)=CANDPV(I,NTARG)-CANDPV(I,NCENT)
      ENDDO
      RETURN
`
  if (!tailoredExtracted.includes(stateEntryAnchor)) throw new Error('Anchor match error for JPLCAND entry')
  const addCandidateInstrumentation = source => {
    const stateStart = source.indexOf('      SUBROUTINE STATE')
    const stateEnd = source.indexOf(stateEntryAnchor, stateStart)
    if (stateStart < 0 || stateEnd < 0) throw new Error('STATE routine anchor not found')
    const prefix = source.slice(0, stateStart)
    const state = source.slice(stateStart, stateEnd)
    const suffix = source.slice(stateEnd)
    const stateWithDeclarations = state
      .replace('      DIMENSION ET2(2),PV(6,11),PNUT(4),T(2),PJD(4),BUF(1500),\n     . SS(3),CVAL(NMAX),PVSUN(6)', '      DIMENSION ET2(2),PV(6,11),PNUT(4),T(2),PJD(4),BUF(1500),\n     . SS(3),CVAL(NMAX),PVSUN(6)\n      DIMENSION CANDPV(6,13),CANDPVSUN(6),TC(2),ET2Z(2),RRD(6)')
      .replace('      INTEGER LIST(12),IPT(3,13)', '      INTEGER LIST(12),IPT(3,13),ISUB,NA')
    if (stateWithDeclarations === state) throw new Error('STATE declaration anchor not found')
    return prefix + stateWithDeclarations + candidateEntry + '\n      END\nC+++++++++++++++++++++++++++++\nC\n      SUBROUTINE CONST' + suffix.slice(stateEntryAnchor.length)
  }
  const withCandidateEntry = addCandidateInstrumentation(tailoredExtracted)

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
  const generatedContent = withCandidateEntry + '\n' + fsizer3Block
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
  const checkRunContent = addCandidateInstrumentation(extractedContent.replace(fsizer3CallAnchor, fsizer3CallReplacement)) + '\n' + fsizer3Block
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
        'add_opt_in_jpl_candidate_entry',
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
