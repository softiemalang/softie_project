C=======================================================================
C DE405 JPL Canonical v2 Native Runner
C Wrapper program for official JPL testeph.f ephemeris reader
C=======================================================================
      PROGRAM DE405_JPL_RUNNER
      IMPLICIT NONE

      LOGICAL KM, BARY
      DOUBLE PRECISION PVSUN(6)
      COMMON/STCOMX/KM,BARY,PVSUN

      CHARACTER*512 ARG, MODE, BINARY_FILE, OUTPUT_FILE, INPUT_FILE
      CHARACTER*64 START_ET_STR
      CHARACTER*4096 LINE
      CHARACTER*512 SAMPLE_ID, ET_HEX
      INTEGER I, ARGC, ISTAT, COUNT, STEP_SECONDS, IN_UNIT
      DOUBLE PRECISION ET_START, STEP_SEC, ET_CURR, ET2(2), RRD(6)
      DOUBLE PRECISION JED_START, JED_END, BLOCK_STEP
      CHARACTER*6 CONST_NAMES(400)
      DOUBLE PRECISION CONST_VALS(400), SSS(3)

      INTEGER CANONICAL_IDS(10)
      INTEGER JPL_NTARG(10)
      DATA CANONICAL_IDS /1, 2, 4, 5, 6, 7, 8, 9, 10, 301/
      DATA JPL_NTARG     /1, 2, 4, 5, 6, 7, 8, 9, 11,  10/

      INTEGER T_IDX, T_COUNT, ET_IDX
      DOUBLE PRECISION ET_SEC
      INTEGER OUT_UNIT, ERR_CODE
      INTEGER QUERY_TARGET, QUERY_CENTER, QUERY_FRAME, JPL_TARGET
      INTEGER JPL_OUTER_RECORD, JPL_SUBINTERVAL, JPL_SUBINTERVAL_COUNT
      INTEGER CAND_IDX
      DOUBLE PRECISION QUERY_JED, QUERY_NORMALIZED, TMP_RECORD_START
      DOUBLE PRECISION CAND_START, CAND_END
      LOGICAL BATCH_MODE, OK, CANDIDATE_EVIDENCE_MODE
      DOUBLE PRECISION CVAL(1000), SS_HEADER(3), AU, EMRAT
      INTEGER DENUM, NCONST, IPT(3,13)
      COMMON/EPHHDR/CVAL,SS_HEADER,AU,EMRAT,DENUM,NCONST,IPT

      KM = .TRUE.
      BARY = .FALSE.

      ARGC = COMMAND_ARGUMENT_COUNT()
      IF (ARGC .LT. 1) THEN
        WRITE(*, '(A)') '{"error":"mode required"}'
        STOP 2
      ENDIF

      CALL GET_COMMAND_ARGUMENT(1, MODE)

      IF (MODE .EQ. '--version') THEN
        WRITE(*, '(A)') '{"runnerVersion":"de405-jpl-canonical-v2-runne'
     & // 'r","jplReaderVersion":"testeph.f","testOnly":false}'
        STOP 0
      ENDIF

      IF (MODE .EQ. '--metadata') THEN
        WRITE(*, '(A)') '{"runnerVersion":"de405-jpl-canonical-v2-runne'
     & // 'r","readerSourceSha256":"18f32f073c1a345850d9deebc8b53b06c83'
     & // 'a386c066b566f65001b51adeb7120","jplBinarySize":55900416,"jpl'
     & // 'BinarySha256":"7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae'
     & // '5d1485a42913cf175e7","KSIZE":2036,"NRECL":4,"KM":true,"entry'
     & // 'Point":"DPLEPH","fallbackAllowed":false,"observer":"EARTH",'
     & // '"observerId":399,"frame":"J2000","positionUnit":"km","velo'
     & // 'cityUnit":"km/s"}'
        STOP 0
      ENDIF

      BINARY_FILE = 'lnxp1600p2200.405'
      OUTPUT_FILE = 'stdout'
      INPUT_FILE = 'stdin'
      START_ET_STR = '0.0'
      COUNT = 1
      STEP_SEC = 864000.0D0
      BATCH_MODE = .FALSE.
      CANDIDATE_EVIDENCE_MODE = .FALSE.
      IF (MODE .EQ. '--evaluate-et-batch') BATCH_MODE = .TRUE.

      I = 2
      DO WHILE (I .LE. ARGC)
        CALL GET_COMMAND_ARGUMENT(I, ARG)
        IF (ARG .EQ. '--binary') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, BINARY_FILE)
        ELSE IF (ARG .EQ. '--output' .OR. ARG .EQ. '--output-jsonl') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, OUTPUT_FILE)
        ELSE IF (ARG .EQ. '--start-et') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, START_ET_STR)
          READ(START_ET_STR, *, IOSTAT=ISTAT) ET_START
        ELSE IF (ARG .EQ. '--count') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, ARG)
          READ(ARG, *, IOSTAT=ISTAT) COUNT
        ELSE IF (ARG .EQ. '--step-seconds') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, ARG)
          READ(ARG, *, IOSTAT=ISTAT) STEP_SEC
        ELSE IF (ARG .EQ. '--input-jsonl') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, INPUT_FILE)
        ELSE IF (ARG .EQ. '--candidate-evidence') THEN
          CANDIDATE_EVIDENCE_MODE = .TRUE.
        ENDIF
        I = I + 1
      ENDDO

C Open binary file via STROPEN or direct Fortran OPEN if needed by PLEPH
      CALL FOPEN_JPL(BINARY_FILE)

      KM = .TRUE.
      CALL CONST(CONST_NAMES, CONST_VALS, SSS, NCONST)
      JED_START = SSS(1)
      JED_END = SSS(2)
      BLOCK_STEP = SSS(3)

      IF (BATCH_MODE) THEN
        IN_UNIT = 20
        IF (INPUT_FILE .EQ. 'stdin') THEN
          IN_UNIT = 5
        ELSE
          OPEN(UNIT=IN_UNIT, FILE=INPUT_FILE, STATUS='OLD',
     &         ACTION='READ', IOSTAT=ISTAT)
          IF (ISTAT .NE. 0) THEN
            WRITE(0, '(A)') 'Failed to open batch input file: '//
     &        TRIM(INPUT_FILE)
            STOP 1
          ENDIF
        ENDIF
        OUT_UNIT = 6
        IF (OUTPUT_FILE .NE. 'stdout') THEN
          OUT_UNIT = 10
          OPEN(UNIT=OUT_UNIT, FILE=OUTPUT_FILE, STATUS='UNKNOWN',
     &         ACTION='WRITE', IOSTAT=ISTAT)
          IF (ISTAT .NE. 0) THEN
            WRITE(0, '(A)') 'Failed to open batch output file: '//
     &        TRIM(OUTPUT_FILE)
            STOP 1
          ENDIF
        ENDIF
        ERR_CODE = 0
  250   READ(IN_UNIT, '(A)', IOSTAT=ISTAT) LINE
        IF (ISTAT .NE. 0) GO TO 290
        IF (LEN_TRIM(LINE) .EQ. 0) GO TO 250
        CALL GET_STRING_FIELD(LINE, 'sampleId', SAMPLE_ID, OK)
        IF (.NOT. OK) THEN
          ERR_CODE = 1
          GO TO 250
        ENDIF
        CALL GET_STRING_FIELD(LINE, 'queryEtHex', ET_HEX, OK)
        CALL GET_DOUBLE_FIELD(LINE, 'queryEt', ET_SEC, OK)
        IF (.NOT. OK) THEN
          ERR_CODE = 1
          GO TO 250
        ENDIF
        CALL GET_INTEGER_FIELD(LINE, 'targetId', QUERY_TARGET, OK)
        IF (.NOT. OK) THEN
          ERR_CODE = 1
          GO TO 250
        ENDIF
        CALL GET_INTEGER_FIELD(LINE, 'centerId', QUERY_CENTER, OK)
        IF (.NOT. OK) QUERY_CENTER = 399
        CALL GET_INTEGER_FIELD(LINE, 'frameId', QUERY_FRAME, OK)
        IF (.NOT. OK) QUERY_FRAME = 1
        IF (QUERY_TARGET .EQ. 301) THEN
          JPL_TARGET = 10
        ELSE IF (QUERY_TARGET .EQ. 10) THEN
          JPL_TARGET = 11
        ELSE
          JPL_TARGET = QUERY_TARGET
        ENDIF
        QUERY_JED = 2451545.0D0 + ET_SEC / 86400.0D0
        IF (QUERY_JED .LT. JED_START .OR. QUERY_JED .GT. JED_END) THEN
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      '{"schemaVersion":1,"recordType":"de405_jpl_batch_state",'
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      '"sampleId":"'//TRIM(SAMPLE_ID)//'","queryEt":'
          WRITE(OUT_UNIT, '(1PE30.17,A)', ADVANCE='NO') ET_SEC,
     &      ',"queryEtHex":"'//TRIM(ET_HEX)//'","targetId":'
          WRITE(OUT_UNIT, '(I0,A,I0,A,I0,A)', ADVANCE='NO') QUERY_TARGET,
     &      ',"centerId":', QUERY_CENTER, ',"frameId":', QUERY_FRAME,
     &      ',"jplOuterRecordIndex":null,"jplTargetId":',
     &      JPL_TARGET
          WRITE(OUT_UNIT, '(A)')
     &      ',"jplSubintervalIndex":null,"jplSubintervalCount":null,'//
     &      '"normalizedTime":null,"evaluationStatus":"out_of_coverage",'//
     &      '"stateKmKmPerSec":null}'
          GO TO 250
        ENDIF
        JPL_OUTER_RECORD = IDINT((QUERY_JED-JED_START)/BLOCK_STEP)
        TMP_RECORD_START = DBLE(JPL_OUTER_RECORD)*BLOCK_STEP+JED_START
        QUERY_NORMALIZED = (QUERY_JED-TMP_RECORD_START)/BLOCK_STEP
        IF (QUERY_NORMALIZED .LT. 0.0D0) QUERY_NORMALIZED = 0.0D0
        IF (QUERY_NORMALIZED .GE. 1.0D0) QUERY_NORMALIZED = 1.0D0-
     &    1.0D-15
        JPL_SUBINTERVAL_COUNT = IPT(3,JPL_TARGET)
        JPL_SUBINTERVAL = IDINT(QUERY_NORMALIZED*
     &    DBLE(JPL_SUBINTERVAL_COUNT))
        IF (JPL_SUBINTERVAL .GE. JPL_SUBINTERVAL_COUNT)
     &    JPL_SUBINTERVAL = JPL_SUBINTERVAL_COUNT-1
        ET2(1) = 2451545.0D0
        ET2(2) = ET_SEC / 86400.0D0
        KM = .TRUE.
        CALL DPLEPH(ET2, JPL_TARGET, 3, RRD)
        WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &    '{"schemaVersion":1,"recordType":"de405_jpl_batch_state",'
        WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &    '"sampleId":"'//TRIM(SAMPLE_ID)//'","queryEt":'
        WRITE(OUT_UNIT, '(1PE30.17,A)', ADVANCE='NO') ET_SEC,
     &    ',"queryEtHex":"'//TRIM(ET_HEX)//'","targetId":'
        WRITE(OUT_UNIT, '(I0,A,I0,A,I0,A,I0,A,I0,A,I0,A,I0,A)',
     &    ADVANCE='NO') QUERY_TARGET, ',"centerId":', QUERY_CENTER,
     &    ',"frameId":', QUERY_FRAME, ',"jplOuterRecordIndex":',
     &    JPL_OUTER_RECORD, ',"jplTargetId":', JPL_TARGET,
     &    ',"jplSubintervalIndex":', JPL_SUBINTERVAL,
     &    ',"jplSubintervalCount":', JPL_SUBINTERVAL_COUNT,
     &    ',"normalizedTime":'
        WRITE(OUT_UNIT, '(1PE30.17,A)', ADVANCE='NO') QUERY_NORMALIZED,
     &    ',"evaluationStatus":"evaluated","stateKmKmPerSec":['
        WRITE(OUT_UNIT, '(1PE30.17,A,1PE30.17,A,1PE30.17,A,1PE30.17,A,
     &    1PE30.17,A,1PE30.17,A)', ADVANCE='NO') RRD(1), ',', RRD(2), ',', RRD(3),
     &    ',', RRD(4), ',', RRD(5), ',', RRD(6), ']'
        IF (CANDIDATE_EVIDENCE_MODE) THEN
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      ',"candidateStates":['
          CAND_IDX = JPL_SUBINTERVAL
          CAND_START = (TMP_RECORD_START +
     &      DBLE(CAND_IDX) * BLOCK_STEP /
     &      DBLE(JPL_SUBINTERVAL_COUNT) - 2451545.0D0) * 86400.D0
          CAND_END = (TMP_RECORD_START +
     &      DBLE(CAND_IDX + 1) * BLOCK_STEP /
     &      DBLE(JPL_SUBINTERVAL_COUNT) - 2451545.0D0) * 86400.D0
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      '{"candidateIndex":0,"candidateId":"jpl:'
          WRITE(OUT_UNIT, '(I0,A,I0,A)', ADVANCE='NO')
     &      JPL_OUTER_RECORD, ':subinterval:', CAND_IDX,
     &      '","recordId":"'
          WRITE(OUT_UNIT, '(I0,A,I0,A,1PE30.17,A,1PE30.17,A)',
     &      ADVANCE='NO') JPL_OUTER_RECORD,
     &      '","subintervalIndex":', CAND_IDX,
     &      ',"startEt":', CAND_START, ',"endEt":', CAND_END, ','
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      '"selected":true,"selectionReason":"official_jpl_subinterval",'
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO')
     &      '"boundaryRule":"subinterval_start_le_query_lt_end",'
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO') '"positionKm":['
          WRITE(OUT_UNIT, '(1PE30.17,A,1PE30.17,A,1PE30.17,A)',
     &      ADVANCE='NO') RRD(1), ',', RRD(2), ',', RRD(3), ']'
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO') ',"velocityKmS":['
          WRITE(OUT_UNIT, '(1PE30.17,A,1PE30.17,A,1PE30.17,A)',
     &      ADVANCE='NO') RRD(4), ',', RRD(5), ',', RRD(6), ']}'
          WRITE(OUT_UNIT, '(A)', ADVANCE='NO') ']'
        ENDIF
        WRITE(OUT_UNIT, '(A)') '}'
        GO TO 250
  290   IF (INPUT_FILE .NE. 'stdin') CLOSE(IN_UNIT)
        IF (OUTPUT_FILE .NE. 'stdout') CLOSE(OUT_UNIT)
        IF (ERR_CODE .NE. 0) STOP 1
        STOP 0
      ENDIF

      IF (MODE .EQ. '--probe') THEN
        ET_SEC = 0.0D0
        ET2(1) = 2451545.0D0
        ET2(2) = ET_SEC / 86400.0D0

        WRITE(*, '(A)', ADVANCE='NO') '['
        DO T_IDX = 1, 10
          KM = .TRUE.
          CALL DPLEPH(ET2, JPL_NTARG(T_IDX), 3, RRD)
          IF (T_IDX .GT. 1) WRITE(*, '(A)', ADVANCE='NO') ','
          WRITE(*, 100, ADVANCE='NO') CANONICAL_IDS(T_IDX),
     &      RRD(1), RRD(2), RRD(3), RRD(4), RRD(5), RRD(6)
        ENDDO
        WRITE(*, '(A)') ']'
        STOP 0
      ENDIF

      IF (MODE .NE. '--stream-jpl-states') THEN
        WRITE(0, '(A)') 'Unknown mode: ' // TRIM(MODE)
        STOP 1
      ENDIF

      OUT_UNIT = 10
      IF (OUTPUT_FILE .EQ. 'stdout') THEN
        OUT_UNIT = 6
      ELSE
        OPEN(UNIT=OUT_UNIT, FILE=OUTPUT_FILE, STATUS='UNKNOWN',
     &       ACTION='WRITE', IOSTAT=ISTAT)
        IF (ISTAT .NE. 0) THEN
          WRITE(0, '(A)') 'Failed to open output file: '//
     &      TRIM(OUTPUT_FILE)
          STOP 1
        ENDIF
      ENDIF

      DO ET_IDX = 0, COUNT - 1
        ET_CURR = ET_START + DBLE(ET_IDX) * STEP_SEC
        ET2(1) = 2451545.0D0
        ET2(2) = ET_CURR / 86400.0D0

C Coverage check
        IF (ET2(1) + ET2(2) .LT. JED_START .OR.
     &      ET2(1) + ET2(2) .GT. JED_END) THEN
          WRITE(0, '(A)') 'Requested ET outside JPL binary coverage'
          STOP 1
        ENDIF

        DO T_IDX = 1, 10
          KM = .TRUE.
          CALL DPLEPH(ET2, JPL_NTARG(T_IDX), 3, RRD)

C Output raw CSV line: etSeconds,targetId,x,y,z,vx,vy,vz
          WRITE(OUT_UNIT, 200) ET_CURR, CANONICAL_IDS(T_IDX),
     &      RRD(1), RRD(2), RRD(3), RRD(4), RRD(5), RRD(6)
        ENDDO
      ENDDO

      IF (OUT_UNIT .NE. 6) CLOSE(OUT_UNIT)
      STOP 0

 100  FORMAT('{"targetId":',I3,',"x":',1PE30.17,',"y":',1PE30.17,
     &       ',"z":',1PE30.17,',"vx":',1PE30.17,',"vy":',1PE30.17,
     &       ',"vz":',1PE30.17,'}')
 200  FORMAT(1PE30.17,',',I3,',',1PE30.17,',',1PE30.17,',',1PE30.17,
     &       ',',1PE30.17,',',1PE30.17,',',1PE30.17)
      END

C Parse the small, fixed JSONL query contract without introducing a JSON library.
      SUBROUTINE GET_STRING_FIELD(LINE, FIELD, VALUE, OK)
      IMPLICIT NONE
      CHARACTER*(*) LINE, FIELD, VALUE
      CHARACTER*128 PREFIX
      INTEGER POS, START, FINISH, PREFIX_LEN
      LOGICAL OK
      OK = .FALSE.
      VALUE = ' '
      PREFIX = '"'//TRIM(FIELD)//'":"'
      PREFIX_LEN = LEN_TRIM(PREFIX)
      POS = INDEX(LINE, PREFIX(1:PREFIX_LEN))
      IF (POS .LE. 0) RETURN
      START = POS + PREFIX_LEN
      FINISH = INDEX(LINE(START:), '"')
      IF (FINISH .LE. 0) RETURN
      FINISH = START + FINISH - 2
      IF (FINISH .LT. START) RETURN
      VALUE = LINE(START:MIN(FINISH, START+LEN(VALUE)-1))
      OK = .TRUE.
      RETURN
      END

      SUBROUTINE GET_DOUBLE_FIELD(LINE, FIELD, VALUE, OK)
      IMPLICIT NONE
      CHARACTER*(*) LINE, FIELD
      CHARACTER*128 PREFIX
      CHARACTER*128 TOKEN
      DOUBLE PRECISION VALUE
      INTEGER POS, START, FINISH, PREFIX_LEN, ISTAT
      LOGICAL OK
      OK = .FALSE.
      PREFIX = '"'//TRIM(FIELD)//'":'
      PREFIX_LEN = LEN_TRIM(PREFIX)
      POS = INDEX(LINE, PREFIX(1:PREFIX_LEN))
      IF (POS .LE. 0) RETURN
      START = POS + PREFIX_LEN
      FINISH = INDEX(LINE(START:), ',')
      IF (FINISH .LE. 0) FINISH = INDEX(LINE(START:), '}')
      IF (FINISH .LE. 0) RETURN
      FINISH = START + FINISH - 2
      TOKEN = ' '
      TOKEN = LINE(START:MIN(FINISH,START+LEN(TOKEN)-1))
      READ(TOKEN, *, IOSTAT=ISTAT) VALUE
      IF (ISTAT .EQ. 0) OK = .TRUE.
      RETURN
      END

      SUBROUTINE GET_INTEGER_FIELD(LINE, FIELD, VALUE, OK)
      IMPLICIT NONE
      CHARACTER*(*) LINE, FIELD
      CHARACTER*128 PREFIX
      CHARACTER*128 TOKEN
      INTEGER VALUE, POS, START, FINISH, PREFIX_LEN, ISTAT
      LOGICAL OK
      OK = .FALSE.
      PREFIX = '"'//TRIM(FIELD)//'":'
      PREFIX_LEN = LEN_TRIM(PREFIX)
      POS = INDEX(LINE, PREFIX(1:PREFIX_LEN))
      IF (POS .LE. 0) RETURN
      START = POS + PREFIX_LEN
      FINISH = INDEX(LINE(START:), ',')
      IF (FINISH .LE. 0) FINISH = INDEX(LINE(START:), '}')
      IF (FINISH .LE. 0) RETURN
      FINISH = START + FINISH - 2
      TOKEN = ' '
      TOKEN = LINE(START:MIN(FINISH,START+LEN(TOKEN)-1))
      READ(TOKEN, *, IOSTAT=ISTAT) VALUE
      IF (ISTAT .EQ. 0) OK = .TRUE.
      RETURN
      END

C Helper to open JPLEPH binary file using unit 12 (expected by testeph STATE)
      SUBROUTINE FOPEN_JPL(FILENAME)
      IMPLICIT NONE
      CHARACTER*(*) FILENAME
      CHARACTER*1024 CMD
      INTEGER ISTAT
C Ensure JPLEPH points to FILENAME if FILENAME is not 'JPLEPH'
      IF (TRIM(FILENAME) .NE. 'JPLEPH') THEN
        WRITE(0, '(A)') 'FATAL: FILENAME must be JPLEPH. Use run.mjs wrapper.'
        STOP 1
      ENDIF
      CLOSE(12)
      OPEN(UNIT=12, FILE='JPLEPH', ACCESS='DIRECT', RECL=8144,
     &     FORM='UNFORMATTED', STATUS='OLD', IOSTAT=ISTAT)
      IF (ISTAT .NE. 0) THEN
        WRITE(0, '(A)') 'Error opening JPL binary file: ' //
     &    TRIM(FILENAME)
        STOP 1
      ENDIF
      END
