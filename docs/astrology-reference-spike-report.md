# Independent Reference Spike Report · Astro-0.75

기준일: 2026-07-26
상태: `reference_spike_not_golden_fixture`

## 목적

Swiss Ephemeris와 Placalc를 링크하지 않은 Astrolog house 계산이
ASC·MC·Placidus Tier C 기준 후보로 재현 가능한지 확인했다. 제품 `src/`에는
연결하지 않았다.

## Source provenance

- source: [Astrolog 8.00](https://github.com/CruiserOne/Astrolog)
- commit: `5bf172ea231c4b6ea3d7e09ca307571354a41e8a`
- release: 2026-05-31
- license: GPL-2.0-or-later
- build host: macOS 26.5.2 arm64
- compiler: Apple clang 21.0.0 (`clang-2100.1.1.101`)

## Build

실행:

```sh
ASTROLOG_SRC=/tmp/softie-astro05-toolchain/astrolog \
  spikes/astrology-independent-reference/scripts/build-matrix-reference.sh
```

핵심 명령:

```sh
clang++ -O2 -w \
  astrolog.cpp atlas.cpp calc.cpp charts0.cpp charts1.cpp charts2.cpp \
  charts3.cpp data.cpp express.cpp general.cpp intrpret.cpp io.cpp \
  matrix.cpp -lm -o <generated>/astrolog-matrix
```

비활성 define:

- `SWISS`
- `PLACALC`
- `JPLWEB`
- `X11`
- `GRAPH`, `PS`, `META`, `SVG`, `WIRE`

Swiss/Placalc source와 header는 copied source allowlist에 포함하지 않았다.
`nm -u`에서 `swe|placalc` symbol이 없음을 확인했다.

## Artifact

- executable SHA-256:
  `7f1231a43c89ad2e2a89c08d74e3ca8252ea023f8679fabae9f39de4bb439f3a`
- 동일 output path 2회 build: SHA-256 일치
- linked runtime: macOS `libSystem`, `libc++`
- executable tracked in Git: no
- external source tracked in Git: no

## Fixture command

각 fixture는 clean working directory에서 다음 공통 설정으로 2회 실행했다.

```sh
astrolog-matrix -YQ 0 -Yn -b0 -C -c 0 -qa \
  <month> <day> <year> <time> 0 <west-positive-longitude> <latitude> -v
```

- Zone 0, DST off: UTC
- default tropical zodiac
- default geocentric chart
- `-c 0`: Placidus requested
- `-Yn`: Astrolog Matrix true-node mode 관찰
- `-b0 -C -v`: arcsecond ASC/MC/cusp raw output

Astrolog 명령은 west-positive longitude를 사용하므로 동경은 음수로 전달했다.

## Public/synthetic fixtures

| ID | UTC | 좌표 | 결과 |
|---|---|---|---|
| midlatitude | 2000-01-01T12:00:00Z | 0.0, 51.5 | Placidus output, warning 없음 |
| southern | 2000-06-21T12:00:00Z | 151.2, -33.8666667 | Placidus output, warning 없음 |
| highlatitude | 2000-12-21T12:00:00Z | 18.95, 69.65 | polar warning, Porphyry fallback |

실제 사용자 출생정보는 사용하지 않았다.

## 관찰 결과

### Midlatitude

- ASC: `24Ari17'52"` = 24.297777778°
- MC: `9Cap36'52"` = 279.614444444°
- 12 cusp: raw/normalized fixture에 보존
- repeat stdout/stderr: identical

### Southern

- ASC: `5Pis46'24"` = 335.773333333°
- MC: `3Sag13'35"` = 243.226388889°
- 12 cusp: raw/normalized fixture에 보존
- repeat stdout/stderr: identical

### High latitude

- stderr: `The Placidus system of houses is not defined at extreme latitudes.`
- ASC/MC는 관찰되지만 12 cusp는 Porphyry fallback
- `houseSystemEffective: porphyry_fallback`
- Placidus reference로 사용하지 않음
- repeat stdout/stderr: identical

## Raw output와 hash

경로:

- `spikes/astrology-independent-reference/fixtures/raw/`
- `spikes/astrology-independent-reference/fixtures/reference-observations.json`
- `spikes/astrology-independent-reference/fixtures/manifest.json`

SHA-256:

| 파일 | SHA-256 |
|---|---|
| midlatitude stdout | `9e3dd5efa228710f6969f4e1166fa395fed242a5dbdd17657b6fd305c1a5ac9f` |
| southern stdout | `d8ae6bc1ea376142ebb0a5386107ccac50a84c3b40e57002dde80ac9e1c5249a` |
| highlatitude stdout | `174812e516f111ff74aca090a63da5d03e7c7c303f484882a62884f969e34a0e` |
| highlatitude stderr | `df0787883908c957afb0b7df9669043728abae7a25cdbce87eea2dd27f679128` |

## 항목별 판정

- ASC source/provenance: `pass`
- MC source/provenance: `pass`
- Placidus source/provenance: `pass` at supported latitudes
- polar fallback detection: `pass`
- raw output capture: `pass`
- repeat run: `pass`
- repeat build: `pass`
- True Node: `pending`

Astrolog Matrix `Nort` 값은 raw provenance를 위해 보존했지만, Swiss
`SE_TRUE_NODE`와 정의·정확도 동등성이 입증되지 않아 외부 True Node
reference로 채택하지 않았다.

## 한계

- 이 자료는 최종 Golden Fixture가 아니다.
- Swiss 결과와 허용 오차 비교는 Astro-2에서 수행한다.
- Astrolog Matrix 행성 위치는 검증 기준으로 사용하지 않는다.
- Astrolog 자체의 Placidus 수치 정확도는 Astro-2에서 별도 대조한다.
- GPL executable은 내부 Spike에서만 생성했고 저장소에 포함하지 않았다.
