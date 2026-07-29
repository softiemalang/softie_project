C=======================================================================
C DE405 JPL Canonical v2 Native Runner
C Wrapper program for official JPL testeph.f ephemeris reader
C=======================================================================
      PROGRAM DE405_JPL_RUNNER
      IMPLICIT NONE

      LOGICAL KM, BARY
      DOUBLE PRECISION PVSUN(6)
      COMMON/STCOMX/KM,BARY,PVSUN

      CHARACTER*512 ARG, MODE, BINARY_FILE, OUTPUT_FILE
      CHARACTER*64 START_ET_STR
      INTEGER I, ARGC, ISTAT, COUNT, STEP_SECONDS
      DOUBLE PRECISION ET_START, STEP_SEC, ET_CURR, ET2(2), RRD(6)
      DOUBLE PRECISION JED_START, JED_END, BLOCK_STEP
      CHARACTER*6 CONST_NAMES(400)
      DOUBLE PRECISION CONST_VALS(400), SSS(3)
      INTEGER NCONST

      INTEGER CANONICAL_IDS(10)
      INTEGER JPL_NTARG(10)
      DATA CANONICAL_IDS /1, 2, 4, 5, 6, 7, 8, 9, 10, 301/
      DATA JPL_NTARG     /1, 2, 4, 5, 6, 7, 8, 9, 11,  10/

      INTEGER T_IDX, T_COUNT, ET_IDX
      DOUBLE PRECISION ET_SEC
      INTEGER OUT_UNIT, ERR_CODE

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
      START_ET_STR = '0.0'
      COUNT = 1
      STEP_SEC = 864000.0D0

      I = 2
      DO WHILE (I .LE. ARGC)
        CALL GET_COMMAND_ARGUMENT(I, ARG)
        IF (ARG .EQ. '--binary') THEN
          I = I + 1
          CALL GET_COMMAND_ARGUMENT(I, BINARY_FILE)
        ELSE IF (ARG .EQ. '--output') THEN
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

 100  FORMAT('{"targetId":',I3,',"x":',1PE25.16,',"y":',1PE25.16,
     &       ',"z":',1PE25.16,',"vx":',1PE25.16,',"vy":',1PE25.16,
     &       ',"vz":',1PE25.16,'}')
 200  FORMAT(1PE26.16,',',I3,',',1PE25.16,',',1PE25.16,',',1PE25.16,
     &       ',',1PE25.16,',',1PE25.16,',',1PE25.16)
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


